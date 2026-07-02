# 新签解约统计接口开发文档

## 1. 接口目标

在任意后端服务中实现与当前“新签解约统计”页面一致的数据接口，重点输出页面中“运营汇总”板块的数据。

该接口连接同一个 MongoDB 数据库，读取 `shops` 集合，按统计月份汇总每个运营在“本月 + 上月签约店铺”中的解约情况。

## 2. 接口定义

```text
GET /api/termination/recent-signed-stats?month=YYYY-MM
```

### 请求参数

| 参数 | 类型 | 必填 | 示例 | 说明 |
|---|---:|---:|---|---|
| `month` | string | 否 | `2026-06` | 统计月份。格式必须是 `YYYY-MM`。不传时可默认当前月。 |

### 参数校验

- `month` 必须匹配正则：`^\d{4}-\d{2}$`
- 月份数字必须在 `01` 到 `12` 之间
- 校验失败时返回 `400`

```json
{
  "message": "month 参数无效"
}
```

## 3. 数据库连接

### 数据库

- 数据库类型：MongoDB
- 连接目标：项目统一云数据库
- 集合名称：`shops`

> 实现时使用项目提供的正式 `MONGODB_URI` 环境变量。禁止连接旧端口或其他测试库，避免统计结果与现有系统不一致。

### 依赖字段

| 字段 | 类型 | 用途 |
|---|---|---|
| `_id` | ObjectId | 明细唯一 ID 兜底 |
| `shopName` | string | 店铺明细展示 |
| `merchantId` | string | 店铺明细展示和核对 |
| `deliveryPlatform` | string | 店铺明细展示和筛选 |
| `operatorName` | string | 运营分组字段 |
| `contractSignedDate` | Date | 判断是否属于两个月签约范围 |
| `shopStatus` | string | 判断是否为已解约 |
| `terminationDate` | Date | 判断是否在统计月份解约 |
| `terminationCooperationDays` | number/null | 店铺明细展示 |

## 4. 时间口径

所有日期范围按中国时区 `Asia/Shanghai` 计算。

### 统计月份示例：`2026-06`

| 范围 | 开始 | 结束 | 说明 |
|---|---|---|---|
| 签约范围 | `2026-05-01 00:00:00 +08:00` | `< 2026-07-01 00:00:00 +08:00` | 只看上月 + 本月签约店铺 |
| 解约范围 | `2026-06-01 00:00:00 +08:00` | `< 2026-07-01 00:00:00 +08:00` | 只看统计月份内解约 |

对外响应中日期范围建议展示为闭区间：

```json
{
  "signedMonthRange": {
    "startMonth": "2026-05",
    "endMonth": "2026-06",
    "startDate": "2026-05-01",
    "endDate": "2026-06-30"
  },
  "terminationDateRange": {
    "startDate": "2026-06-01",
    "endDate": "2026-06-30"
  }
}
```

## 5. 查询策略

后端先按两个月签约范围拉取候选店铺：

```js
db.shops.find(
  {
    contractSignedDate: {
      $gte: twoMonthSignedStart,
      $lt: twoMonthSignedEnd
    }
  },
  {
    _id: 1,
    shopName: 1,
    merchantId: 1,
    deliveryPlatform: 1,
    operatorName: 1,
    contractSignedDate: 1,
    shopStatus: 1,
    terminationDate: 1,
    terminationCooperationDays: 1
  }
)
```

推荐先查两个月签约候选集，再在业务层计算“运营汇总”和“店铺明细”。这样可以保证“两个月总数”和“解约数量”基于同一个候选范围。

## 6. 运营汇总计算规则

“运营汇总”板块每一行对应一个运营人员。

### 字段定义

| 字段 | 类型 | 页面列名 | 计算方式 |
|---|---:|---|---|
| `operatorName` | string | 运营人员 | 使用店铺 `operatorName`，为空或空白字符串时统一为 `未分配` |
| `count` | number | 解约数量 | 两个月签约候选店铺中，`shopStatus = 已解约` 且 `terminationDate` 在统计月份内的数量 |
| `twoMonthSignedShopCount` | number | 两个月总数 | 该运营在两个月签约范围内的全部店铺数量，不限制店铺状态 |
| `terminationRate` | number | 解约率 | `count / twoMonthSignedShopCount`，接口返回小数，例如 `0.25` |

