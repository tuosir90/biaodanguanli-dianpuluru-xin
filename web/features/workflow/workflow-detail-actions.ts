import {
  buildWorkflowStatusQuery,
  fetchWorkflowPatrolStatus,
  markWorkflowDailyPatrol,
  toggleWorkflowProgress,
} from "./api";
import type { PatrolStatusItem, ShopItem } from "./types";
import { DAILY_PATROL_LABEL } from "./constants";
import { statusKey } from "./utils";

export async function toggleWorkflowProgressAction(params: {
  shopId: string;
  operatorName: string;
  progressKey: string;
  progressLabel: string;
  previousCompleted: boolean;
  setStatusMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOverviewRefreshToken: React.Dispatch<React.SetStateAction<number>>;
  setDetailRefreshToken: React.Dispatch<React.SetStateAction<number>>;
  setPatrolStatusMap: React.Dispatch<
    React.SetStateAction<Record<string, PatrolStatusItem>>
  >;
}) {
  const next = !params.previousCompleted;
  params.setStatusMap((prev) => ({
    ...prev,
    [statusKey(params.shopId, params.progressKey)]: next,
  }));

  try {
    await toggleWorkflowProgress({
      shopId: params.shopId,
      operatorName: params.operatorName,
      progressKey: params.progressKey,
      progressLabel: params.progressLabel,
      completed: next,
    });
    params.setOverviewRefreshToken((value) => value + 1);
    params.setDetailRefreshToken((value) => value + 1);
    const patrolResult = await fetchWorkflowPatrolStatus(
      buildWorkflowStatusQuery({ shopIds: [params.shopId] })
    );
    const latest = patrolResult.patrolStatus?.[0];
    params.setPatrolStatusMap((prev) => {
      if (!latest) {
        if (!(params.shopId in prev)) return prev;
        const nextMap = { ...prev };
        delete nextMap[params.shopId];
        return nextMap;
      }
      return { ...prev, [params.shopId]: latest };
    });
  } catch (error) {
    params.setStatusMap((prev) => ({
      ...prev,
      [statusKey(params.shopId, params.progressKey)]: params.previousCompleted,
    }));
    throw error;
  }
}

export async function markWorkflowDailyPatrolAction(params: {
  shop: Pick<ShopItem, "_id" | "shopName" | "operatorName">;
  patrolDate: string;
  setPatrolLoadingMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOverviewRefreshToken: React.Dispatch<React.SetStateAction<number>>;
  setDetailRefreshToken: React.Dispatch<React.SetStateAction<number>>;
  setPatrolMessageMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setPatrolStatusMap: React.Dispatch<
    React.SetStateAction<Record<string, PatrolStatusItem>>
  >;
}) {
  params.setPatrolLoadingMap((prev) => ({ ...prev, [params.shop._id]: true }));
  try {
    const response = await markWorkflowDailyPatrol({
      shopId: params.shop._id,
      operatorName: params.shop.operatorName || "",
      patrolDate: params.patrolDate,
      completed: true,
    });
    if (!response.ok) throw new Error("每日巡店标记失败");
    params.setOverviewRefreshToken((value) => value + 1);
    params.setDetailRefreshToken((value) => value + 1);
    params.setPatrolMessageMap((prev) => ({
      ...prev,
      [params.shop._id]: `${params.patrolDate} ${DAILY_PATROL_LABEL} 已标记`,
    }));
    const statusResult = await fetchWorkflowPatrolStatus(
      buildWorkflowStatusQuery({ shopIds: [params.shop._id] })
    );
    const latest = statusResult.patrolStatus?.[0];
    if (latest) {
      params.setPatrolStatusMap((prev) => ({ ...prev, [params.shop._id]: latest }));
    }
  } finally {
    params.setPatrolLoadingMap((prev) => ({ ...prev, [params.shop._id]: false }));
  }
}

export async function copyWorkflowShopNameAction(params: {
  shopId: string;
  shopName: string;
  setCopiedShopId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  if (!params.shopName) return;

  try {
    await navigator.clipboard.writeText(params.shopName);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = params.shopName;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  params.setCopiedShopId(params.shopId);
  setTimeout(() => params.setCopiedShopId(null), 1500);
}
