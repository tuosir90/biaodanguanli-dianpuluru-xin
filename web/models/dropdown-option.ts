import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const dropdownOptionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ["salesName", "operationMode", "operatorName", "deliveryPlatform"],
    },
    options: [{ type: String, required: true, trim: true }],
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    collection: "dropdown_options",
  }
);

export type DropdownOptionDocument = InferSchemaType<typeof dropdownOptionSchema>;

export const DropdownOption: Model<DropdownOptionDocument> =
  (models.DropdownOption as Model<DropdownOptionDocument>) ||
  model<DropdownOptionDocument>("DropdownOption", dropdownOptionSchema);
