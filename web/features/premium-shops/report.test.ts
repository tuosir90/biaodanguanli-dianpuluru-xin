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
          wechatGroupName: "美团低回款群",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
          contractSignedDate: "2026-05-26T00:00:00+08:00",
        },
        {
          _id: "shop-m-high",
          shopName: "美团高回款店",
          merchantId: "m-high",
          wechatGroupName: "美团高回款群",
          deliveryPlatform: "美团餐饮",
          shopStatus: "新店",
          contractSignedDate: "2026-05-27T00:00:00+08:00",
        },
        {
          _id: "shop-e-high",
          shopName: "饿了么高回款店",
          merchantId: "e-high",
          wechatGroupName: "饿了么高回款群",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "正常",
          contractSignedDate: "2026-05-28T00:00:00+08:00",
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
      merchantId: "m-high",
      wechatGroupName: "美团高回款群",
      totalAmount: 19.35,
      cooperationDays: 3,
      averageDailyAmount: 6.45,
      updatedDateKey: "2026-05-29",
      platformLabel: "美团",
    });
    expect(report.meituan.items[1]).toMatchObject({
      totalAmount: 8,
      cooperationDays: 4,
      averageDailyAmount: 2,
      updatedDateKey: "2026-05-29",
    });
    expect(report.eleme.items[0]).toMatchObject({
      rank: 1,
      shopName: "饿了么高回款店",
      totalAmount: 20,
      cooperationDays: 1,
      averageDailyAmount: 20,
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
          wechatGroupName: "在线无回款群",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
          contractSignedDate: "2026-05-27T00:00:00+08:00",
        },
        {
          _id: "shop-terminated",
          shopName: "已解约店",
          merchantId: "terminated",
          wechatGroupName: "已解约群",
          deliveryPlatform: "美团餐饮",
          shopStatus: "已解约",
          contractSignedDate: "2026-05-27T00:00:00+08:00",
        },
        {
          _id: "shop-invalid",
          shopName: "无效店",
          merchantId: "invalid",
          wechatGroupName: "无效群",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "无效店铺",
          contractSignedDate: "2026-05-27T00:00:00+08:00",
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
        wechatGroupName: "在线无回款群",
        totalAmount: 0,
        cooperationDays: 3,
        averageDailyAmount: 0,
        updatedDateKey: "2026-05-29",
        platform: "meituan",
        platformLabel: "美团",
      },
    ]);
    expect(report.eleme.items).toEqual([]);
  });
});
