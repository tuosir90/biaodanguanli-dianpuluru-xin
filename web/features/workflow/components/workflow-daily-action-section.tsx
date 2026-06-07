"use client";

import { useMemo } from "react";
import { Alert, Button, Spin, Tag } from "antd";
import { groupRecentSignedMonitorRows } from "../recent-signed-monitor-layout";
import type { PatrolHistoryItem, WorkflowDailyActionMonitorItem } from "../types";
import { WorkflowHistoryPanel } from "./workflow-history-panel";

type WorkflowDailyActionSectionProps = {
  dailyActionMonitor: WorkflowDailyActionMonitorItem[];
  dailyActionTotalPendingShops: number;
  dailyActionLoading: boolean;
  dailyActionError: string;
  dailyActionFilterOperator: string;
  onClearDailyActionFilter: () => void;
  onApplyDailyActionFilter: (operatorName: string) => void;
  historyOpen: boolean;
  historyMode: "patrol" | "completion";
  historyOperator: string;
  onOpenFlowHistory: (operatorName: string) => void;
  onOpenPatrolHistory: (operatorName: string) => void;
  historyRange: "today" | "7d";
  historyPage: number;
  historyTotalPages: number;
  historyLoading: boolean;
  historyError: string;
  historyItems: PatrolHistoryItem[];
  historyTotal: number;
  onHistoryRangeChange: (range: "today" | "7d") => void;
  onHistoryClearOperator: () => void;
  onHistoryPrevPage: () => void;
  onHistoryNextPage: () => void;
};

export function WorkflowDailyActionSection({
  dailyActionMonitor,
  dailyActionTotalPendingShops,
  dailyActionLoading,
  dailyActionError,
  dailyActionFilterOperator,
  onClearDailyActionFilter,
  onApplyDailyActionFilter,
  historyOpen,
  historyMode,
  historyOperator,
  onOpenFlowHistory,
  onOpenPatrolHistory,
  historyRange,
  historyPage,
  historyTotalPages,
  historyLoading,
  historyError,
  historyItems,
  historyTotal,
  onHistoryRangeChange,
  onHistoryClearOperator,
  onHistoryPrevPage,
  onHistoryNextPage,
}: WorkflowDailyActionSectionProps) {
  const rows = useMemo(
    () =>
      groupRecentSignedMonitorRows(
        dailyActionMonitor.filter((item) => Number(item.pendingShopCount ?? 0) > 0)
      ),
    [dailyActionMonitor]
  );

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-200 text-text-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6m4 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-bold text-text-100">今日待处理店铺监控</h4>
            <p className="text-xs text-text-200">
              流程未完成的店铺要求今日推进 1 个流程项，其中正常店只统计近2日有抽点的店铺；流程已完成店铺按 2 天 1 次巡店标记管理
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-bg-200/60 px-3 py-2">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-200">
          当前待处理店铺：{dailyActionTotalPendingShops}
        </span>
        {dailyActionLoading ? (
          <Tag
            variant="filled"
            className="m-0 rounded-full !bg-bg-100 px-3 py-1 text-xs font-medium !text-text-200"
          >
            刷新中
          </Tag>
        ) : null}
        {dailyActionFilterOperator ? (
          <>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              当前筛选：{dailyActionFilterOperator} · 今日待处理店铺
            </span>
            <Button
              htmlType="button"
              className="h-auto rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-200 hover:bg-bg-200 hover:text-text-100"
              onClick={onClearDailyActionFilter}
            >
              清空筛选
            </Button>
          </>
        ) : null}
      </div>

      {dailyActionError ? (
        <Alert
          type="error"
          showIcon
          title="今日待处理店铺监控加载失败"
          description={dailyActionError}
          className="mb-4 rounded-xl"
        />
      ) : null}

      {dailyActionLoading && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-100/50 px-4 py-8 text-sm text-text-200">
          <Spin size="small" />
          <span>今日待处理店铺加载中...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-100/50 px-4 py-8 text-center text-sm text-text-200">
          今日所有运营待处理店铺已清零
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={`daily-action-row-${rowIndex}`} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {row.map((item) => {
                const normalizedOperatorName = (item.operatorName || "").trim() || "未分配";
                const isActiveOperator = dailyActionFilterOperator === normalizedOperatorName;
                const isFlowHistoryOpen =
                  historyMode === "completion" && historyOperator === normalizedOperatorName;
                const isPatrolHistoryOpen =
                  historyMode === "patrol" && historyOperator === normalizedOperatorName;

                return (
                  <div key={`daily-action-${item.operatorName}`} className="space-y-3">
                    <div className="rounded-xl border border-border bg-bg-200/40 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                            {normalizedOperatorName.slice(0, 1)}
                          </span>
                          <span className="text-sm font-semibold text-text-100">{normalizedOperatorName}</span>
                        </div>
                        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-200">
                          今日待处理：{item.pendingShopCount}家
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <Tag
                          variant="filled"
                          className="m-0 rounded-full !bg-amber-100/70 px-3 py-1 text-xs font-medium !text-amber-800 dark:!bg-amber-900/30 dark:!text-amber-300"
                        >
                          流程推进：{item.flowPendingShopCount}家
                        </Tag>
                        <Tag
                          variant="filled"
                          className="m-0 rounded-full !bg-red-100/70 px-3 py-1 text-xs font-medium !text-red-700 dark:!bg-red-900/30 dark:!text-red-300"
                        >
                          巡店标记：{item.patrolPendingShopCount}家
                        </Tag>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <Button
                          htmlType="button"
                          type={isActiveOperator ? "primary" : "default"}
                          onClick={() => onApplyDailyActionFilter(item.operatorName)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            isActiveOperator
                              ? "border-primary bg-primary text-primary-foreground shadow ring-2 ring-primary/30"
                              : "border-border bg-card text-text-100 hover:border-text-200 hover:bg-bg-200"
                          }`}
                        >
                          今日待处理 {item.pendingShopCount} 家
                        </Button>
                        <div className="flex flex-wrap items-center gap-2 md:ml-auto md:justify-end">
                          <Button
                            htmlType="button"
                            className="h-auto rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-200 hover:bg-bg-200 hover:text-text-100"
                            onClick={() => onOpenFlowHistory(normalizedOperatorName)}
                          >
                            {isFlowHistoryOpen ? "收起流程历史" : "查看流程历史"}
                          </Button>
                          <Button
                            htmlType="button"
                            className="h-auto rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-200 hover:bg-bg-200 hover:text-text-100"
                            onClick={() => onOpenPatrolHistory(normalizedOperatorName)}
                          >
                            {isPatrolHistoryOpen ? "收起巡店历史" : "查看巡店历史"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {historyOpen && historyOperator === normalizedOperatorName ? (
                      <WorkflowHistoryPanel
                        historyMode={historyMode}
                        historyRange={historyRange}
                        historyOperator={historyOperator}
                        historyPage={historyPage}
                        historyTotalPages={historyTotalPages}
                        historyLoading={historyLoading}
                        historyError={historyError}
                        historyItems={historyItems}
                        historyTotal={historyTotal}
                        onRangeChange={onHistoryRangeChange}
                        onClearOperator={onHistoryClearOperator}
                        onPrevPage={onHistoryPrevPage}
                        onNextPage={onHistoryNextPage}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