### 前端展示格式

`terminationRate` 在页面展示为百分比整数：

```js
`${Math.round(terminationRate * 100)}%`
```

示例：

| count | twoMonthSignedShopCount | terminationRate | 页面展示 |
|---:|---:|---:|---|
| 1 | 4 | `0.25` | `25%` |
| 2 | 2 | `1` | `100%` |
| 0 | 5 | `0` | `0%` |

### 分组规则

1. 遍历两个月签约候选店铺，按 `operatorName` 聚合 `twoMonthSignedShopCount`。
2. 从候选店铺中筛选解约店铺，按 `operatorName` 聚合 `count`。
3. 运营集合取两类聚合结果的并集，生成 `operatorStats`。
4. 每个运营计算 `terminationRate = count / twoMonthSignedShopCount`。

### 排序规则

`operatorStats` 按以下顺序排序：

1. `count` 降序
2. `twoMonthSignedShopCount` 降序
3. `operatorName` 中文升序

## 7. 店铺明细计算规则

`shops` 明细只包含满足以下条件的店铺：

```text
1. contractSignedDate 在上月 + 本月范围内
2. shopStatus = 已解约
3. terminationDate 在统计月份内
4. contractSignedDate 有效
5. terminationDate 有效
```

明细字段：

| 字段 | 来源 | 处理规则 |
|---|---|---|
| `id` | `_id` 或 `merchantId` | `_id` 为空时用 `merchantId` 兜底 |
| `shopName` | `shopName` | 空值返回空字符串 |
| `merchantId` | `merchantId` | 空值返回空字符串 |
| `deliveryPlatform` | `deliveryPlatform` | 空值返回空字符串 |
| `operatorName` | `operatorName` | 空值统一返回 `未分配` |
| `contractSignedDate` | `contractSignedDate` | 格式化为 `YYYY-MM-DD` |
| `terminationDate` | `terminationDate` | 格式化为 `YYYY-MM-DD` |
| `terminationCooperationDays` | `terminationCooperationDays` | 非数字返回 `null` |

明细排序：

1. `terminationDate` 降序
2. `shopName` 中文升序

## 8. 响应结构

```ts
type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: Array<{
    operatorName: string;
    count: number;
    twoMonthSignedShopCount: number;
    terminationRate: number;
  }>;
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};
```

### 汇总字段说明

| 字段 | 说明 |
|---|---|
| `totalTerminatedCount` | 满足新签解约口径的店铺总数，即 `shops.length` |
| `twoMonthSignedShopCount` | 两个月签约候选店铺总数，不限制是否解约 |
| `operatorCount` | `operatorStats.length` |
| `operatorStats` | 运营汇总板块数据 |
| `shops` | 店铺明细数据 |

## 9. 响应示例

```json
{
  "month": "2026-06",
  "signedMonthRange": {
    "startMonth": "2026-05",
    "endMonth": "2026-06",
    "startDate": "2026-05-01",
    "endDate": "2026-06-30"
  },
  "twoMonthSignedRange": {
    "startMonth": "2026-05",
    "endMonth": "2026-06",
    "startDate": "2026-05-01",
    "endDate": "2026-06-30"
  },
  "totalTerminatedCount": 3,
  "twoMonthSignedShopCount": 5,
  "operatorCount": 4,
  "operatorStats": [
    {
      "operatorName": "张三",
      "count": 2,
      "twoMonthSignedShopCount": 2,
      "terminationRate": 1
    },
    {
      "operatorName": "未分配",
      "count": 1,
      "twoMonthSignedShopCount": 1,
      "terminationRate": 1
    },
    {
      "operatorName": "王五",
      "count": 0,
      "twoMonthSignedShopCount": 1,
      "terminationRate": 0
    }
  ],
  "shops": [
    {
      "id": "shop-2",
      "shopName": "6月签约6月解约",
      "merchantId": "1002",
      "deliveryPlatform": "饿了么餐饮",
      "operatorName": "张三",
      "contractSignedDate": "2026-06-03",
      "terminationDate": "2026-06-20",
      "terminationCooperationDays": 18
    }
  ]
}
```

## 10. 参考实现伪代码

