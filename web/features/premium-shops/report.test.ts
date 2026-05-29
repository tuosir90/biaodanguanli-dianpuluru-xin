import { describe, expect, it } from "vitest";
import { buildPremiumShopReport } from "./report";

describe("buildPremiumShopReport", () => {
  it("按平台拆分在线未解约店铺并按累计回款从高到低排序", () => {
    const report = buildPremiumShopReport({
      shops: [
        {
          _id: "shop-m-low",
          shopName: "美团低回款店",
          merchantId: "m-low",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
        {
          _id: "shop-m-high",
          shopName: "美团高回款店",
          merchantId: "m-high",
          deliveryPlatform: "美团餐饮",
          shopStatus: "新店",
        },
        {
          _id: "shop-e-high",
          shopName: "饿了么高回款店",
          merchantId: "e-high",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "正常",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m-low",
          shopName: "美团低回款店",
          recordDateKey: "2026-05-27",
          amountValue: 8,
        },
        {
          platform: "meituan",
          storeId: "m-high",
          shopName: "美团高回款店",
          recordDateKey: "2026-05-28",
          amountValue: 12.345,
        },
        {
          platform: "meituan",
          storeId: "m-high",
          shopName: "美团高回款店",
          recordDateKey: "2026-05-29",
          amountValue: 7,
        },
        {
          platform: "eleme",
          storeId: "e-high",
          shopName: "饿了么高回款店",
          recordDateKey: "2026-05-28",
          amountValue: 20,
        },
      ],
    });

    expect(report.meituan.items.map((item) => item.shopName)).toEqual([
      "美团高回款店",
      "美团低回款店",
    ]);
    expect(report.meituan.items[0]).toMatchObject({
      rank: 1,
      totalAmount: 19.35,
      updatedDateKey: "2026-05-29",
      platformLabel: "美团",
    });
    expect(report.eleme.items[0]).toMatchObject({
      rank: 1,
      shopName: "饿了么高回款店",
      totalAmount: 20,
      updatedDateKey: "2026-05-28",
      platformLabel: "饿了么",
    });
  });

  it("排除已解约和无效店铺，未查到回款时保留0元并使用平台最新日期", () => {
    const report = buildPremiumShopReport({
      shops: [
        {
          _id: "shop-active",
          shopName: "在线无回款店",
          merchantId: "active",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
        {
          _id: "shop-terminated",
          shopName: "已解约店",
          merchantId: "terminated",
          deliveryPlatform: "美团餐饮",
          shopStatus: "已解约",
        },
        {
          _id: "shop-invalid",
          shopName: "无效店",
          merchantId: "invalid",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "无效店铺",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "other",
          shopName: "其他店",
          recordDateKey: "2026-05-29",
          amountValue: 99,
        },
      ],
      latestDateByPlatform: {
        meituan: "2026-05-29",
        eleme: "2026-05-28",
      },
    });

    expect(report.meituan.items).toEqual([
      {
        rank: 1,
        shopId: "shop-active",
        shopName: "在线无回款店",
        merchantId: "active",
        totalAmount: 0,
        updatedDateKey: "2026-05-29",
        platform: "meituan",
        platformLabel: "美团",
      },
    ]);
    expect(report.eleme.items).toEqual([]);
  });
});
