import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const terminationDetailSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["meituan", "eleme"], index: true },
    uniqueKey: { type: String, required: true, trim: true },
    sheetName: { type: String, default: "", trim: true },
    rowData: { type: Schema.Types.Mixed, required: true },
    merchantId: { type: String, default: "", trim: true, index: true },
    storeId: { type: String, default: "", trim: true, index: true },
    shopName: { type: String, default: "", trim: true, index: true },
    applyTerminationTime: { type: String, default: "", trim: true },
    taskSubmittedTime: { type: String, default: "", trim: true },
    importedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "termination_details",
  }
);

terminationDetailSchema.index({ platform: 1, uniqueKey: 1 }, { unique: true });

export type TerminationDetailDocument = InferSchemaType<typeof terminationDetailSchema>;

export const TerminationDetail: Model<TerminationDetailDocument> =
  (models.TerminationDetail as Model<TerminationDetailDocument>) ||
  model<TerminationDetailDocument>("TerminationDetail", terminationDetailSchema);
