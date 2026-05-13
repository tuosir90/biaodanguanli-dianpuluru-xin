# 在线店铺数统计 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为美团与饿了么新增“在线店铺数”采集入库与页面展示能力，支持本地采集结果追加上传到云数据库，并在侧边栏新增独立分类查看趋势和明细。

**Architecture:** 采集端负责从平台后台拿到“在线店铺数”后，调用新增的 `POST /api/online-shop-counts` 追加写入 MongoDB 快照表。前端展示页调用 `GET /api/online-shop-counts`，按“同一天每个平台取最新一条快照”聚合，生成趋势图与表格。这样既保留历史采集轨迹，也不会因为重复采集导致页面统计失真。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Mongoose、MongoDB、ECharts、Vitest

---

## 需求梳理

### 已确认需求

- 新采集的美团在线店铺数、饿了么在线店铺数都要上传到云数据库。
- 上传逻辑必须为**追加写入**，不能覆盖历史采集数据。
- 项目左侧侧边栏新增一个分类入口。
- 新分类页面中需要展示在线店铺数数据。
- 当前仓库已有 `termination-import`、`daily-point-import` 这类导入模式，可复用其 API 设计与 Mongo 接入方式。

### 本次实现口径

- 云数据库中新增一张**在线店铺数采集快照表**，每次采集都插入新记录。
- 页面统计口径按自然日聚合，同一天如果一个平台有多次采集，只展示**最新一条**。
- 页面默认按月份查看，支持切换月份。
- 页面展示包括：
  - 最新采集卡片
  - 美团/饿了么在线店铺数趋势图
  - 每日明细表

### 采集端对接方式

- 对接端无需直接写库，只需向系统提交 JSON：
  - `statDate`
  - `capturedAt`
  - `source`
  - `records`
- `records` 中每条记录包含：
  - `platform`
  - `count`
  - `summaryText`
  - `captureKey`
- 其中 `captureKey` 用于幂等控制；若采集脚本重复重试同一批数据，不会重复入库。

---

## 数据设计

### 新集合：`online_shop_count_snapshots`

建议字段：

- `platform: "meituan" | "eleme"`
- `statDateKey: string`
- `count: number`
- `summaryText: string`
- `captureSource: string`
- `captureKey: string`
- `capturedAt: Date`
- `importedAt: Date`

### 索引设计

- 唯一索引：`{ platform, captureKey }`
  - 作用：同一平台同一批采集结果重复上报时自动幂等
- 普通索引：`{ statDateKey, platform, capturedAt }`
  - 作用：支撑按月份查询和按日取最新快照

### 追加写入原则

- 不做 `updateOne + replace` 覆盖历史。
- 每次采集默认生成一条新快照。
- 页面只在展示层“按天取最新”，数据库底层保留全部快照历史。

---

## API 设计

### 1. `POST /api/online-shop-counts`

用途：接收采集端上传的在线店铺数快照并追加入库。

请求体示例：

```json
{
  "statDate": "2026-04-24",
  "capturedAt": "2026-04-24T09:30:00+08:00",
  "source": "online-shop-crawler",
  "records": [
    {
      "platform": "meituan",
      "count": 925,
      "summaryText": "符合检索条件的数量：925",
      "captureKey": "2026-04-24-meituan-093000"
    },
    {
      "platform": "eleme",
      "count": 353,
      "summaryText": "共 353 条",
      "captureKey": "2026-04-24-eleme-093000"
    }
  ]
}
```

返回字段：

- `success`
- `inserted`
- `skipped`
- `statDate`

### 2. `GET /api/online-shop-counts?month=2026-04`

用途：获取在线店铺数页面所需的趋势数据与明细数据。

返回结构：

```ts
{
  month: string;
  latestCards: Array<{
    platform: "meituan" | "eleme";
    statDate: string;
    count: number;
    capturedAt: string;
  }>;
  trendSeries: Array<{
    name: string;
    values: Array<{ date: string; value: number }>;
  }>;
  rows: Array<{
    date: string;
    meituanCount: number | null;
    elemeCount: number | null;
    meituanCapturedAt: string;
    elemeCapturedAt: string;
  }>;
}
```

---

## 页面设计

### 新页面入口

- 侧边栏新增：
  - `在线店铺数统计`

建议位置：

- 放在 `数据统计` 下方，表示同属经营分析类入口。

### 页面路径

- `web/app/online-shop-stats/page.tsx`

### 页面区块

1. 顶部标题区
   - 页面标题
   - 月份选择器
   - 简短说明

2. 最新采集卡片
   - 美团最新在线店铺数
   - 饿了么最新在线店铺数
   - 展示采集日期与采集时间

3. 趋势图
   - 美团在线店铺数趋势
   - 饿了么在线店铺数趋势

4. 明细表
   - 日期
   - 美团在线店铺数
   - 美团采集时间
   - 饿了么在线店铺数
   - 饿了么采集时间

---

## 文件改动计划

