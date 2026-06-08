import type { PipelineStage } from "mongoose";

export function buildWorkflowShopCountByOperatorPipeline(
  start: Date,
  end: Date
): PipelineStage[] {
  return [
    { $match: { contractSignedDate: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $ifNull: ["$operatorName", ""] },
        shopCount: { $sum: 1 },
      },
    },
    { $project: { _id: 0, operatorName: "$_id", shopCount: 1 } },
    { $sort: { shopCount: -1, operatorName: 1 } },
  ];
}
