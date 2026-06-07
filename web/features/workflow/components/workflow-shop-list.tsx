"use client";

import { useMemo, useState } from "react";
import { Button } from "antd";
import type { PatrolStatusItem, ShopFlowMetrics, ShopItem } from "../types";
import { WorkflowShopCard } from "./workflow-shop-card";

type WorkflowShopListProps = {
  detailLoading: boolean;
  filteredShops: ShopItem[];
  hasActiveDetailFilters: boolean;
  copiedShopId: string | null;
  statusMap: Record<string, boolean>;
  patrolDateMap: Record<string, string>;
  patrolStatusMap: Record<string, PatrolStatusItem>;
  patrolLoadingMap: Record<string, boolean>;
  patrolMessageMap: Record<string, string>;
  shopFlowMetricsMap: Record<string, ShopFlowMetrics>;
  onSetPatrolDate: (shopId: string, dateValue: string) => void;
  onToggleProgress: (
    shopId: string,
    operatorName: string,
    progressKey: string,
    progressLabel: string
  ) => void;
  onCopyShopName: (shopId: string, shopName: string) => void;
  onMarkDailyPatrol: (shop: ShopItem) => void;
};

const INITIAL_VISIBLE_COUNT = 40;
const LOAD_MORE_STEP = 40;

export function WorkflowShopList({
  detailLoading,
  filteredShops,
  hasActiveDetailFilters,
  copiedShopId,
  statusMap,
  patrolDateMap,
  patrolStatusMap,
  patrolLoadingMap,
  patrolMessageMap,
  shopFlowMetricsMap,
  onSetPatrolDate,
  onToggleProgress,
  onCopyShopName,
  onMarkDailyPatrol,
}: WorkflowShopListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const visibleShops = useMemo(
    () => filteredShops.slice(0, visibleCount),
    [filteredShops, visibleCount]
  );
  const hasMore = visibleCount < filteredShops.length;

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-200">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent-200"></div>
        加载中...
      </div>
    );
  }

  if (filteredShops.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-100 px-4 py-8 text-center text-sm text-text-200">
        {hasActiveDetailFilters
          ? "当前筛选条件下暂无匹配店铺，请调整筛选后重试"
          : "当前时间窗口暂无店铺数据，可切换运营或翻到下一页查看"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleShops.map((shop) => (
        <WorkflowShopCard
          key={shop._id}
          shop={shop}
          copiedShopId={copiedShopId}
          statusMap={statusMap}
          patrolDateMap={patrolDateMap}
          patrolStatusMap={patrolStatusMap}
          patrolLoadingMap={patrolLoadingMap}
          patrolMessageMap={patrolMessageMap}
          metrics={shopFlowMetricsMap[shop._id] ?? { completedCount: 0, totalProgressCount: 0, remainingCount: 0 }}
          onSetPatrolDate={onSetPatrolDate}
          onToggleProgress={onToggleProgress}
          onCopyShopName={onCopyShopName}
          onMarkDailyPatrol={onMarkDailyPatrol}
        />
      ))}

      {hasMore ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-bg-100/50 px-4 py-3 text-xs text-text-200">
          <span>
            已显示 {visibleShops.length} / {filteredShops.length} 家店铺
          </span>
          <Button
            htmlType="button"
            className="h-auto rounded-lg bg-bg-200 px-3 py-1.5 text-xs font-medium text-text-200 hover:bg-bg-300"
            onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
          >
            加载更多
          </Button>
        </div>
      ) : null}
    </div>
  );
}
