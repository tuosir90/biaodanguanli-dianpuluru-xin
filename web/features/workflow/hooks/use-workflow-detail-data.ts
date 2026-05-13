import { useCallback, useEffect, useState } from "react";
import {
  fetchWorkflowDetailShops,
  fetchWorkflowPatrolStatusMap,
  fetchWorkflowStatusMap,
} from "../workflow-detail-loaders";
import {
  copyWorkflowShopNameAction,
  markWorkflowDailyPatrolAction,
  toggleWorkflowProgressAction,
} from "../workflow-detail-actions";
import { WORKFLOW_BATCH_SIZE } from "../constants";
import type { PatrolStatusItem, ShopItem } from "../types";
import { statusKey, todayDateValue } from "../utils";

type UseWorkflowDetailDataParams = {
  selectedOperator: string;
  detailPage: number;
  recentSignedFilterOperator: string;
  dailyActionFilterOperator: string;
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
  externalRefreshToken: number;
};

export function useWorkflowDetailData({
  selectedOperator,
  detailPage,
  recentSignedFilterOperator,
  dailyActionFilterOperator,
  shopNameKeyword,
  merchantIdKeyword,
  statusKeyword,
  externalRefreshToken,
}: UseWorkflowDetailDataParams) {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [shopsTotal, setShopsTotal] = useState(0), [loading, setLoading] = useState(true);
  const [hasNextWindow, setHasNextWindow] = useState(false), [statusLoading, setStatusLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [patrolDateMap, setPatrolDateMap] = useState<Record<string, string>>({});
  const [patrolStatusMap, setPatrolStatusMap] = useState<Record<string, PatrolStatusItem>>({});
  const [patrolStatusLoading, setPatrolStatusLoading] = useState(false), [copiedShopId, setCopiedShopId] = useState<string | null>(null);
  const [patrolLoadingMap, setPatrolLoadingMap] = useState<Record<string, boolean>>({}), [patrolMessageMap, setPatrolMessageMap] = useState<Record<string, string>>({});
  const [overviewRefreshToken, setOverviewRefreshToken] = useState(0);
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetchWorkflowDetailShops({
      detailPage,
      selectedOperator,
      recentSignedFilterOperator,
      dailyActionFilterOperator,
      shopNameKeyword,
      merchantIdKeyword,
      statusKeyword,
    })
      .then((result) => {
        if (cancelled) return;
        const total = Number(result.total ?? 0);
        setShops((result.data ?? []) as ShopItem[]);
        setShopsTotal(total);
        setHasNextWindow(total > detailPage * 15);
      })
      .catch(() => {
        if (cancelled) return;
        setShops([]);
        setShopsTotal(0);
        setHasNextWindow(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [detailPage, detailRefreshToken, externalRefreshToken, dailyActionFilterOperator, merchantIdKeyword, recentSignedFilterOperator, selectedOperator, shopNameKeyword, statusKeyword]);

  useEffect(() => {
    const shopIds = shops.map((item) => item._id).filter(Boolean);
    let cancelled = false;
    if (shopIds.length === 0) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatusMap({});
          setStatusLoading(false);
        }
      });
      return;
    }
    queueMicrotask(() => {
      if (!cancelled) {
        setStatusLoading(true);
        setStatusMap({});
      }
    });
    fetchWorkflowStatusMap({
      selectedOperator,
      shopIds,
      batchSize: WORKFLOW_BATCH_SIZE,
    }).then((map) => {
        if (cancelled) return;
        setStatusMap(map);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedOperator, shops]);

  useEffect(() => {
    const shopIds = shops.map((item) => item._id).filter(Boolean);
    let cancelled = false;
    if (shopIds.length === 0) {
      queueMicrotask(() => {
        if (!cancelled) {
          setPatrolStatusMap({});
          setPatrolStatusLoading(false);
        }
      });
      return;
    }
    queueMicrotask(() => {
      if (!cancelled) {
        setPatrolStatusLoading(true);
        setPatrolStatusMap({});
      }
    });
    fetchWorkflowPatrolStatusMap({
      shopIds,
      batchSize: WORKFLOW_BATCH_SIZE,
    }).then((map) => {
        if (cancelled) return;
        setPatrolStatusMap(map);
      })
      .finally(() => {
        if (!cancelled) setPatrolStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [shops]);

  const toggleProgress = useCallback(async (
    shopId: string,
    operatorName: string,
    progressKey: string,
    progressLabel: string
  ) => {
    await toggleWorkflowProgressAction({
      shopId,
      operatorName,
      progressKey,
      progressLabel,
      previousCompleted: Boolean(statusMap[statusKey(shopId, progressKey)]),
      setStatusMap, setOverviewRefreshToken, setDetailRefreshToken, setPatrolStatusMap,
    });
  }, [statusMap]);

  const markDailyPatrol = useCallback(async (shop: ShopItem) => {
    await markWorkflowDailyPatrolAction({
      shop,
      patrolDate: patrolDateMap[shop._id] || todayDateValue(),
      setPatrolLoadingMap, setOverviewRefreshToken, setDetailRefreshToken, setPatrolMessageMap, setPatrolStatusMap,
    });
  }, [patrolDateMap]);

  const copyShopName = useCallback(async (shopId: string, shopName: string) => {
    await copyWorkflowShopNameAction({
      shopId,
      shopName,
      setCopiedShopId,
    });
  }, []);

  return {
    shops, shopsTotal, loading, hasNextWindow, statusMap, statusLoading,
    patrolDateMap, setPatrolDateMap, patrolStatusMap, patrolStatusLoading,
    patrolLoadingMap, patrolMessageMap, copiedShopId, overviewRefreshToken, toggleProgress, markDailyPatrol,
    copyShopName,
  };
}
