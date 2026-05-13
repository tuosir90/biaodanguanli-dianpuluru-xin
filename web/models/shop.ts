import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const shopSchema = new Schema(
  {
    entryDate: { type: Date, required: true, index: true },
    shopName: { type: String, required: true, trim: true },
    merchantId: { type: String, default: "", trim: true, index: true },
    wechatGroupName: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    salesName: { type: String, default: "", trim: true, index: true },
    salesEmploymentStatus: {
      type: String,
      enum: ["", "在职", "离职"],
      default: "",
      trim: true,
      index: true,
    },
    salesCity: { type: String, default: "", trim: true, index: true },
    contractSignedDate: { type: Date, required: true },
    operationMode: { type: String, default: "", trim: true },
    operatorName: { type: String, default: "", trim: true, index: true },
    operatorEmploymentStatus: {
      type: String,
      enum: ["", "在职", "离职"],
      default: "",
      trim: true,
      index: true,
    },
    deliveryPlatform: { type: String, default: "", trim: true },
    shopStatus: {
      type: String,
      enum: ["正常", "已解约", "无效店铺", "新店"],
      default: "正常",
      trim: true,
    },
    terminationDate: { type: Date, default: null },
    terminationCooperationDays: { type: Number, default: null },
  },
  {
    timestamps: true,
    collection: "shops",
  }
);

shopSchema.index({ entryDate: -1 });
shopSchema.index({ contractSignedDate: -1 });
shopSchema.index({ shopStatus: 1, terminationDate: -1 });
shopSchema.index({ operatorName: 1, entryDate: -1 });
shopSchema.index({ operatorEmploymentStatus: 1, operatorName: 1, entryDate: -1 });
shopSchema.index({ salesName: 1, entryDate: -1 });
shopSchema.index({ salesEmploymentStatus: 1, salesName: 1, entryDate: -1 });
shopSchema.index({ salesCity: 1, entryDate: -1 });

export type ShopDocument = InferSchemaType<typeof shopSchema>;

export const Shop: Model<ShopDocument> =
  (models.Shop as Model<ShopDocument>) || model<ShopDocument>("Shop", shopSchema);
