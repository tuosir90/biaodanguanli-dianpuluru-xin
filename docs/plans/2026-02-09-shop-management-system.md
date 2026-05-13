# 店铺表单数据管理分析系统开发文档（Prometheus版）

## 1. 目标与范围

### 1.1 项目目标
构建一个完整系统，覆盖：店铺表单录入、店铺数据展示、月度统计分析、按运营协同工作进度标记。所有数据统一存储在 MongoDB 云数据库。

### 1.2 明确范围（仅做用户要求）
- 表单字段：`录入日期`、`店铺名`、`商家ID`、`微信群全名`、`城市`、`开单销售`、`合同签订日期`、`运营模式`、`负责运营`、`外卖平台`。
- 录入规则：`录入日期`由系统自动填当天日期。
- 列表规则：提交后写入数据源并按`录入日期`倒序（最新在第一行）。
- 协同规则：每个店铺每天对工作进度项点击即高亮（已完成），未点击为灰色（未完成），再次点击可取消高亮恢复灰色。
- 历史数据：Excel 中已有约 2572 条店铺记录，需通过种子脚本导入到新系统作为初始数据。

### 1.3 技术栈（按需求锁定）
- 前端：Next.js（App Router）+ TypeScript
- UI：Tailwind CSS + shadcn/ui + Lucide React + Radix Colors
- 表格：TanStack Table
- 图表：Recharts（柱状趋势图）
- 部署：Vercel
- 数据库：MongoDB

---

## 2. Excel 数据基线（已读取）

数据文件：`F:\tuosir90-claude-code\biaodanguanli-dianpuluru\📋外卖店铺统计 待办事项统计 共享（实时更新） (8).xlsx`

### 2.1 业务主表字段（外卖运营店铺数据统计）
- `店铺名`
- `商家ID`
- `微信群全名`
- `城市`
- `开单销售`
- `合同签订日期`
- `运营模式`
- `负责运营`
- `外卖平台`

### 2.2 下拉字段与候选来源
- `开单销售`：Excel 数据验证下拉（已存在候选集）。
- `负责运营`：Excel 数据验证下拉（已存在候选集）。
- `外卖平台`：Excel 数据验证下拉（已存在候选集）。
- `运营模式`：目标表未绑定稳定验证列表，需以“历史值去重 + 管理端可维护字典”作为下拉来源。

### 2.3 风险说明
`运营模式`来源不统一会导致统计口径分裂，因此必须建立统一字典集合并做新增值审核（或受控新增）。

---

## 3. 信息架构与导航

### 3.1 侧边栏结构
1. `店铺录入`
2. `店铺数据展示`（默认打开页）
3. `数据统计`
4. `运营工作进度`

> 说明：原始需求中“第三行”出现两次，按最小歧义解释拆分为“统计页”和“运营工作进度页”两个独立导航项。

### 3.2 页面路由
- `/shops`：店铺数据展示（默认页）
- `/shops/new`：店铺录入
- `/stats`：数据统计
- `/workflow`：运营工作进度

---

## 4. 页面功能定义

### 4.1 店铺录入页（`/shops/new`）

#### 4.1.1 表单字段
- `录入日期`：只读，默认当天（本地时区 yyyy-MM-dd）
- `店铺名`：输入
- `商家ID`：输入
- `微信群全名`：输入
- `城市`：输入或下拉（按当前数据源）
- `开单销售`：下拉
- `合同签订日期`：日期选择
- `运营模式`：下拉
- `负责运营`：下拉
- `外卖平台`：下拉

#### 4.1.2 提交行为
- 校验必填后写入 MongoDB。
- 成功后数据即时可在`/shops`看到。
- 默认排序保持`录入日期 DESC`。

### 4.2 店铺数据展示页（`/shops`）

#### 4.2.1 表格
- 使用 TanStack Table 展示全字段。
- 默认按`录入日期`倒序。
- 支持分页。
- 支持按`负责运营`、`开单销售`、`外卖平台`、`月份`筛选。

#### 4.2.2 数据源约束
- 与录入页同一数据集合。
- 与工作进度页共享同一店铺主数据。

### 4.3 数据统计页（`/stats`）

按月统计，默认展示当前月，顶部提供月份选择器可切换历史月份。至少包含：
- 每月店铺总数（新增口径）。
- 每月“每天开单店铺数量”柱状趋势图。
- 每月“每个运营的店铺数”柱状趋势图。
- 每月“每个销售的店铺数”柱状趋势图。

### 4.4 运营工作进度页（`/workflow`）

#### 4.4.1 运营切换
- 页面顶部按`负责运营`生成切换 Tabs。
- 切换后显示该运营名下店铺列表。

#### 4.4.2 工作进度项（核心）
- 市场调查四套方案
- 分类栏优化
- 图片三件套
- 视频店招
- 菜品图（1-10张）
- 菜品图（11-20张）
- 菜品图（21-30张）
- 菜品图（31-40张）
- 菜品图（40张以上）
- 外卖活动方案
- 美团外卖详情页图
- 标题关键词优化
- 菜品描述撰写
- 评价解释差评申诉
- 美团品牌故事
- 精准营销发券
- 可视化数据周报分析
- 店铺分解析
- 新品上线
- 付费调试
- 店铺数据分析
- 每日巡店

