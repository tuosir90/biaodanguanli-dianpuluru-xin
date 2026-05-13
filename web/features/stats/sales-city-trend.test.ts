import { describe, expect, it } from "vitest";
import { buildSalesCityShopTrend } from "@/features/stats/sales-city-trend";

describe("buildSalesCityShopTrend", () => {
  it("固定输出武汉和宜昌两组开单数", () => {
    const result = buildSalesCityShopTrend([
      { name: "宜昌", count: 8 },
      { name: "武汉", count: 2 },
    ]);

    expect(result).toEqual([
      { name: "武汉", count: 2 },
      { name: "宜昌", count: 8 },
    ]);
  });

  it("缺失城市时补0，并忽略未分配等其他分组", () => {
    const result = buildSalesCityShopTrend([
      { name: "宜昌", count: 5 },
      { name: "未分配", count: 3 },
    ]);

    expect(result).toEqual([
      { name: "武汉", count: 0 },
      { name: "宜昌", count: 5 },
    ]);
  });
});
