"use client";

import { useEffect, useState } from "react";
import {
  buildWorkflowPatrolHistoryQuery,
  buildWorkflowRecentSignedMonitorShopsQuery,
  fetchWorkflowPatrolHistory,
  fetchWorkflowRecentSignedMonitorShops,
} from "../api";
import { RECENT_SIGNED_WINDOW_DAYS, RECENT_SIGNED_WINDOW_LABEL } from "../constants";
import type { PatrolHistoryItem, RecentSignedMonitorItem, ShopItem, WorkflowDailyActionMonitorItem } from "../types";
import { WorkflowDailyActionSection } from "./workflow-daily-action-section";
import { WorkflowRecentSignedSection } from "./workflow-recent-signed-section";

const HISTORY_PAGE_SIZE = 10;
const RECENT_SIGNED_DETAIL_PAGE_SIZE = 200;

type WorkflowMonitorPanelsProps = {
  recentSignedMonitor: RecentSignedMonitorItem[];
  recentSignedTotalShops: number;
  dailyActionMonitor: WorkflowDailyActionMonitorItem[];
  dailyActionTotalPendingShops: number;
  dailyActionLoading: boolean;
  dailyActionError: string;
  dailyActionFilterOperator: string;
  onClearDailyActionFilter: () => void;
  onApplyDailyActionFilter: (operatorName: string) => void;
};

export function WorkflowMonitorPanels({
  recentSignedMonitor,
  recentSignedTotalShops,
  dailyActionMonitor,
  dailyActionTotalPendingShops,
  dailyActionLoading,
  dailyActionError,
  dailyActionFilterOperator,
  onClearDailyActionFilter,
  onApplyDailyActionFilter,
}: WorkflowMonitorPanelsProps) {
  const [recentSignedExpandedOperator, setRecentSignedExpandedOperator] = useState("");
  const [recentSignedDetailItemsMap, setRecentSignedDetailItemsMap] = useState<Record<string, ShopItem[]>>({});
  const [recentSignedDetailTotalMap, setRecentSignedDetailTotalMap] = useState<Record<string, number>>({});
  const [recentSignedDetailLoadingOperator, setRecentSignedDetailLoadingOperator] = useState("");
  const [recentSignedDetailErrorMap, setRecentSignedDetailErrorMap] = useState<Record<string, string>>({});
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

  async function toggleRecentSignedDetails(operatorName: string) {
    const normalizedOperatorName = (operatorName || "").trim();
    if (!normalizedOperatorName) {
      return;
    }

    if (recentSignedExpandedOperator === normalizedOperatorName) {
      setRecentSignedExpandedOperator("");
      return;
    }
    setRecentSignedExpandedOperator(normalizedOperatorName);
    if (recentSignedDetailItemsMap[normalizedOperatorName]) {
      return;
    }
    setRecentSignedDetailLoadingOperator(normalizedOperatorName);
    setRecentSignedDetailErrorMap((prev) => ({ ...prev, [normalizedOperatorName]: "" }));

    try {
      const query = buildWorkflowRecentSignedMonitorShopsQuery({
        page: 1,
        pageSize: RECENT_SIGNED_DETAIL_PAGE_SIZE,
        windowDays: RECENT_SIGNED_WINDOW_DAYS,
        operatorName: normalizedOperatorName,
      });
      const result = await fetchWorkflowRecentSignedMonitorShops(query);
      setRecentSignedDetailItemsMap((prev) => ({ ...prev, [normalizedOperatorName]: result.data ?? [] }));
      setRecentSignedDetailTotalMap((prev) => ({ ...prev, [normalizedOperatorName]: Number(result.total ?? 0) }));
    } catch (error) {
      setRecentSignedDetailErrorMap((prev) => ({
        ...prev,
        [normalizedOperatorName]:
          error instanceof Error
            ? error.message
            : `加载${RECENT_SIGNED_WINDOW_LABEL}店铺明细失败`,
      }));
    } finally {
      setRecentSignedDetailLoadingOperator("");
    }
  }

  return (
    <>
      <WorkflowRecentSignedSection
        recentSignedMonitor={recentSignedMonitor}
        recentSignedTotalShops={recentSignedTotalShops}
        recentSignedExpandedOperator={recentSignedExpandedOperator}
        recentSignedDetailItemsMap={recentSignedDetailItemsMap}
        recentSignedDetailTotalMap={recentSignedDetailTotalMap}
        recentSignedDetailLoadingOperator={recentSignedDetailLoadingOperator}
        recentSignedDetailErrorMap={recentSignedDetailErrorMap}
        onToggleRecentSignedDetails={(operatorName) => void toggleRecentSignedDetails(operatorName)}
      />

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