#### 4.4.3 标记规则
- 粒度：`店铺 + 日期 + 进度项`。
- 点击进度项：置为已完成并高亮。
- 再次点击：取消高亮，恢复为灰色未完成状态（toggle）。
- 未点击：灰色未完成。
- 支持每天持续打标，形成协同记录。

---

## 5. MongoDB 数据模型设计

> 连接串必须放环境变量，不直接写入代码：
`mongodb://root:6scldk9f@dbconn.sealosbja.site:39056/?directConnection=true`

### 5.1 `shops`（店铺主表）

```ts
{
  _id: ObjectId,
  entryDate: Date,            // 录入日期（系统自动）
  shopName: string,
  merchantId: string,
  wechatGroupName: string,
  city: string,
  salesName: string,          // 开单销售
  contractSignedDate: Date,   // 合同签订日期
  operationMode: string,
  operatorName: string,       // 负责运营
  deliveryPlatform: string,   // 外卖平台
  createdAt: Date,
  updatedAt: Date
}
```

索引建议：
- `{ entryDate: -1 }`
- `{ operatorName: 1, entryDate: -1 }`
- `{ salesName: 1, entryDate: -1 }`
- `{ merchantId: 1 }`（允许重复与否按业务最终策略配置）

### 5.2 `dropdown_options`（下拉字典）

```ts
{
  _id: ObjectId,
  key: 'salesName' | 'operationMode' | 'operatorName' | 'deliveryPlatform',
  options: string[],
  updatedAt: Date
}
```

### 5.3 `workflow_progress_logs`（工作进度日志）

```ts
{
  _id: ObjectId,
  shopId: ObjectId,
  operatorName: string,
  progressDate: Date,          // 当天日期
  progressKey: string,         // 进度项唯一键
  progressLabel: string,       // 展示文案
  completed: boolean,          // true=高亮完成
  completedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

唯一索引：
- `{ shopId: 1, progressDate: 1, progressKey: 1 }`

---

## 6. API / Server Action 契约

### 6.1 店铺录入
- `POST /api/shops`
  - 入参：录入表单 10 字段（`entryDate`可省略，后端自动写入当天）。
  - 出参：`{ success: true, id }`。

### 6.2 店铺列表
- `GET /api/shops?page=&pageSize=&operator=&sales=&platform=&month=`
  - 出参：`{ data, total }`。
  - 默认排序：`entryDate DESC`。

### 6.3 下拉项
- `GET /api/dropdowns`
  - 出参：`{ salesName:[], operationMode:[], operatorName:[], deliveryPlatform:[] }`

### 6.4 工作进度标记
- `POST /api/workflow/toggle`
  - 入参：`shopId, progressDate, progressKey, progressLabel, completed`
  - 行为：按唯一键 upsert。
  - 出参：`{ success: true }`

### 6.5 统计
- `GET /api/stats/monthly?month=YYYY-MM`
  - 出参：
    - `monthlyShopCount`
    - `dailyOrderShopTrend[]`
    - `operatorShopTrend[]`
    - `salesShopTrend[]`

---

## 7. 统计口径定义（避免口径歧义）

- 月份归属：按`entryDate`归属月份。
- 每月店铺数量：该月新增店铺记录数。
- 每天开单店铺数量：该月每日新增店铺数量（日粒度）。
- 每月每运营店铺数：该月按`operatorName`分组计数。
- 每月每销售店铺数：该月按`salesName`分组计数。

---

## 8. 实施阶段与验收标准

### Phase 1：项目骨架与数据库接入
- 交付：Next.js 项目、Mongo 连接、基础布局和侧边栏。
- 验收：可打开`/shops`默认页并展示空态。

### Phase 2：数据模型与下拉字典
- 交付：`shops`、`dropdown_options`、`workflow_progress_logs`三集合及索引。
- 交付：种子脚本，从 Excel 提取四字段候选值写入 `dropdown_options`，并导入约 2572 条历史店铺数据到 `shops`。
- 验收：下拉接口可返回四个下拉字段候选值；`/shops` 列表可展示历史数据。

### Phase 3：店铺录入与展示
- 交付：录入页、提交接口、列表页。
- 验收：新增后列表首行是最新`entryDate`数据。

### Phase 4：数据统计
- 交付：月度统计接口与三类柱状图。
- 验收：`/stats`可按月切换并展示正确分组数据。

### Phase 5：运营协同工作进度
- 交付：按运营切换、店铺进度标记、灰/高亮状态。
- 验收：同一店铺同一日期同一项可正确记录完成状态并可回显。

---

## 9. 非功能要求

- 仅做需求内功能，不扩展额外业务模块。
- 关键操作（录入、进度标记）必须幂等和可回显。
- 录入、展示、统计、进度四部分共享同一数据源，避免口径不一致。

---

## 10. 开发起步结论

本开发文档已覆盖你要求的完整范围，可直接进入实现阶段。
