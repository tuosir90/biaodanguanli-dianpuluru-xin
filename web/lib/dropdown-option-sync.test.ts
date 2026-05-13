import { describe, expect, it } from "vitest";
import { buildShopDropdownOptionBulkOperations } from "@/lib/dropdown-option-sync";

describe("buildShopDropdownOptionBulkOperations", () => {
  it("为店铺录入中的可扩展下拉字段生成持久化操作", () => {
    const operations = buildShopDropdownOptionBulkOperations({
      salesName: " 赵春燕 ",
      operationMode: " 按天付费6% ",
      operatorName: " 秦金城 ",
      deliveryPlatform: " 美团餐饮 ",
    });

    expect(operations).toEqual([
      {
        updateOne: {
          filter: { key: "salesName" },
          update: { $addToSet: { options: "赵春燕" } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { key: "operatorName" },
          update: { $addToSet: { options: "秦金城" } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { key: "deliveryPlatform" },
          update: { $addToSet: { options: "美团餐饮" } },
          upsert: true,
        },
      },
    ]);
  });

  it("会跳过空值和运营模式，避免写入不该扩展的下拉项", () => {
    const operations = buildShopDropdownOptionBulkOperations({
      salesName: " ",
      operationMode: "按天付费6%",
      operatorName: "",
      deliveryPlatform: "  ",
    });

    expect(operations).toEqual([]);
  });
});
