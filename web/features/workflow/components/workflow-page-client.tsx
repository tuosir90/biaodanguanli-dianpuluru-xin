"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getWorkflowFlowMetrics } from "@/lib/workflow-flow-metrics";
import { ELEME_FLOW_PROGRESS_ITEMS, FLOW_PROGRESS_ITEMS } from "../constants";
import { useWorkflowDetailData } from "../hooks/use-workflow-detail-data";
import { useWorkflowFilters } from "../hooks/use-workflow-filters";
import { useWorkflowOverviewData } from "../hooks/use-workflow-overview-data";
import type { ShopFlowMetrics } from "../types";
import {
  buildWorkflowListResetKey,
  collectWorkflowOperators,
  hasWorkflowActiveDetailFilters,
} from "../workflow-page-state";
import { statusKey } from "../utils";
import { WorkflowPageContent } from "./workflow-page-content";

const WORKFLOW_POLL_INTERVAL_MS = 2 * 60 * 1000;
const WORKFLOW_HIDDEN_POLL_INTERVAL_MS = 10 * 60 * 1000;
const WORKFLOW_VISIBILITY_RECOVER_DELAY_MS = 3 * 1000;
const WORKFLOW_POLL_RETRY_DELAY_MS = 30 * 1000;

export function WorkflowPageClient() {
  const filters = useWorkflowFilters();
  const [externalRefreshToken, setExternalRefreshToken] = useState(0);
  const debouncedShopNameKeyword = useDebouncedValue(filters.shopNameKeyword, 300);
  const debouncedMerchantIdKeyword = useDebouncedValue(filters.merchantIdKeyword, 300);
  const debouncedStatusKeyword = useDebouncedValue(filters.statusKeyword, 150);

  useEffect(() => {
    let disposed = false;
    let timer: number | null = null;
    let baselineVersion: number | null = null;
    let lastPollAt = 0;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const schedulePoll = (delayMs: number) => {
      clearTimer();
      if (disposed) return;
      timer = window.setTimeout(() => {
        void poll();
      }, Math.max(delayMs, 0));
    };

    const nextIntervalByVisibility = () =>
      document.hidden ? WORKFLOW_HIDDEN_POLL_INTERVAL_MS : WORKFLOW_POLL_INTERVAL_MS;

    const poll = async () => {
      if (disposed) return;
      lastPollAt = Date.now();
      try {
        const res = await fetch("/api/workflow/refresh-stream");
        if (!res.ok) {
          schedulePoll(WORKFLOW_POLL_RETRY_DELAY_MS);
          return;
        }
        const data = (await res.json()) as { version: number };
        if (baselineVersion === null) {
          baselineVersion = data.version;
        } else if (data.version > baselineVersion) {
          baselineVersion = data.version;
          setExternalRefreshToken((previous) => previous + 1);
        }
        schedulePoll(nextIntervalByVisibility());
      } catch {
        schedulePoll(WORKFLOW_POLL_RETRY_DELAY_MS);
      }
    };

    const handleVisibilityChange = () => {
      const elapsedMs = Date.now() - lastPollAt;
      if (document.hidden) {
        schedulePoll(WORKFLOW_HIDDEN_POLL_INTERVAL_MS);
        return;
      }
      if (elapsedMs >= WORKFLOW_POLL_INTERVAL_MS) {
        schedulePoll(WORKFLOW_VISIBILITY_RECOVER_DELAY_MS);
        return;
      }
      schedulePoll(WORKFLOW_POLL_INTERVAL_MS - elapsedMs);
    };

    void poll();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const detailData = useWorkflowDetailData({
    selectedOperator: filters.selectedOperator,
    detailPage: filters.detailPage,
    recentSignedFilterOperator: filters.recentSignedFilterOperator,
    dailyActionFilterOperator: filters.dailyActionFilterOperator,
    shopNameKeyword: debouncedShopNameKeyword,
    merchantIdKeyword: debouncedMerchantIdKeyword,
    statusKeyword: debouncedStatusKeyword,
    externalRefreshToken,
  });
  const overviewData = useWorkflowOverviewData({
    initialMonth: filters.initialMonth,
    startDate: filters.startDate,
    endDate: filters.endDate,
    chartOperator: filters.chartOperator,
    manualRefreshToken: detailData.overviewRefreshToken,
    passiveRefreshToken: externalRefreshToken,
  });

  const operators = useMemo(
    () =>
      collectWorkflowOperators({
        overviewOperators: overviewData.allOperators,
        detailShops: detailData.shops,
      }),
    [detailData.shops, overviewData.allOperators]
  );

  const shopFlowMetricsMap = useMemo(() => {
    const map: Record<string, ShopFlowMetrics> = {};
    detailData.shops.forEach((shop) => {
      const flowProgressItems = (shop.deliveryPlatform ?? "").includes("饿了么")
        ? ELEME_FLOW_PROGRESS_ITEMS
        : FLOW_PROGRESS_ITEMS;
      const completedKeys = flowProgressItems
        .filter((item) => Boolean(detailData.statusMap[statusKey(shop._id, item.key)]))
        .map((item) => item.key);
      map[shop._id] = getWorkflowFlowMetrics({
        deliveryPlatform: shop.deliveryPlatform,
        shopStatus: shop.shopStatus,
        completedKeys,
        lockedProgressKeys: shop.flowLockedProgressKeys,
      });
    });
    return map;
  }, [detailData.shops, detailData.statusMap]);

  const detailLoading = detailData.loading || detailData.statusLoading || detailData.patrolStatusLoading;
  const isDailyActionPaginationMode = Boolean(filters.dailyActionFilterOperator);
  const hasActiveDetailFilters = useMemo(
    () =>
      hasWorkflowActiveDetailFilters({
        shopNameKeyword: filters.shopNameKeyword,
        merchantIdKeyword: filters.merchantIdKeyword,
        statusKeyword: filters.statusKeyword,
        recentSignedFilterOperator: filters.recentSignedFilterOperator,
        dailyActionFilterOperator: filters.dailyActionFilterOperator,
      }),
    [
      filters.dailyActionFilterOperator,
      filters.merchantIdKeyword,
      filters.recentSignedFilterOperator,
      filters.shopNameKeyword,
      filters.statusKeyword,
    ]
  );
  const listResetKey = useMemo(
    () =>
      buildWorkflowListResetKey({
        selectedOperator: filters.selectedOperator,
        detailPage: filters.detailPage,
        shopNameKeyword: filters.shopNameKeyword,
        merchantIdKeyword: filters.merchantIdKeyword,
        statusKeyword: filters.statusKeyword,
        recentSignedFilterOperator: filters.recentSignedFilterOperator,
        dailyActionFilterOperator: filters.dailyActionFilterOperator,
      }),
    [
      filters.dailyActionFilterOperator,
      filters.detailPage,
      filters.merchantIdKeyword,
      filters.recentSignedFilterOperator,
      filters.selectedOperator,
      filters.shopNameKeyword,
      filters.statusKeyword,
    ]
  );

  return (
    <WorkflowPageContent
      filters={filters}
      operators={operators}
      detailData={detailData}
      overviewData={overviewData}
      detailLoading={detailLoading}
      isDailyActionPaginationMode={isDailyActionPaginationMode}
      hasActiveDetailFilters={hasActiveDetailFilters}
      listResetKey={listResetKey}
      shopFlowMetricsMap={shopFlowMetricsMap}
    />
  );
}
