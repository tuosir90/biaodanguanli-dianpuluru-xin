import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const workflowProgressLogSchema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    operatorName: { type: String, required: true, trim: true, index: true },
    progressDate: { type: Date, required: true, index: true },
    progressKey: { type: String, required: true, trim: true },
    progressLabel: { type: String, required: true, trim: true },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "workflow_progress_logs",
  }
);

workflowProgressLogSchema.index(
  { shopId: 1, progressDate: 1, progressKey: 1 },
  { unique: true }
);
workflowProgressLogSchema.index({ shopId: 1, progressKey: 1, updatedAt: -1, _id: -1 });
workflowProgressLogSchema.index({ shopId: 1, completed: 1, progressKey: 1, completedAt: -1 });
workflowProgressLogSchema.index({ shopId: 1, completed: 1, progressDate: -1, progressKey: 1 });

export type WorkflowProgressLogDocument = InferSchemaType<
  typeof workflowProgressLogSchema
>;

export const WorkflowProgressLog: Model<WorkflowProgressLogDocument> =
  (models.WorkflowProgressLog as Model<WorkflowProgressLogDocument>) ||
  model<WorkflowProgressLogDocument>(
    "WorkflowProgressLog",
    workflowProgressLogSchema
  );
