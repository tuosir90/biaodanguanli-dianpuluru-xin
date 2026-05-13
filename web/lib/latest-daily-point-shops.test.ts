import { describe, expect, it } from "vitest";
import {
  buildLatestDailyPointWindowDateKeys,
  buildLatestDailyPointShopLookup,
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
});
