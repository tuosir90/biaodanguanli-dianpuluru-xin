import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const dailyPointDetailSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["meituan", "eleme"], index: true },
    uniqueKey: { type: String, required: true, trim: true },
    sheetName: { type: String, default: "", trim: true },
    rowData: { type: Schema.Types.Mixed, required: true },
    merchantId: { type: String, default: "", trim: true, index: true },
    storeId: { type: String, default: "", trim: true, index: true },
    shopName: { type: String, default: "", trim: true, index: true },
    recordDate: { type: String, default: "", trim: true },
    recordDateKey: { type: String, default: "", trim: true, index: true },
    amountValue: { type: Number, default: 0 },
    importedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "daily_point_details",
  }
);

dailyPointDetailSchema.index({ platform: 1, uniqueKey: 1 }, { unique: true });
dailyPointDetailSchema.index({ platform: 1, recordDateKey: 1 });
dailyPointDetailSchema.index({ recordDateKey: 1, merchantId: 1 });
dailyPointDetailSchema.index({ recordDateKey: 1, storeId: 1 });
dailyPointDetailSchema.index({ recordDateKey: 1, shopName: 1 });

export type DailyPointDetailDocument = InferSchemaType<typeof dailyPointDetailSchema>;

export const DailyPointDetail: Model<DailyPointDetailDocument> =
  (models.DailyPointDetail as Model<DailyPointDetailDocument>) ||
  model<DailyPointDetailDocument>("DailyPointDetail", dailyPointDetailSchema);
