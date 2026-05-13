# 今日待处理店铺监控当前规则

更新时间：`2026-04-09`

## 1. 统计目标

“今日待处理店铺监控”统计的是今天仍需要运营做动作的店铺，不是所有有效店铺的全量列表。

每家店最终只有三种结果：

- 进入 `flow`：今日需推进流程
- 进入 `patrol`：今日需巡店标记
- 不进入今日待处理：按当前规则今天无需处理或被规则排除

## 2. 统计底池

底池来自 `shops` 集合，排除：

- `已解约`
- `无效店铺`

对应代码：

- `web/lib/workflow-daily-action.ts`

## 3. 动态状态

即使主表里不是 `新店`，系统也会按合同签订日期重新动态判定：

- 合同签订当天起，含当天共 `10` 天算 `新店`
- 超过后算 `正常`

对应代码：

- `web/lib/shop-query.ts`
- `web/lib/workflow-daily-action-utils.ts`

## 4. 抽点命中口径

当前命中规则：

- 先取 `daily_point_details` 的最新抽点日
- 再向前多覆盖 `1` 天
- 近 `2` 日任意一天出现过抽点，都算命中

匹配方式：

- 优先商家 ID
- 其次门店 ID
- 再次店铺名

对应代码：

- `web/lib/latest-daily-point-shops.ts`

## 5. remainingCount 的来源

流程剩余项不是简单看日志条数，而是看每个流程项的最新状态快照。

平台差异：

- 美团隐藏 `window_display`
- 美团非新店没记录 `image_wall` 时，会补成已完成
- 饿了么隐藏 `video_sign`、`image_wall`、`mt_detail`、`brand_story`
- 饿了么在基准流程完成后，会补 `window_display`、`store_score`

对应代码：

- `web/lib/workflow-status-snapshot.ts`
- `web/lib/workflow-flow-metrics.ts`
- `web/lib/workflow-progress-keys.ts`

## 6. 流程推进(flow)入桶条件

店铺进入 `flow` 需要同时满足：

1. `remainingCount > 0`
2. 今天还没完成过任意非 `daily_patrol` 流程项
3. 若是 `新店`，可直接进入
4. 若是 `正常店`，必须命中“近2日抽点”

对应代码：

- `web/features/workflow/daily-action-monitor.ts`

## 7. 巡店标记(patrol)入桶条件

店铺进入 `patrol` 需要同时满足：

1. `remainingCount = 0`
2. 命中“近2日抽点”
3. 距最近活动时间 `>= 2` 天

当前阈值：

- `PATROL_PENDING_DAYS = 2`

对应代码：

- `web/features/workflow/daily-action-monitor.ts`

## 8. 最近活动时间的定义

按下面顺序取最近活动基准：

1. 最近一次 `daily_patrol.progressDate`
2. 最近一次非巡店流程项 `completedAt`
3. `contractSignedDate`
4. `entryDate`

也就是说，今天哪怕没有点巡店标记，只要完成了任意流程项，也会刷新最近活动时间。

对应代码：

- `web/lib/workflow-daily-action.ts`
- `web/lib/workflow-daily-action-utils.ts`

## 9. 为什么有些店不在今日待处理中

常见原因：

- 已解约
- 无效店铺
- 流程未完成，但今天已推进过 1 项
- 正常店流程未完成，但近2日没抽点
- 流程已完成，但近2日没抽点
- 流程已完成，但未满 2 天未巡店

## 10. 页面说明文案

当前页面说明必须与真实规则保持一致：

- 正常店只统计近2日有抽点的店铺
- 流程已完成店铺按 2 天 1 次巡店标记管理

对应代码：

- `web/features/workflow/components/workflow-daily-action-section.tsx`
