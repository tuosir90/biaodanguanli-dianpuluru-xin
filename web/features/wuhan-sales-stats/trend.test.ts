import { describe, expect, it } from "vitest";
import { buildWuhanSalesTrendSeries } from "./trend";

describe("buildWuhanSalesTrendSeries", () => {
  it("把每日明细转换成抽点店铺数和回款金额两组折线数据", () => {
    const series = buildWuhanSalesTrendSeries([
      {
        date: "2026-03-01",
        dailyPointShopCount: 2,
        dailyPointAmountTotal: 18.5,
        signedShopCount: 1,
        signedShops: [],
      },
      {
        date: "2026-03-02",
        dailyPointShopCount: 0,
        dailyPointAmountTotal: 0,
        signedShopCount: 2,
        signedShops: [],
      },
    ]);

    expect(series.dailyPointShopSeries).toEqual([
      {
        name: "每日抽点店铺数",
        values: [
          { date: "2026-03-01", value: 2 },
          { date: "2026-03-02", value: 0 },
        ],
      },
    ]);

    expect(series.dailyPointAmountSeries).toEqual([
      {
        name: "每日总回款金额",
        values: [
          { date: "2026-03-01", value: 18.5 },
          { date: "2026-03-02", value: 0 },
        ],
      },
    ]);
  });
});