```ts
function normalizeText(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function operatorOf(shop: Shop) {
  return normalizeText(shop.operatorName) || "未分配";
}

function isInClosedDateKeyRange(dateKey: string, start: string, end: string) {
  return dateKey >= start && dateKey <= end;
}

function buildReport(month: string, shops: Shop[]) {
  const range = buildMonthRange(month);

  const twoMonthSignedShops = shops.filter((shop) => {
    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    return isInClosedDateKeyRange(
      signedDateKey,
      range.twoMonthSignedRange.startDate,
      range.twoMonthSignedRange.endDate
    );
  });

  const terminatedShops = twoMonthSignedShops.filter((shop) => {
    if (normalizeText(shop.shopStatus) !== "已解约") return false;
    if (!shop.contractSignedDate || !shop.terminationDate) return false;

    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    const terminationDateKey = formatShanghaiDateKey(shop.terminationDate);

    return (
      isInClosedDateKeyRange(
        signedDateKey,
        range.signedMonthRange.startDate,
        range.signedMonthRange.endDate
      ) &&
      isInClosedDateKeyRange(
        terminationDateKey,
        range.terminationDateRange.startDate,
        range.terminationDateRange.endDate
      )
    );
  });

  const totalByOperator = new Map<string, number>();
  for (const shop of twoMonthSignedShops) {
    const operatorName = operatorOf(shop);
    totalByOperator.set(operatorName, (totalByOperator.get(operatorName) ?? 0) + 1);
  }

  const terminatedByOperator = new Map<string, number>();
  for (const shop of terminatedShops) {
    const operatorName = operatorOf(shop);
    terminatedByOperator.set(operatorName, (terminatedByOperator.get(operatorName) ?? 0) + 1);
  }

  const operatorNames = new Set([
    ...totalByOperator.keys(),
    ...terminatedByOperator.keys()
  ]);

  const operatorStats = [...operatorNames]
    .map((operatorName) => {
      const count = terminatedByOperator.get(operatorName) ?? 0;
      const total = totalByOperator.get(operatorName) ?? 0;

      return {
        operatorName,
        count,
        twoMonthSignedShopCount: total,
        terminationRate: total === 0 ? 0 : count / total
      };
    })
    .sort((a, b) =>
      b.count - a.count ||
      b.twoMonthSignedShopCount - a.twoMonthSignedShopCount ||
      a.operatorName.localeCompare(b.operatorName, "zh-CN")
    );

  return {
    month,
    signedMonthRange: range.signedMonthRange,
    twoMonthSignedRange: range.twoMonthSignedRange,
    totalTerminatedCount: terminatedShops.length,
    twoMonthSignedShopCount: twoMonthSignedShops.length,
    operatorCount: operatorStats.length,
    operatorStats,
    shops: buildShopDetails(terminatedShops)
  };
}
```

## 11. 验收用例

统计 `2026-06` 时：

| 店铺 | 签约日期 | 解约日期 | 状态 | 运营 | 是否计入两个月总数 | 是否计入解约数量 |
|---|---|---|---|---|---|---|
| A | `2026-05-10` | `2026-06-08` | 已解约 | 张三 | 是 | 是 |
| B | `2026-06-03` | `2026-06-20` | 已解约 | 张三 | 是 | 是 |
| C | `2026-05-15` | `2026-06-12` | 已解约 | 空 | 是 | 是，运营归为 `未分配` |
| D | `2026-04-28` | `2026-06-12` | 已解约 | 李四 | 否 | 否 |
| E | `2026-05-15` | `2026-07-01` | 已解约 | 王五 | 是 | 否 |
| F | `2026-06-15` | 空 | 正常 | 赵六 | 是 | 否 |

预期运营汇总：

```json
[
  {
    "operatorName": "张三",
    "count": 2,
    "twoMonthSignedShopCount": 2,
    "terminationRate": 1
  },
  {
    "operatorName": "未分配",
    "count": 1,
    "twoMonthSignedShopCount": 1,
    "terminationRate": 1
  },
  {
    "operatorName": "王五",
    "count": 0,
    "twoMonthSignedShopCount": 1,
    "terminationRate": 0
  },
  {
    "operatorName": "赵六",
    "count": 0,
    "twoMonthSignedShopCount": 1,
    "terminationRate": 0
  }
]
```

