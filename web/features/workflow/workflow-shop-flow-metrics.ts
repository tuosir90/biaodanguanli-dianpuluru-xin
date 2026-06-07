import { getWorkflowFlowProgressKeys } from "@/lib/workflow-flow-metrics";
import type { ShopFlowMetrics, ShopItem } from "./types";
import { statusKey } from "./utils";

type WorkflowShopFlowMetricsSource = Pick<
  ShopItem,
  "_id" | "deliveryPlatform" | "flowLockedProgressKeys"
>;

export function buildWorkflowShopFlowMetricsMap(
  shops: WorkflowShopFlowMetricsSource[],
  statusMap: Record<string, boolean>
) {
  const map: Record<string, ShopFlowMetrics> = {};

  shops.forEach((shop) => {
    const lockedProgressKeys = new Set(shop.flowLockedProgressKeys ?? []);
    const flowProgressKeys = getWorkflowFlowProgressKeys(shop.deliveryPlatform).filter(
      (progressKey) => !lockedProgressKeys.has(progressKey)
    );
    const completedCount = flowProgressKeys.filter((progressKey) =>
      Boolean(statusMap[statusKey(shop._id, progressKey)])
    ).length;

    map[shop._id] = {
      completedCount,
      totalProgressCount: flowProgressKeys.length,
      remainingCount: Math.max(flowProgressKeys.length - completedCount, 0),
    };
  });

  return map;
}
