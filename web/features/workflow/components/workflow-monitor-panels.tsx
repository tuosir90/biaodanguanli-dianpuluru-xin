"use client";

import { useEffect, useState } from "react";
import {
  buildWorkflowPatrolHistoryQuery,
  fetchWorkflowPatrolHistory,
} from "../api";
import type { PatrolHistoryItem, WorkflowDailyActionMonitorItem } from "../types";
import { WorkflowDailyActionSection } from "./workflow-daily-action-section";

const HISTORY_PAGE_SIZE = 10;

type WorkflowMonitorPanelsProps = {
  dailyActionMonitor: WorkflowDailyActionMonitorItem[];
  dailyActionTotalPendingShops: number;
  dailyActionLoading: boolean;
  dailyActionError: string;
  dailyActionFilterOperator: string;
  onClearDailyActionFilter: () => void;
  onApplyDailyActionFilter: (operatorName: string) => void;
};

export function WorkflowMonitorPanels({
  dailyActionMonitor,
  dailyActionTotalPendingShops,
  dailyActionLoading,
  dailyActionError,
  dailyActionFilterOperator,
  onClearDailyActionFilter,
  onApplyDailyActionFilter,
}: WorkflowMonitorPanelsProps) {
  const [historyMode, setHistoryMode] = useState<"patrol" | "completion">("patrol");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRange, setHistoryRange] = useState<"today" | "7d">("today");
  const [historyOperator, setHistoryOperator] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<PatrolHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / HISTORY_PAGE_SIZE));

  function prepareHistoryReload() {
    setHistoryLoading(true);
    setHistoryError("");
  }

  function openHistory(mode: "patrol" | "completion", operatorName = "") {
    if (historyOpen && historyMode === mode && historyOperator === operatorName) {
      setHistoryOpen(false);
      return;
    }
    prepareHistoryReload();
    setHistoryMode(mode);
    setHistoryOperator(operatorName);
    setHistoryRange("today");
    setHistoryPage(1);
    setHistoryOpen(true);
  }

  function changeHistoryPage(nextPage: number) {
    setHistoryPage(nextPage);
    prepareHistoryReload();
  }

  useEffect(() => {
    if (!historyOpen) return;
    let active = true;
    const query = buildWorkflowPatrolHistoryQuery({
      page: historyPage,
      pageSize: HISTORY_PAGE_SIZE,
      range: historyRange,
      operatorName: historyOperator || undefined,
      mode: historyMode,
    });
    fetchWorkflowPatrolHistory(query)
      .then((result) => {
        if (!active) return;
        setHistoryItems(result.items ?? []);
        setHistoryTotal(Number(result.total ?? 0));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setHistoryError(error instanceof Error ? error.message : "巡店历史加载失败");
      })
      .finally(() => {
        if (!active) return;
        setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    historyMode,
    historyOpen,
    historyOperator,
    historyPage,
    historyRange,
    dailyActionTotalPendingShops,
  ]);

  return (
    <>
      <WorkflowDailyActionSection
        dailyActionMonitor={dailyActionMonitor}
        dailyActionTotalPendingShops={dailyActionTotalPendingShops}
        dailyActionLoading={dailyActionLoading}
        dailyActionError={dailyActionError}
        dailyActionFilterOperator={dailyActionFilterOperator}
        onClearDailyActionFilter={onClearDailyActionFilter}
        onApplyDailyActionFilter={onApplyDailyActionFilter}
        historyOpen={historyOpen}
        historyMode={historyMode}
        historyOperator={historyOperator}
        onOpenFlowHistory={(operatorName) => openHistory("completion", operatorName)}
        onOpenPatrolHistory={(operatorName) => openHistory("patrol", operatorName)}
        historyRange={historyRange}
        historyPage={historyPage}
        historyTotalPages={historyTotalPages}
        historyLoading={historyLoading}
        historyError={historyError}
        historyItems={historyItems}
        historyTotal={historyTotal}
        onHistoryRangeChange={(range) => {
          setHistoryRange(range);
          changeHistoryPage(1);
        }}
        onHistoryClearOperator={() => {
          setHistoryOperator("");
          changeHistoryPage(1);
        }}
        onHistoryPrevPage={() => changeHistoryPage(Math.max(1, historyPage - 1))}
        onHistoryNextPage={() => changeHistoryPage(Math.min(historyTotalPages, historyPage + 1))}
      />
    </>
  );
}
