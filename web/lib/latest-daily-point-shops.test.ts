import { describe, expect, it } from "vitest";
import {
  applyLatestDailyPointAmountToShops,
  buildLatestDailyPointWindowDateKeys,
  buildLatestDailyPointShopLookup,
  getLatestDailyPointAmountInfo,
  pickLatestDailyPointDateKey,
} from "@/lib/latest-daily-point-shops";

describe("pickLatestDailyPointDateKey", () => {
  it("返回最新日期", () => {
    expect(
      pickLatestDailyPointDateKey(["2026-03-05", "2026-03-07", "2026-03-06"])
    ).toBe("2026-03-07");
  });

  it("忽略空值和非法日期", () => {
    expect(
      pickLatestDailyPointDateKey(["", "invalid", "2026-03-01"])
    ).toBe("2026-03-01");
  });

  it("无有效日期时返回空字符串", () => {
    expect(pickLatestDailyPointDateKey(["", "invalid"])).toBe("");
  });
});

describe("buildLatestDailyPointWindowDateKeys", () => {
  it("基于最新抽点日向前覆盖近2日", () => {
    expect(buildLatestDailyPointWindowDateKeys("2026-03-07")).toEqual([
      "2026-03-07",
      "2026-03-06",
    ]);
  });

  it("无有效最新日期时返回空数组", () => {
    expect(buildLatestDailyPointWindowDateKeys("")).toEqual([]);
  });
});

describe("buildLatestDailyPointShopLookup", () => {
  it("同时支持商家ID、门店ID、店铺名匹配", () => {
    const lookup = buildLatestDailyPointShopLookup([
      {
        merchantId: "m-1",
        storeId: "s-1",
        shopName: "店铺A",
      },
    ]);

    expect(lookup.merchantIds.has("m-1")).toBe(true);
    expect(lookup.storeIds.has("s-1")).toBe(true);
    expect(lookup.shopNames.has("店铺A")).toBe(true);
  });

  it("按商家ID优先返回店铺最新回款金额和日期", () => {
    const lookup = buildLatestDailyPointShopLookup([
      {
        merchantId: "m-2",
        storeId: "s-2",
        shopName: "店铺B",
        recordDateKey: "2026-03-06",
        amountValue: 8,
      },
      {
        merchantId: "m-2",
        storeId: "s-2",
        shopName: "店铺B",
        recordDateKey: "2026-03-07",
        amountValue: 12.345,
      },
    ]);

    expect(
      getLatestDailyPointAmountInfo(lookup, {
        merchantId: "m-2",
        shopName: "店铺B",
      })
    ).toEqual({
      amount: 12.35,
      dateKey: "2026-03-07",
    });
  });

  it("商家ID未命中时按店铺名补充最新回款字段", () => {
    const lookup = buildLatestDailyPointShopLookup([
      {
        merchantId: "m-3",
        storeId: "s-3",
        shopName: "店铺C",
        recordDateKey: "2026-03-07",
        amountValue: 0,
      },
    ]);

    expect(
      applyLatestDailyPointAmountToShops(
        [{ _id: "shop-3", merchantId: "missing", shopName: "店铺C" }],
        lookup
      )
    ).toEqual([
      {
        _id: "shop-3",
        merchantId: "missing",
        shopName: "店铺C",
        latestDailyPointAmount: 0,
        latestDailyPointDateKey: "2026-03-07",
      },
    ]);
  });
});
