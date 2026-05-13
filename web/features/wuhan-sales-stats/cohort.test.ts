import { describe, expect, it } from "vitest";
import {
  buildWuhanSalesAccumulatedShopCohort,
  buildWuhanSalesDetailFilterSets,
  buildWuhanSalesSignedShopCohort,
} from "./cohort";

describe("buildWuhanSalesSignedShopCohort", () => {
  it("只保留当月武汉开单店铺，并优先按录入日期归属月份", () => {
    const shops = buildWuhanSalesSignedShopCohort({
      month: "2026-03",
      shops: [
        {
          _id: "march-1",
          shopName: "3月武汉店",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-10T00:00:00+08:00",
          contractSignedDate: "2026-03-09T00:00:00+08:00",
        },
        {
          _id: "april-1",
          shopName: "4月武汉店",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-04-01T00:00:00+08:00",
          contractSignedDate: "2026-03-31T00:00:00+08:00",
        },
        {
          _id: "yc-1",
          shopName: "宜昌店",
          merchantId: "m3",
          deliveryPlatform: "美团餐饮",
          salesName: "王五",
          salesCity: "宜昌",
          entryDate: "2026-03-12T00:00:00+08:00",
          contractSignedDate: "2026-03-12T00:00:00+08:00",
        },
      ],
    });

    expect(shops.map((shop) => shop._id)).toEqual(["march-1"]);
  });
});

describe("buildWuhanSalesDetailFilterSets", () => {
  it("只使用当月 cohort 的商家ID和店名构建抽点过滤条件", () => {
    const filters = buildWuhanSalesDetailFilterSets([
      {
        _id: "march-1",
        shopName: "3月武汉店",
        merchantId: "m1",
        deliveryPlatform: "美团餐饮",
        salesName: "屈维涛",
        salesCity: "武汉",
        entryDate: "2026-03-10T00:00:00+08:00",
        contractSignedDate: "2026-03-09T00:00:00+08:00",
      },
      {
        _id: "march-2",
        shopName: "无商家ID店铺",
        merchantId: "",
        deliveryPlatform: "饿了么餐饮",
        salesName: "李帅",
        salesCity: "武汉",
        entryDate: "2026-03-11T00:00:00+08:00",
        contractSignedDate: "2026-03-11T00:00:00+08:00",
      },
    ]);

    expect(filters).toEqual({
      merchantIds: ["m1"],
      shopNames: ["3月武汉店", "无商家ID店铺"],
      detailFilters: [
        { merchantId: { $in: ["m1"] } },
        { storeId: { $in: ["m1"] } },
        { shopName: { $in: ["3月武汉店", "无商家ID店铺"] } },
      ],
    });
  });
});

describe("buildWuhanSalesAccumulatedShopCohort", () => {
  it("保留截至统计月之前已开单的全部武汉店铺", () => {
    const shops = buildWuhanSalesAccumulatedShopCohort([
      {
        _id: "march-1",
        shopName: "3月武汉店",
        merchantId: "m1",
        deliveryPlatform: "美团餐饮",
        salesName: "屈维涛",
        salesCity: "武汉",
        entryDate: "2026-03-10T00:00:00+08:00",
        contractSignedDate: "2026-03-09T00:00:00+08:00",
      },
      {
        _id: "april-1",
        shopName: "4月武汉店",
        merchantId: "m2",
        deliveryPlatform: "美团餐饮",
        salesName: "李帅",
        salesCity: "武汉",
        entryDate: "2026-04-01T00:00:00+08:00",
        contractSignedDate: "2026-04-01T00:00:00+08:00",
      },
      {
        _id: "yc-1",
        shopName: "宜昌店",
        merchantId: "m3",
        deliveryPlatform: "美团餐饮",
        salesName: "王五",
        salesCity: "宜昌",
        entryDate: "2026-03-12T00:00:00+08:00",
        contractSignedDate: "2026-03-12T00:00:00+08:00",
      },
    ]);

    expect(shops.map((shop) => shop._id)).toEqual(["march-1", "april-1"]);
  });
});
