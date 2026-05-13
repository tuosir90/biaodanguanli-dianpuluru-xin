import type { PipelineStage } from "mongoose";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

export type WorkflowStatusSnapshot = {
  completedKeys: Set<string>;
  loggedKeys: Set<string>;
};

const LATEST_STATUS_HINT = {
  shopId: 1,
  progressKey: 1,
  updatedAt: -1,
  _id: -1,
} as const;

export async function fetchWorkflowStatusSnapshotByShopIds(
  shopIds: unknown[],
  progressKeys: readonly string[]
) {
  if (shopIds.length === 0 || progressKeys.length === 0) {
    return new Map<string, WorkflowStatusSnapshot>();
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        shopId: { $in: shopIds },
        progressKey: { $in: [...progressKeys] },
      },
    },
    { $sort: { updatedAt: -1, _id: -1 } },
    {
      $group: {
        _id: {
          shopId: "$shopId",
          progressKey: "$progressKey",
        },
        completed: { $first: "$completed" },
      },
    },
    {
      $group: {
        _id: "$_id.shopId",
        completedKeys: {
          $addToSet: {
            $cond: [{ $eq: ["$completed", true] }, "$_id.progressKey", "$$REMOVE"],
          },
        },
        loggedKeys: { $addToSet: "$_id.progressKey" },
      },
    },
    {
      $project: {
        _id: 0,
        shopId: { $toString: "$_id" },
        completedKeys: 1,
        loggedKeys: 1,
      },
    },
  ];

  type SnapshotRow = {
    shopId: string;
    completedKeys?: string[];
    loggedKeys?: string[];
  };

  let rows: SnapshotRow[] = [];

  try {
    rows = await WorkflowProgressLog.aggregate<SnapshotRow>(pipeline)
      .hint(LATEST_STATUS_HINT)
      .option({ comment: "workflow_status_snapshot_with_hint" });
  } catch {
    rows = await WorkflowProgressLog.aggregate<SnapshotRow>(pipeline).option({
      comment: "workflow_status_snapshot_no_hint",
    });
  }

  return new Map<string, WorkflowStatusSnapshot>(
    rows.map((row) => [
      row.shopId,
      {
        completedKeys: new Set((row.completedKeys ?? []).filter(Boolean)),
        loggedKeys: new Set((row.loggedKeys ?? []).filter(Boolean)),
      },
    ])
  );
}
