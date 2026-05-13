import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WuhanSalesDailyStatsTable } from "@/components/wuhan-sales-daily-stats-table";
import { WUHAN_SALES_STATS_ALL_VALUE } from "@/features/wuhan-sales-stats/month";

describe("WuhanSalesDailyStatsTable", () => {
  it("显示每日回款明细标题，并移除每日开单店铺明细列表", () => {
    const html = renderToStaticMarkup(
      createElement(WuhanSalesDailyStatsTable, {
        month: "2026-03",
        dailyStats: [
          {
            date: "2026-03-01",
            dailyPointShopCount: 2,
            dailyPointAmountTotal: 12.5,
            meituanDailyPointShopCount: 1,
            meituanDailyPointAmountTotal: 8,
            elemeDailyPointShopCount: 1,
            elemeDailyPointAmountTotal: 4.5,
            signedShopCount: 1,
            signedShops: [
              {
                shopId: "m1",
                shopName: "测试店铺",
                merchantId: "123",
                salesName: "屈维涛",
                contractSignedDate: "2026-03-01",
              },
            ],
          },
        ],
      })
    );

    expect(html).toContain("每日回款明细");
    expect(html).toContain("店铺明细");
    expect(html).toContain("/daily-point/wuhan-sales-stats/shop-details?month=2026-03");
    expect(html).toContain("每日抽点店铺数");
    expect(html).toContain("每日总回款金额");
    expect(html).toContain("美团抽点店铺数");
    expect(html).toContain("美团总回款金额");
    expect(html).toContain("饿了么抽点店铺数");
    expect(html).toContain("饿了么总回款金额");
    expect(html).not.toContain("测试店铺");
  });

  it("全部日期模式下隐藏店铺明细链接", () => {
    const html = renderToStaticMarkup(
      createElement(WuhanSalesDailyStatsTable, {
        month: WUHAN_SALES_STATS_ALL_VALUE,
        dailyStats: [],
      })
    );

    expect(html).not.toContain("/daily-point/wuhan-sales-stats/shop-details");
    expect(html).not.toContain("店铺明细");
  });
});
