"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { groupRecentSignedMonitorRows } from "../recent-signed-monitor-layout";
import type { PatrolHistoryItem, WorkflowDailyActionMonitorItem } from "../types";
import { WorkflowHistoryPanel } from "./workflow-history-panel";

type WorkflowDailyActionSectionProps = {
  dailyActionMonitor: WorkflowDailyActionMonitorItem[];
  dailyActionTotalPendingShops: number;
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
    <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-amber-50/80 to-red-50/40 p-5 shadow-soft dark:from-amber-950/20 dark:to-red-950/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-red-100 text-red-700 dark:from-amber-900/30 dark:to-red-900/30 dark:text-red-300">
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

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/70 px-3 py-2 dark:bg-bg-100/40">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-text-200 shadow-sm dark:bg-bg-100">
          当前待处理店铺：{dailyActionTotalPendingShops}
        </span>
        {dailyActionFilterOperator ? (
          <>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              当前筛选：{dailyActionFilterOperator} · 今日待处理店铺
            </span>
            <Button
              type="button"
              variant="ghost"
              className="h-auto rounded-full bg-white px-3 py-1 text-xs font-medium text-text-200 shadow-sm hover:bg-bg-200 dark:bg-bg-100"
              onClick={onClearDailyActionFilter}
            >
              清空筛选
            </Button>
          </>
        ) : null}
      </div>

      {rows.length === 0 ? (
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
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-red-100 px-2 text-xs font-bold text-red-700 dark:from-amber-900/30 dark:to-red-900/30 dark:text-red-300">
                            {normalizedOperatorName.slice(0, 1)}
                          </span>
                          <span className="text-sm font-semibold text-text-100">{normalizedOperatorName}</span>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-text-200 shadow-sm dark:bg-bg-100">
                          今日待处理：{item.pendingShopCount}家
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-amber-100/70 px-3 py-1 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          流程推进：{item.flowPendingShopCount}家
                        </span>
                        <span className="rounded-full bg-red-100/70 px-3 py-1 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          巡店标记：{item.patrolPendingShopCount}家
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          onClick={() => onApplyDailyActionFilter(item.operatorName)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            isActiveOperator
                              ? "bg-red-600 text-white shadow"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          今日待处理 {item.pendingShopCount} 家
                        </button>
                        <div className="flex flex-wrap items-center gap-2 md:ml-auto md:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto rounded-full bg-bg-100 px-3 py-1.5 text-xs font-medium text-text-200 shadow-sm hover:bg-bg-200 hover:text-text-100"
                            onClick={() => onOpenFlowHistory(normalizedOperatorName)}
                          >
                            {isFlowHistoryOpen ? "收起流程历史" : "查看流程历史"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto rounded-full bg-bg-100 px-3 py-1.5 text-xs font-medium text-text-200 shadow-sm hover:bg-bg-200 hover:text-text-100"
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
