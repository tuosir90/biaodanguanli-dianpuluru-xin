import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const onlineShopCountSnapshotSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["meituan", "eleme"], index: true },
    statDateKey: { type: String, required: true, trim: true, index: true },
    count: { type: Number, required: true, min: 0 },
    summaryText: { type: String, default: "", trim: true },
    captureSource: { type: String, default: "online-shop-crawler", trim: true },
    captureKey: { type: String, required: true, trim: true },
    capturedAt: { type: Date, required: true, index: true },
    importedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "online_shop_count_snapshots",
  }
);

onlineShopCountSnapshotSchema.index({ platform: 1, captureKey: 1 }, { unique: true });
onlineShopCountSnapshotSchema.index({ statDateKey: 1, platform: 1, capturedAt: -1 });

export type OnlineShopCountSnapshotDocument = InferSchemaType<
  typeof onlineShopCountSnapshotSchema
>;

export const OnlineShopCountSnapshot: Model<OnlineShopCountSnapshotDocument> =
  (models.OnlineShopCountSnapshot as Model<OnlineShopCountSnapshotDocument>) ||
  model<OnlineShopCountSnapshotDocument>(
    "OnlineShopCountSnapshot",
    onlineShopCountSnapshotSchema
  );