### 新增文件

- `web/models/online-shop-count-snapshot.ts`
- `web/features/online-shop-stats/types.ts`
- `web/features/online-shop-stats/report.ts`
- `web/features/online-shop-stats/report.test.ts`
- `web/features/online-shop-stats/payload.ts`
- `web/features/online-shop-stats/payload.test.ts`
- `web/app/api/online-shop-counts/route.ts`
- `web/components/online-shop-stats-client.tsx`
- `web/components/online-shop-stats-latest-card.tsx`
- `web/components/online-shop-stats-report.tsx`
- `web/app/online-shop-stats/page.tsx`
- `web/scripts/upload-online-shop-counts.mjs`

### 修改文件

- `web/components/app-sidebar.tsx`

---

## 实施任务

### Task 1: 在线店铺数数据模型

**Files:**
- Create: `web/models/online-shop-count-snapshot.ts`

**Steps:**

1. 新增 Mongoose schema，定义快照字段和索引。
2. 为 `platform + captureKey` 增加唯一索引。
3. 为 `statDateKey + platform + capturedAt` 增加查询索引。

### Task 2: 请求体解析与校验

**Files:**
- Create: `web/features/online-shop-stats/payload.ts`
- Create: `web/features/online-shop-stats/payload.test.ts`

**Steps:**

1. 编写 payload 解析函数，校验平台、日期、数量、采集键。
2. 默认补齐 `capturedAt`、`source` 等字段。
3. 为非法平台、负数数量、空记录列表补测试。

### Task 3: 页面聚合逻辑

**Files:**
- Create: `web/features/online-shop-stats/types.ts`
- Create: `web/features/online-shop-stats/report.ts`
- Create: `web/features/online-shop-stats/report.test.ts`

**Steps:**

1. 实现“同一天每个平台取最新快照”的聚合逻辑。
2. 生成页面趋势图 series。
3. 生成每日表格行与最新卡片数据。
4. 为重复采集、单平台缺失、乱序输入补测试。

### Task 4: 在线店铺数 API

**Files:**
- Create: `web/app/api/online-shop-counts/route.ts`

**Steps:**

1. 实现 `POST`，调用 payload 解析并写入 Mongo。
2. 实现 `GET`，按月份读取快照并调用 report builder 聚合。
3. 保持接口文件轻量，不把聚合逻辑堆进 route。

### Task 5: 页面与导航

**Files:**
- Create: `web/components/online-shop-stats-client.tsx`
- Create: `web/components/online-shop-stats-report.tsx`
- Create: `web/app/online-shop-stats/page.tsx`
- Modify: `web/components/app-sidebar.tsx`

**Steps:**

1. 新增侧边栏入口。
2. 页面支持月份切换和接口拉取。
3. 渲染卡片、趋势图和表格。
4. 统一现有项目视觉风格，不单独造新皮肤体系。

### Task 6: 采集端上传脚本

**Files:**
- Create: `web/scripts/upload-online-shop-counts.mjs`
- Modify: `web/package.json`

**Steps:**

1. 新增一个命令行脚本，把美团/饿了么在线店铺数 POST 到新接口。
2. 支持传入日期、采集时间、来源和两个平台数量。
3. 让采集脚本后续可以直接复用，不必重复拼接请求体。

### Task 7: 验证

**Files:**
- Test: `web/features/online-shop-stats/payload.test.ts`
- Test: `web/features/online-shop-stats/report.test.ts`

**Steps:**

1. 运行新增单元测试。
2. 运行相关 eslint 检查。
3. 如有必要，补充一次 `tsc --noEmit` 结果记录，区分新增问题与项目遗留问题。

---

## 风险与处理

### 风险 1：采集脚本重复上报

- 处理：要求采集端传 `captureKey`，服务端通过唯一索引幂等去重。

### 风险 2：一天内多次采集导致页面重复

- 处理：页面只取每天最新快照展示，但底层保留所有历史。

### 风险 3：接口被误调用写入脏数据

- 当前处理：先完成数据结构与页面链路，后续若你要上线公网写接口，再补同步令牌或签名校验。

---

## 验证命令

在 `web/` 目录执行：

```bash
npm run test:unit -- features/online-shop-stats/payload.test.ts features/online-shop-stats/report.test.ts
npx eslint app/api/online-shop-counts/route.ts components/app-sidebar.tsx components/online-shop-stats-client.tsx components/online-shop-stats-latest-card.tsx components/online-shop-stats-report.tsx features/online-shop-stats/payload.ts features/online-shop-stats/report.ts models/online-shop-count-snapshot.ts scripts/upload-online-shop-counts.mjs
```

如需额外类型检查：

```bash
npx tsc --noEmit
```

---

## 说明

这次先把“云库入库 + 页面展示 + 导航入口”完整接通。美团与饿了么后台自动点击采集脚本，可以在下一步直接对接这个 `POST /api/online-shop-counts` 接口，不需要再改页面和数据库结构。
