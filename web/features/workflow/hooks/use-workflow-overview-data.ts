import { useEffect, useRef, useState } from "react";
import {
  fetchWorkflowDailyActionMonitor,
  buildWorkflowSummaryQuery,
  fetchWorkflowDropdowns,
  fetchWorkflowRecentSignedMonitor,
  fetchWorkflowSummary,
} from "../api";
import type {
  RecentSignedMonitorItem,
  WorkflowDailyActionMonitorItem,
  WorkflowSummary,
} from "../types";
import {
  shouldCommitOverviewRefreshFetch,
  shouldThrottleOverviewRefresh,
} from "../overview-refresh";

type UseWorkflowOverviewDataParams = {
  initialMonth: string;
  startDate: string;
  endDate: string;
  chartOperator: string;
  manualRefreshToken: number;
  passiveRefreshToken: number;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useWorkflowOverviewData({
  initialMonth,
  startDate,
  endDate,
  chartOperator,
  manualRefreshToken,
  passiveRefreshToken,
}: UseWorkflowOverviewDataParams) {
  const [summary, setSummary] = useState<WorkflowSummary>({
    month: initialMonth,
    shopCountByOperator: [],
    progressCountByItem: [],
    operatorTerminationTrend: [],
  });
  const [dailyActionMonitor, setDailyActionMonitor] = useState<
    WorkflowDailyActionMonitorItem[]
  >([]);
  const [dailyActionTotalPendingShops, setDailyActionTotalPendingShops] = useState(0);
  const [dailyActionLoading, setDailyActionLoading] = useState(true);
  const [dailyActionError, setDailyActionError] = useState("");
  const [recentSignedMonitor, setRecentSignedMonitor] = useState<RecentSignedMonitorItem[]>([]);
  const [recentSignedTotalShops, setRecentSignedTotalShops] = useState(0);
  const [allOperators, setAllOperators] = useState<string[]>([]);

  const lastDailyActionFetchRef = useRef(0);
  const lastRecentSignedFetchRef = useRef(0);
  const OVERVIEW_THROTTLE_MS = 120_000;

  useEffect(() => {
    fetchWorkflowDropdowns().then((result) => {
      setAllOperators((result.operatorName ?? []).filter(Boolean));
    });
  }, []);

  useEffect(() => {
    if (manualRefreshToken <= 0) {
      return;
    }

    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setDailyActionLoading(true);
      setDailyActionError("");
    });
    fetchWorkflowDailyActionMonitor()
      .then((result) => {
        if (!active) return;
        setDailyActionMonitor(result.operatorStats ?? []);
        setDailyActionTotalPendingShops(Number(result.totalPendingShops ?? 0));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDailyActionError(getErrorMessage(error, "今日待处理监控加载失败"));
      })
      .finally(() => {
        if (!active) return;
        setDailyActionLoading(false);
      });

    lastDailyActionFetchRef.current = Date.now();

    return () => {
      active = false;
    };
  }, [manualRefreshToken]);

  useEffect(() => {
    if (manualRefreshToken <= 0) {
      return;
    }

    let active = true;

    fetchWorkflowRecentSignedMonitor().then((result) => {
      if (!active) return;
      setRecentSignedMonitor(result.operatorStats ?? []);
      setRecentSignedTotalShops(Number(result.totalRecentSignedShops ?? 0));
    });

    lastRecentSignedFetchRef.current = Date.now();

    return () => {
      active = false;
    };
  }, [manualRefreshToken]);

  useEffect(() => {
    const now = Date.now();
    if (
      shouldThrottleOverviewRefresh({
        refreshSource: "passive",
        lastFetchAt: lastDailyActionFetchRef.current,
        now,
        throttleMs: OVERVIEW_THROTTLE_MS,
      })
    ) {
      return;
    }

    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setDailyActionLoading(true);
      setDailyActionError("");
    });
    fetchWorkflowDailyActionMonitor()
      .then((result) => {
        if (!active) return;
        setDailyActionMonitor(result.operatorStats ?? []);
        setDailyActionTotalPendingShops(Number(result.totalPendingShops ?? 0));
        if (shouldCommitOverviewRefreshFetch({ active })) {
          lastDailyActionFetchRef.current = now;
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDailyActionError(getErrorMessage(error, "今日待处理监控加载失败"));
      })
      .finally(() => {
        if (!active) return;
        setDailyActionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [passiveRefreshToken]);

  useEffect(() => {
    const now = Date.now();
    if (
      shouldThrottleOverviewRefresh({
        refreshSource: "passive",
        lastFetchAt: lastRecentSignedFetchRef.current,
        now,
        throttleMs: OVERVIEW_THROTTLE_MS,
      })
    ) {
      return;
    }

    let active = true;

    fetchWorkflowRecentSignedMonitor().then((result) => {
      if (!active) return;
      setRecentSignedMonitor(result.operatorStats ?? []);
      setRecentSignedTotalShops(Number(result.totalRecentSignedShops ?? 0));
      if (shouldCommitOverviewRefreshFetch({ active })) {
        lastRecentSignedFetchRef.current = now;
      }
    });

    return () => {
      active = false;
    };
  }, [passiveRefreshToken]);

  useEffect(() => {
    const query = buildWorkflowSummaryQuery({
      startDate,
      endDate,
      operatorName: chartOperator,
    });
    fetchWorkflowSummary(query).then((result) => setSummary(result));
  }, [chartOperator, endDate, startDate]);

  return {
    summary,
    dailyActionMonitor,
    dailyActionTotalPendingShops,
    dailyActionLoading,
    dailyActionError,
    recentSignedMonitor,
    recentSignedTotalShops,
    allOperators,
  };
}
