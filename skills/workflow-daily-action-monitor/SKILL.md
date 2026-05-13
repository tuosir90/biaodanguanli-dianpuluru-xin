---
name: workflow-daily-action-monitor
description: 当用户需要分析、核对、解释或调整“今日待处理店铺监控”的统计逻辑时使用。适用于查询每个运营的流程推进/巡店标记数量来源、排查店铺是否遗漏、修改新店周期、调整近2日抽点命中规则、调整巡店天数阈值、同步更新页面说明文字与相关测试。
---

# Workflow Daily Action Monitor

用于维护 `web` 中“今日待处理店铺监控”的统计逻辑。

## 适用场景

- 用户要求解释“今日待处理店铺监控”每天是怎么统计的
- 用户质疑某个运营的流程推进或巡店标记数量不对
- 用户要求调整以下任一规则：
  - 新店周期天数
  - 抽点命中窗口
  - 巡店标记阈值天数
  - 流程推进与巡店标记的入桶口径
  - 板块说明文案
- 用户要求核对某个店为什么进桶、没进桶，或是否存在遗漏

## 先看哪些文件

按这个顺序读：

1. `web/features/workflow/daily-action-monitor.ts`
2. `web/lib/workflow-daily-action.ts`
3. `web/lib/latest-daily-point-shops.ts`
4. `web/lib/workflow-daily-action-utils.ts`
5. `web/lib/workflow-flow-metrics.ts`
6. `web/features/workflow/components/workflow-daily-action-section.tsx`

如果需要看历史和巡店链路，再看：

- `web/app/api/workflow/daily-action-monitor/route.ts`
- `web/app/api/workflow/daily-action-monitor/shops/route.ts`
- `web/app/api/workflow/toggle/route.ts`
- `web/app/api/workflow/patrol/route.ts`

当前详细口径说明在：

- `skills/workflow-daily-action-monitor/references/current-rules.md`

## 当前核心口径

### 1. 统计底池

- 只统计 `shops` 中 `shopStatus != 已解约/无效店铺` 的店
- `无效店铺` 和 `已解约` 不进入今日待处理

### 2. 新店判定

- 动态按合同签订日期计算
- 当前新店周期是 `10` 天
- 调整入口：`web/lib/shop-query.ts` 中的 `NEW_SHOP_CYCLE_DAYS`

### 3. 抽点命中

- 当前不是只看最新 1 天
- 现在按“最新抽点日向前覆盖近 `2` 日”统计命中
- 调整入口：`web/lib/latest-daily-point-shops.ts` 中的 `LATEST_DAILY_POINT_WINDOW_DAYS`

### 4. 流程推进

店铺进入 `flow` 的条件：

- `remainingCount > 0`
- 今天还没推进过任意非 `daily_patrol` 流程项
- 如果是新店，直接可进
- 如果是正常店，必须命中“近2日抽点”

### 5. 巡店标记

店铺进入 `patrol` 的条件：

- `remainingCount = 0`
- 命中“近2日抽点”
- 距最近活动时间 `>= 2` 天

当前阈值入口：

- `web/features/workflow/daily-action-monitor.ts` 中的 `PATROL_PENDING_DAYS`

### 6. 最近活动时间

按以下优先级取较新的时间：

1. 最近一次 `daily_patrol`
2. 最近一次非巡店流程项完成时间
3. `contractSignedDate`
4. `entryDate`

## 常见改动入口

### 调新店周期

- 代码：`web/lib/shop-query.ts`
- 联动验证：
  - `web/lib/shop-query.test.ts`
  - `web/lib/workflow-daily-action-utils.ts`

### 调抽点命中窗口

- 代码：`web/lib/latest-daily-point-shops.ts`
- 当前常量：`LATEST_DAILY_POINT_WINDOW_DAYS`
- 联动影响：
  - 今日待处理监控
  - 巡店提醒接口
  - 巡店店铺明细接口
- 必看测试：
  - `web/lib/latest-daily-point-shops.test.ts`

### 调流程推进入桶逻辑

- 代码：`web/features/workflow/daily-action-monitor.ts`
- 数据拼装：`web/lib/workflow-daily-action.ts`
- 必看测试：
  - `web/features/workflow/daily-action-monitor.test.ts`

### 调巡店阈值

- 代码：`web/features/workflow/daily-action-monitor.ts`
- 如果要影响旧的巡店监控接口，还要同步检查：
  - `web/app/api/workflow/patrol/alerts/route.ts`
  - `web/app/api/workflow/patrol/shops/route.ts`

### 调页面说明文字

- 代码：`web/features/workflow/components/workflow-daily-action-section.tsx`
- 必看测试：
  - `web/features/workflow/components/workflow-monitor-sections.test.ts`

## 排查某个店为何未进今日待处理

按这个顺序检查：

1. 这家店是否已解约或无效
2. 动态状态是 `新店` 还是 `正常`
3. `remainingCount` 是否大于 `0`
4. 今天是否已推进过非巡店流程项
5. 是否命中近2日抽点
6. `daysUnpatrolled` 是否达到阈值

最终收口函数只看这里：

- `web/features/workflow/daily-action-monitor.ts`

## 修改后必须验证

在 `web/` 目录执行：

```bash
npm run test:unit -- lib/latest-daily-point-shops.test.ts features/workflow/daily-action-monitor.test.ts features/workflow/components/workflow-monitor-sections.test.ts
npx eslint lib/latest-daily-point-shops.ts lib/latest-daily-point-shops.test.ts features/workflow/daily-action-monitor.ts features/workflow/daily-action-monitor.test.ts features/workflow/components/workflow-daily-action-section.tsx features/workflow/components/workflow-monitor-sections.test.ts
npm run build
```

如果改动涉及巡店旧接口，再补跑或检查：

- `web/app/api/workflow/patrol/alerts/route.ts`
- `web/app/api/workflow/patrol/shops/route.ts`

## 注意事项

- 这套监控是“今日必须动作的待处理池”，不是“全量店铺每日全覆盖清单”
- 很多“没进桶”的店并不是漏算，而是被规则主动排除
- 页面说明文案必须和当前真实规则同步更新，不要只改后端口径
- 如果用户说“数量不对”，优先直接按当前数据库口径重算，再判断是规则问题还是展示问题
