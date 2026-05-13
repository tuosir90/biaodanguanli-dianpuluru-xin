export type WorkflowDailyActionType = "flow" | "patrol";

export type WorkflowDailyActionCandidate = {
  shopId: string;
  operatorName?: string | null;
  remainingCount: number;
  isNewShop: boolean;
  isInvalidShop?: boolean;
  flowCompletedToday: boolean;
  latestDailyPointMatched: boolean;
  daysUnpatrolled: number | null;
};

export type WorkflowDailyActionItem = WorkflowDailyActionCandidate & {
  actionType: WorkflowDailyActionType;
  operatorName: string;
};

export type WorkflowDailyActionSummary = {
  operatorStats: Array<{
    operatorName: string;
    pendingShopCount: number;
    flowPendingShopCount: number;
    patrolPendingShopCount: number;
  }>;
  totalPendingShops: number;
};

export const PATROL_PENDING_DAYS = 2;
export { isWorkflowFlowTaskCompletedToday } from "./flow-co-completion";

function normalizeOperatorName(value?: string | null) {
  return String(value ?? "").trim() || "未分配";
}

export function resolveWorkflowDailyAction(
  candidate: WorkflowDailyActionCandidate
): WorkflowDailyActionItem | null {
  if (candidate.isInvalidShop) {
    return null;
  }

  if (candidate.remainingCount > 0) {
    if (
      candidate.flowCompletedToday ||
      (!candidate.isNewShop && !candidate.latestDailyPointMatched)
    ) {
      return null;
    }

    return {
      ...candidate,
      operatorName: normalizeOperatorName(candidate.operatorName),
      actionType: "flow",
    };
  }

  if (!candidate.latestDailyPointMatched) {
    return null;
  }

  if ((candidate.daysUnpatrolled ?? 0) < PATROL_PENDING_DAYS) {
    return null;
  }

  return {
    ...candidate,
    operatorName: normalizeOperatorName(candidate.operatorName),
    actionType: "patrol",
  };
}

export function buildWorkflowDailyActionItems(
  candidates: WorkflowDailyActionCandidate[]
) {
  return candidates
    .map(resolveWorkflowDailyAction)
    .filter((item): item is WorkflowDailyActionItem => item !== null);
}

export function buildWorkflowDailyActionSummary(
  items: Array<Pick<WorkflowDailyActionItem, "operatorName" | "actionType">>
): WorkflowDailyActionSummary {
  const operatorStatsMap = new Map<
    string,
    {
      operatorName: string;
      pendingShopCount: number;
      flowPendingShopCount: number;
      patrolPendingShopCount: number;
    }
  >();

  items.forEach((item) => {
    const operatorName = normalizeOperatorName(item.operatorName);
    const current = operatorStatsMap.get(operatorName) ?? {
      operatorName,
      pendingShopCount: 0,
      flowPendingShopCount: 0,
      patrolPendingShopCount: 0,
    };

    current.pendingShopCount += 1;
    if (item.actionType === "flow") {
      current.flowPendingShopCount += 1;
    } else {
      current.patrolPendingShopCount += 1;
    }

    operatorStatsMap.set(operatorName, current);
  });

  return {
    operatorStats: Array.from(operatorStatsMap.values()).sort((left, right) =>
      left.operatorName.localeCompare(right.operatorName, "zh-CN")
    ),
    totalPendingShops: items.length,
  };
}
