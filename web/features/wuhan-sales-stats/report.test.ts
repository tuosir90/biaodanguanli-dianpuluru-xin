import { describe, expect, it } from "vitest";
import { buildWuhanSalesStatsReport } from "./report";

describe("buildWuhanSalesStatsReport", () => {
  it("按天汇总武汉销售的抽点店铺数、回款金额和开单明细", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "武汉饿了么店B",
          merchantId: "e1",
          deliveryPlatform: "饿了么餐饮",
          salesName: "李帅",
          salesCity: "",
          contractSignedDate: "2026-03-02T00:00:00+08:00",
        },
        {
          _id: "s3",
          shopName: "宜昌店C",
          merchantId: "m9",
          deliveryPlatform: "美团餐饮",
          salesName: "王五",
          salesCity: "宜昌",
          contractSignedDate: "2026-03-02T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-03-01",
          amountValue: 12.5,
        },
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-03-01",
          amountValue: 7.5,
        },
        {
          platform: "eleme",
          merchantId: "e1",
          recordDateKey: "2026-03-02",
          amountValue: 20,
        },
        {
          platform: "meituan",
          merchantId: "m9",
          recordDateKey: "2026-03-02",
          amountValue: 99,
        },
      ],
    });

    expect(report.summary).toEqual({
      totalSignedShopCount: 2,
      totalDailyPointAmount: 40,
      totalSalesPersonCount: 2,
    });

    expect(report.dailyStats).toHaveLength(31);

    expect(report.dailyStats[0]).toEqual({
      date: "2026-03-01",
      dailyPointShopCount: 1,
      dailyPointAmountTotal: 20,
      meituanDailyPointShopCount: 1,
      meituanDailyPointAmountTotal: 20,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 1,
      signedShops: [
        {
          shopId: "m1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          salesName: "屈维涛",
          contractSignedDate: "2026-03-01",
        },
      ],
    });

    expect(report.dailyStats[1]).toEqual({
      date: "2026-03-02",
      dailyPointShopCount: 1,
      dailyPointAmountTotal: 20,
      meituanDailyPointShopCount: 0,
      meituanDailyPointAmountTotal: 0,
      elemeDailyPointShopCount: 1,
      elemeDailyPointAmountTotal: 20,
      signedShopCount: 1,
      signedShops: [
        {
          shopId: "e1",
          shopName: "武汉饿了么店B",
          merchantId: "e1",
          salesName: "李帅",
          contractSignedDate: "2026-03-02",
        },
      ],
    });
  });

  it("当商家ID为空时回退按店铺名匹配抽点明细，并补齐没有数据的日期", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉同名店",
          merchantId: "",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          shopName: "武汉同名店",
          recordDateKey: "2026-03-18",
          amountValue: 8.88,
        },
      ],
    });

    expect(report.dailyStats).toHaveLength(31);

    const targetDay = report.dailyStats.find((item) => item.date === "2026-03-18");
    expect(targetDay).toEqual({
      date: "2026-03-18",
      dailyPointShopCount: 1,
      dailyPointAmountTotal: 8.88,
      meituanDailyPointShopCount: 1,
      meituanDailyPointAmountTotal: 8.88,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });

    const emptyDay = report.dailyStats.find((item) => item.date === "2026-03-01");
    expect(emptyDay).toEqual({
      date: "2026-03-01",
      dailyPointShopCount: 0,
      dailyPointAmountTotal: 0,
      meituanDailyPointShopCount: 0,
      meituanDailyPointAmountTotal: 0,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });
  });

  it("不统计 2026-03-01 之前签约店铺的每日抽点数据", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "old-shop",
          shopName: "2月老店",
          merchantId: "old-1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-02-28T00:00:00+08:00",
        },
        {
          _id: "new-shop",
          shopName: "3月新店",
          merchantId: "new-1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-03T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "old-1",
          recordDateKey: "2026-03-05",
          amountValue: 88,
        },
        {
          platform: "meituan",
          merchantId: "new-1",
          recordDateKey: "2026-03-05",
          amountValue: 12,
        },
      ],
    });

    expect(report.summary).toEqual({
      totalSignedShopCount: 1,
      totalDailyPointAmount: 12,
      totalSalesPersonCount: 1,
    });

    expect(report.dailyStats).toHaveLength(31);
    expect(report.dailyStats[4]).toEqual({
      date: "2026-03-05",
      dailyPointShopCount: 1,
      dailyPointAmountTotal: 12,
      meituanDailyPointShopCount: 1,
      meituanDailyPointAmountTotal: 12,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });
  });

  it("月开单销售人数按销售姓名去重统计", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "店铺1",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "店铺2",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-11T00:00:00+08:00",
        },
        {
          _id: "s3",
          shopName: "店铺3",
          merchantId: "m3",
          deliveryPlatform: "饿了么餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          contractSignedDate: "2026-03-20T00:00:00+08:00",
        },
        {
          _id: "s4",
          shopName: "店铺4",
          merchantId: "m4",
          deliveryPlatform: "饿了么餐饮",
          salesName: "",
          salesCity: "武汉",
          contractSignedDate: "2026-03-21T00:00:00+08:00",
        },
      ],
      dailyDetails: [],
    });

    expect(report.dailyStats).toHaveLength(31);
    expect(report.summary.totalSignedShopCount).toBe(4);
    expect(report.summary.totalSalesPersonCount).toBe(2);
  });

  it("当数据源已有更新日期时，会补齐到当月最新抽点日期", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "月底新签店",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          contractSignedDate: "2026-03-30T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-03-28",
          amountValue: 18,
        },
      ],
      latestDailyPointDateKey: "2026-03-31",
    } as never);

    expect(report.dailyStats).toHaveLength(31);
    expect(report.dailyStats.find((item) => item.date === "2026-03-28")).toEqual({
      date: "2026-03-28",
      dailyPointShopCount: 1,
      dailyPointAmountTotal: 18,
      meituanDailyPointShopCount: 1,
      meituanDailyPointAmountTotal: 18,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });
    expect(report.dailyStats.at(-1)).toEqual({
      date: "2026-03-31",
      dailyPointShopCount: 0,
      dailyPointAmountTotal: 0,
      meituanDailyPointShopCount: 0,
      meituanDailyPointAmountTotal: 0,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });
  });

  it("即使月底没有抽点数据，也保留整个月的零值日期", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-03-28",
          amountValue: 18,
        },
      ],
    });

    expect(report.dailyStats).toHaveLength(31);
    expect(report.dailyStats.at(-1)).toEqual({
      date: "2026-03-31",
      dailyPointShopCount: 0,
      dailyPointAmountTotal: 0,
      meituanDailyPointShopCount: 0,
      meituanDailyPointAmountTotal: 0,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    });
  });

  it("每日开单店铺数优先按录入日期统计", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉延后录入店",
          merchantId: "m-delay",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-12T00:00:00+08:00",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
      ],
      dailyDetails: [],
    } as never);

    expect(report.dailyStats.find((item) => item.date === "2026-03-10")?.signedShopCount).toBe(0);
    expect(report.dailyStats.find((item) => item.date === "2026-03-12")?.signedShopCount).toBe(1);
  });

  it("每日回款明细按截至当月末的累计开单店铺统计", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-04",
      shops: [
        {
          _id: "march-shop",
          shopName: "3月店铺",
          merchantId: "m-march",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-10T00:00:00+08:00",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
        {
          _id: "april-shop",
          shopName: "4月店铺",
          merchantId: "m-april",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-04-03T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m-march",
          recordDateKey: "2026-04-05",
          amountValue: 100,
        },
        {
          platform: "meituan",
          merchantId: "m-april",
          recordDateKey: "2026-04-05",
          amountValue: 20,
        },
      ],
    } as never);

    expect(report.summary.totalSignedShopCount).toBe(1);
    expect(report.summary.totalDailyPointAmount).toBe(120);
    expect(report.dailyStats.find((item) => item.date === "2026-04-05")?.dailyPointAmountTotal).toBe(120);
    expect(report.dailyStats.find((item) => item.date === "2026-04-05")?.dailyPointShopCount).toBe(2);
  });

  it("美团每日回款按结算周期归属到业务日期", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-01T00:00:00+08:00",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-03-30",
          recordDate: "2026-03-30",
          amountValue: 12.34,
          rowData: {
            日期: "2026-03-30",
            结算周期: "2026-03-29~2026-03-29",
          },
        },
      ],
    } as never);

    expect(report.dailyStats.find((item) => item.date === "2026-03-29")?.dailyPointAmountTotal).toBe(12.34);
    expect(report.dailyStats.find((item) => item.date === "2026-03-29")?.meituanDailyPointAmountTotal).toBe(12.34);
    expect(report.dailyStats.find((item) => item.date === "2026-03-29")?.dailyPointShopCount).toBe(1);
    expect(report.dailyStats.find((item) => item.date === "2026-03-30")?.dailyPointAmountTotal).toBe(0);
  });

  it("美团跨月回款会归属到上月最后一天", () => {
    const report = buildWuhanSalesStatsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "武汉美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-01T00:00:00+08:00",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-04-01",
          recordDate: "2026-04-01",
          amountValue: 7.89,
          rowData: {
            日期: "2026-04-01",
            结算周期: "2026-03-31~2026-03-31",
          },
        },
      ],
    } as never);

    expect(report.dailyStats.find((item) => item.date === "2026-03-31")?.dailyPointAmountTotal).toBe(7.89);
    expect(report.dailyStats.find((item) => item.date === "2026-03-31")?.meituanDailyPointAmountTotal).toBe(7.89);
  });

  it("全部日期视图会展示从最早日期到最新日期的完整数据", () => {
    const report = buildWuhanSalesStatsReport({
      month: "all",
      shops: [
        {
          _id: "march-shop",
          shopName: "3月店铺",
          merchantId: "m-march",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-03-10T00:00:00+08:00",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
        {
          _id: "april-shop",
          shopName: "4月店铺",
          merchantId: "m-april",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-04-03T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m-march",
          recordDateKey: "2026-04-05",
          amountValue: 100,
        },
        {
          platform: "meituan",
          merchantId: "m-april",
          recordDateKey: "2026-04-05",
          amountValue: 20,
        },
      ],
      latestDailyPointDateKey: "2026-04-05",
    } as never);

    expect(report.dailyStats[0]?.date).toBe("2026-03-01");
    expect(report.dailyStats.at(-1)?.date).toBe("2026-04-05");
    expect(report.summary.totalSignedShopCount).toBe(2);
    expect(report.summary.totalDailyPointAmount).toBe(120);
    expect(report.dailyStats.find((item) => item.date === "2026-04-05")?.dailyPointShopCount).toBe(2);
  });
});
