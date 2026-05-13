"use client";

import type { ShopFlowMetrics } from "../types";
import type { useWorkflowDetailData } from "../hooks/use-workflow-detail-data";
import type { useWorkflowFilters } from "../hooks/use-workflow-filters";
import type { useWorkflowOverviewData } from "../hooks/use-workflow-overview-data";
import { WorkflowDetailControls } from "./workflow-detail-controls";
import { WorkflowMonitorPanels } from "./workflow-monitor-panels";
import { WorkflowOverviewSection } from "./workflow-overview-section";
import { WorkflowShopList } from "./workflow-shop-list";

type WorkflowFiltersState = ReturnType<typeof useWorkflowFilters>;
type WorkflowDetailDataState = ReturnType<typeof useWorkflowDetailData>;
type WorkflowOverviewDataState = ReturnType<typeof useWorkflowOverviewData>;

type WorkflowPageContentProps = {
  filters: WorkflowFiltersState;
  operators: string[];
  detailData: WorkflowDetailDataState;
  overviewData: WorkflowOverviewDataState;
  detailLoading: boolean;
  isDailyActionPaginationMode: boolean;
  hasActiveDetailFilters: boolean;
  listResetKey: string;
  shopFlowMetricsMap: Record<string, ShopFlowMetrics>;
};

export function WorkflowPageContent({
  filters,
  operators,
  detailData,
  overviewData,
  detailLoading,
  isDailyActionPaginationMode,
  hasActiveDetailFilters,
  listResetKey,
  shopFlowMetricsMap,
}: WorkflowPageContentProps) {
  return (
    <section className="space-y-6">
      <WorkflowOverviewSection
        startDate={filters.startDate}
        endDate={filters.endDate}
        onStartDateChange={filters.setStartDate}
        onEndDateChange={filters.setEndDate}
        summary={overviewData.summary}
        operators={operators}
        chartOperator={filters.chartOperator}
        onChartOperatorChange={filters.setChartOperator}
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <WorkflowMonitorPanels
          recentSignedMonitor={overviewData.recentSignedMonitor}
          recentSignedTotalShops={overviewData.recentSignedTotalShops}
          dailyActionMonitor={overviewData.dailyActionMonitor}
          dailyActionTotalPendingShops={overviewData.dailyActionTotalPendingShops}
          dailyActionFilterOperator={filters.dailyActionFilterOperator}
          onClearDailyActionFilter={filters.clearDailyActionFilter}
          onApplyDailyActionFilter={filters.applyDailyActionFilter}
        />

        <WorkflowDetailControls
          selectedOperator={filters.selectedOperator}
          operators={operators}
          onSelectOperator={filters.resetByOperatorChange}
          currentOperatorShopCount={detailData.shopsTotal}
          shopNameKeyword={filters.shopNameKeyword}
          onShopNameKeywordChange={filters.updateShopNameKeyword}
          merchantIdKeyword={filters.merchantIdKeyword}
          onMerchantIdKeywordChange={filters.updateMerchantIdKeyword}
          statusKeyword={filters.statusKeyword}
          onStatusKeywordChange={filters.updateStatusKeyword}
          onClearKeywords={filters.clearKeywords}
          detailFullScopeMode={filters.detailFullScopeMode}
          isDailyActionPaginationMode={isDailyActionPaginationMode}
          hasKeywordFilters={filters.hasKeywordFilters}
          detailPage={filters.detailPage}
          hasNextWindow={detailData.hasNextWindow}
          detailLoading={detailLoading}
          onPrevPage={() => filters.setDetailPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => filters.setDetailPage((prev) => prev + 1)}
        />

        <WorkflowShopList
          key={listResetKey}
          detailLoading={detailLoading}
          filteredShops={detailData.shops}
          hasActiveDetailFilters={hasActiveDetailFilters}
          copiedShopId={detailData.copiedShopId}
          statusMap={detailData.statusMap}
          patrolDateMap={detailData.patrolDateMap}
          patrolStatusMap={detailData.patrolStatusMap}
          patrolLoadingMap={detailData.patrolLoadingMap}
          patrolMessageMap={detailData.patrolMessageMap}
          shopFlowMetricsMap={shopFlowMetricsMap}
          onSetPatrolDate={(shopId, dateValue) =>
            detailData.setPatrolDateMap((prev) => ({ ...prev, [shopId]: dateValue }))
          }
          onToggleProgress={detailData.toggleProgress}
          onCopyShopName={detailData.copyShopName}
          onMarkDailyPatrol={detailData.markDailyPatrol}
        />
      </div>
    </section>
  );
}
