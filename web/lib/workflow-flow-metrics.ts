import { WORKFLOW_FLOW_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";

const MEITUAN_HIDDEN_PROGRESS_KEYS = new Set(["window_display"]);
const ELEME_HIDDEN_PROGRESS_KEYS = new Set([
  "image_wall",
  "mt_detail",
  "brand_story",
]);

const ELEME_DEFAULT_COMPLETED_PROGRESS_KEYS = ["video_sign", "window_display", "store_score"] as const;
const LEGACY_DEFAULT_COMPLETED_PROGRESS_KEYS = ["new_store_privilege"] as const;

type WorkflowFlowMetricsParams = {
  deliveryPlatform?: string | null;
  shopStatus?: string | null;
  completedKeys?: Iterable<string>;
  loggedKeys?: Iterable<string>;
  lockedProgressKeys?: Iterable<string>;
};

function toNormalizedSet(values?: Iterable<string>) {
  const output = new Set<string>();
  if (!values) {
    return output;
  }

  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      continue;
    }
    output.add(normalized);
  }

  return output;
}

export function getWorkflowFlowProgressKeys(deliveryPlatform?: string | null) {
  const platform = String(deliveryPlatform ?? "");
  if (!platform.includes("饿了么")) {
    return WORKFLOW_FLOW_PROGRESS_KEYS.filter(
      (progressKey) => !MEITUAN_HIDDEN_PROGRESS_KEYS.has(progressKey)
    );
  }

  return WORKFLOW_FLOW_PROGRESS_KEYS.filter(
    (progressKey) => !ELEME_HIDDEN_PROGRESS_KEYS.has(progressKey)
  );
}

function getRequiredWorkflowFlowProgressKeys(params: {
  deliveryPlatform?: string | null;
  lockedProgressKeys?: Iterable<string>;
}) {
  const lockedSet = toNormalizedSet(params.lockedProgressKeys);
  return getWorkflowFlowProgressKeys(params.deliveryPlatform).filter(
    (progressKey) => !lockedSet.has(progressKey)
  );
}

function applyDefaultCompletedProgressKeys(params: {
  completedSet: Set<string>;
  loggedSet: Set<string>;
  flowKeys: string[];
  defaultProgressKeys: readonly string[];
  baselineExcludedProgressKeys?: readonly string[];
}) {
  const baselineExcludedSet = new Set<string>([
    ...params.defaultProgressKeys,
    ...(params.baselineExcludedProgressKeys ?? []),
  ]);
  const baselineKeys = params.flowKeys.filter(
    (progressKey) => !baselineExcludedSet.has(progressKey)
  );
  const isBaselineCompleted = baselineKeys.every((progressKey) =>
    params.completedSet.has(progressKey)
  );

  if (!isBaselineCompleted) {
    return;
  }

  params.defaultProgressKeys.forEach((progressKey) => {
    if (!params.loggedSet.has(progressKey)) {
      params.completedSet.add(progressKey);
    }
  });
}

export function getWorkflowEffectiveCompletedKeys({
  deliveryPlatform,
  shopStatus,
  completedKeys,
  loggedKeys,
  lockedProgressKeys,
}: WorkflowFlowMetricsParams) {
  const completedSet = toNormalizedSet(completedKeys);
  const loggedSet = toNormalizedSet(loggedKeys);
  const flowKeys = getRequiredWorkflowFlowProgressKeys({
    deliveryPlatform,
    lockedProgressKeys,
  });
  const isElemeShop = String(deliveryPlatform ?? "").includes("饿了么");
  const isNewShop = String(shopStatus ?? "").trim() === "新店";

  if (!isElemeShop && !isNewShop && !loggedSet.has("image_wall")) {
    completedSet.add("image_wall");
  }

  if (isElemeShop) {
    applyDefaultCompletedProgressKeys({
      completedSet,
      loggedSet,
      flowKeys,
      defaultProgressKeys: ELEME_DEFAULT_COMPLETED_PROGRESS_KEYS,
      baselineExcludedProgressKeys: LEGACY_DEFAULT_COMPLETED_PROGRESS_KEYS,
    });
  }

  applyDefaultCompletedProgressKeys({
    completedSet,
    loggedSet,
    flowKeys,
    defaultProgressKeys: LEGACY_DEFAULT_COMPLETED_PROGRESS_KEYS,
  });

  return completedSet;
}

export function getWorkflowFlowMetrics({
  deliveryPlatform,
  shopStatus,
  completedKeys,
  loggedKeys,
  lockedProgressKeys,
}: WorkflowFlowMetricsParams) {
  const flowKeys = getRequiredWorkflowFlowProgressKeys({
    deliveryPlatform,
    lockedProgressKeys,
  });
  const completedSet = getWorkflowEffectiveCompletedKeys({
    deliveryPlatform,
    shopStatus,
    completedKeys,
    loggedKeys,
    lockedProgressKeys,
  });

  const completedCount = flowKeys.filter((progressKey) =>
    completedSet.has(progressKey)
  ).length;

  return {
    completedCount,
    totalProgressCount: flowKeys.length,
    remainingCount: Math.max(flowKeys.length - completedCount, 0),
  };
}
