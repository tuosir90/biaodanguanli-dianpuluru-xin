export type WorkflowFlowCoCompletionTone = "sky" | "teal" | "amber";

export type WorkflowFlowCoCompletionGroup = {
  keys: string[];
  label: string;
  tone: WorkflowFlowCoCompletionTone;
};

const SHARED_WORKFLOW_FLOW_CO_COMPLETION_GROUPS: WorkflowFlowCoCompletionGroup[] = [
  {
    keys: ["category_opt", "image_pack"],
    label: "分类栏优化 + 图片三件套",
    tone: "sky",
  },
];

const MEITUAN_WORKFLOW_FLOW_CO_COMPLETION_GROUPS: WorkflowFlowCoCompletionGroup[] = [
  {
    keys: ["new_store_privilege", "video_sign"],
    label: "开启新店特权 + 视频店招",
    tone: "teal",
  },
  {
    keys: ["image_wall", "campaign_plan"],
    label: "图片墙制作 + 外卖活动方案",
    tone: "amber",
  },
];

const ELEME_WORKFLOW_FLOW_CO_COMPLETION_GROUPS: WorkflowFlowCoCompletionGroup[] = [
  {
    keys: ["new_store_privilege", "video_sign"],
    label: "开启新店特权 + 视频店招",
    tone: "teal",
  },
  {
    keys: ["window_display", "campaign_plan"],
    label: "橱窗展示 + 外卖活动方案",
    tone: "amber",
  },
];

export function getWorkflowFlowCoCompletionToneClasses(
  tone: WorkflowFlowCoCompletionTone
) {
  if (tone === "amber") {
    return {
      notice:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200",
      chip:
        "bg-white/80 text-amber-700 dark:bg-bg-100/70 dark:text-amber-200",
      button:
        "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200",
    };
  }

  if (tone === "teal") {
    return {
      notice:
        "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-200",
      chip:
        "bg-white/80 text-teal-700 dark:bg-bg-100/70 dark:text-teal-200",
      button:
        "border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-200",
    };
  }

  return {
    notice:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-200",
    chip:
      "bg-white/80 text-sky-700 dark:bg-bg-100/70 dark:text-sky-200",
    button:
      "border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-200",
  };
}

function toNormalizedSet(values: Iterable<string>) {
  return new Set(
    Array.from(values, (value) => String(value ?? "").trim()).filter(Boolean)
  );
}

export function getWorkflowFlowCoCompletionGroups(deliveryPlatform?: string | null) {
  return String(deliveryPlatform ?? "").includes("饿了么")
    ? [
        ...SHARED_WORKFLOW_FLOW_CO_COMPLETION_GROUPS,
        ...ELEME_WORKFLOW_FLOW_CO_COMPLETION_GROUPS,
      ]
    : [
        ...SHARED_WORKFLOW_FLOW_CO_COMPLETION_GROUPS,
        ...MEITUAN_WORKFLOW_FLOW_CO_COMPLETION_GROUPS,
      ];
}

export function getPendingWorkflowFlowCoCompletionGroups(params: {
  deliveryPlatform?: string | null;
  incompleteFlowKeys: Iterable<string>;
}) {
  const incompleteSet = toNormalizedSet(params.incompleteFlowKeys);

  return getWorkflowFlowCoCompletionGroups(params.deliveryPlatform).filter((group) =>
    group.keys.some((progressKey) => incompleteSet.has(progressKey))
  );
}

export function isWorkflowFlowTaskCompletedToday(params: {
  deliveryPlatform?: string | null;
  incompleteFlowKeys: Iterable<string>;
  todayCompletedFlowKeys: Iterable<string>;
}) {
  const incompleteSet = toNormalizedSet(params.incompleteFlowKeys);
  const todayCompletedSet = toNormalizedSet(params.todayCompletedFlowKeys);
  if (todayCompletedSet.size === 0) {
    return false;
  }

  const hasPendingCoCompletionGroup = getWorkflowFlowCoCompletionGroups(
    params.deliveryPlatform
  ).some((group) => {
    const completedTodayInGroup = group.keys.some((progressKey) =>
      todayCompletedSet.has(progressKey)
    );
    if (!completedTodayInGroup) {
      return false;
    }

    return group.keys.some((progressKey) => incompleteSet.has(progressKey));
  });

  return !hasPendingCoCompletionGroup;
}
