import { describe, expect, it } from "vitest";
import {
  buildSalesInvalidShopsReport,
  filterSalesInvalidShopsBySignedMonth,
} from "./report";

describe("buildSalesInvalidShopsReport", () => {
  it("按上海时区的合同签订日期归属月份筛选店铺", () => {
    const shops = filterSalesInvalidShopsBySignedMonth("2026-04", [
      {
        _id: "s1",
        shopName: "四月一号店铺",
        merchantId: "m1",
        contractSignedDate: "2026-03-31T16:00:00.000Z",
      },
      {
        _id: "s2",
        shopName: "五月一号店铺",
        merchantId: "m2",
        contractSignedDate: "2026-04-30T16:00:00.000Z",
      },
      {
        _id: "s3",
        shopName: "四月中旬店铺",
        merchantId: "m3",
        contractSignedDate: "2026-04-15T00:00:00.000Z",
      },
    ]);

    expect(shops.map((shop) => shop.shopName)).toEqual([
      "四月一号店铺",
      "四月中旬店铺",
    ]);
  });

  it("按签约月份统计每个销售的无效店铺数，并输出无效店铺明细", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "美团店A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "美团店B",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营B",
          contractSignedDate: "2026-03-02T00:00:00+08:00",
        },
        {
          _id: "s3",
          shopName: "饿了么店C",
          merchantId: "e1",
          deliveryPlatform: "饿了么餐饮",
          city: "长沙",
          salesName: "李四",
          operatorName: "运营C",
          contractSignedDate: "2026-03-03T00:00:00+08:00",
        },
        {
          _id: "s4",
          shopName: "美团店D",
          merchantId: "m3",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "王六",
          operatorName: "运营D",
          contractSignedDate: "2026-03-05T00:00:00+08:00",
        },
        {
          _id: "s5",
          shopName: "美团店E",
          merchantId: "m4",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "赵七",
          operatorName: "运营E",
          contractSignedDate: "2026-03-06T00:00:00+08:00",
        },
        {
          _id: "s6",
          shopName: "历史店铺",
          merchantId: "old1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "王五",
          operatorName: "运营D",
          contractSignedDate: "2026-02-28T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-01", amountValue: 4 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-03", amountValue: 5 },
        { platform: "meituan", storeId: "m2", recordDateKey: "2026-03-02", amountValue: 6 },
        { platform: "meituan", storeId: "m2", recordDateKey: "2026-03-08", amountValue: 4 },
        { platform: "meituan", storeId: "m3", recordDateKey: "2026-03-05", amountValue: 12 },
        { platform: "meituan", storeId: "m4", recordDateKey: "2026-03-06", amountValue: 3 },
        { platform: "meituan", storeId: "old1", recordDateKey: "2026-03-01", amountValue: 1 },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    expect(report.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salesName: "李四",
          totalSignedShopCount: 1,
          invalidShopCount: 1,
        }),
        expect.objectContaining({
          salesName: "张三",
          totalSignedShopCount: 2,
          invalidShopCount: 0,
        }),
        expect.objectContaining({
          salesName: "王六",
          totalSignedShopCount: 1,
          invalidShopCount: 0,
        }),
        expect.objectContaining({
          salesName: "赵七",
          totalSignedShopCount: 1,
          invalidShopCount: 0,
        }),
      ])
    );

    expect(report.summary).toHaveLength(4);

    expect(report.invalidDetails).toEqual(
      [
        expect.objectContaining({
          shopId: "e1",
          shopName: "饿了么店C",
          salesName: "李四",
          windowStartDate: "2026-03-03",
          windowEndDate: "2026-03-17",
          windowTotalAmount: 0,
          matchStrategy: "未匹配到抽点明细",
        }),
      ]
    );
  });

  it("连续15天窗口从签约日开始按自然日累计，并支持跨月统计", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "跨月店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-28T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-28", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-29", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-30", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-03-31", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-01", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-02", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-03", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-04", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-05", amountValue: 1 },
        { platform: "meituan", storeId: "m1", recordDateKey: "2026-04-06", amountValue: 100 },
      ],
    });

    expect(report.invalidDetails).toEqual([]);
  });

  it("优先按商家ID或门店ID匹配，匹配不到再按店铺名", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "同名店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "只匹配店名",
          merchantId: "",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "李四",
          operatorName: "运营B",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        { platform: "meituan", merchantId: "m1", shopName: "别名", recordDateKey: "2026-03-10", amountValue: 4 },
        { platform: "meituan", shopName: "同名店铺", recordDateKey: "2026-03-11", amountValue: 30 },
        { platform: "meituan", shopName: "只匹配店名", recordDateKey: "2026-03-10", amountValue: 3 },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    expect(report.invalidDetails).toEqual([]);
  });

  it("连续15天回款总额必须等于0才算无效店铺", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "零回款店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "有微小回款店铺",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "李四",
          operatorName: "运营B",
          contractSignedDate: "2026-03-10T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m2",
          recordDateKey: "2026-03-10",
          amountValue: 0.01,
        },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    expect(report.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salesName: "张三",
          totalSignedShopCount: 1,
          invalidShopCount: 1,
        }),
        expect.objectContaining({
          salesName: "李四",
          totalSignedShopCount: 1,
          invalidShopCount: 0,
        }),
      ])
    );

    expect(report.invalidDetails).toEqual([
      expect.objectContaining({
        shopId: "m1",
        shopName: "零回款店铺",
        windowTotalAmount: 0,
      }),
    ]);
  });

  it("额外统计3天内解约店铺，并与无效店铺去重后输出最终汇总", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "仅无效店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "仅3天内解约店铺",
          merchantId: "m2",
          deliveryPlatform: "饿了么餐饮",
          city: "宜昌",
          salesName: "张三",
          operatorName: "运营B",
          contractSignedDate: "2026-03-05T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-03-07T00:00:00+08:00",
          terminationCooperationDays: 3,
        },
        {
          _id: "s3",
          shopName: "4天解约但仍是无效店铺",
          merchantId: "m3",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "李四",
          operatorName: "运营C",
          contractSignedDate: "2026-03-06T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-03-10T00:00:00+08:00",
          terminationCooperationDays: 4,
        },
        {
          _id: "s4",
          shopName: "正常店铺",
          merchantId: "m4",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "王五",
          operatorName: "运营D",
          contractSignedDate: "2026-03-08T00:00:00+08:00",
          shopStatus: "正常",
        },
      ],
      dailyDetails: [
        { platform: "meituan", storeId: "m4", recordDateKey: "2026-03-08", amountValue: 10 },
        { platform: "meituan", storeId: "m4", recordDateKey: "2026-03-09", amountValue: 20 },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    const extendedReport = report as unknown as {
      summary: Array<{
        salesName: string;
        totalSignedShopCount: number;
        invalidShopCount: number;
        terminatedWithinDaysCount: number;
        finalShopCount: number;
      }>;
      terminatedWithinDaysDetails: Array<{
        shopId: string;
        shopName: string;
        salesName: string;
        terminationDate: string;
        terminationCooperationDays: number;
      }>;
      finalDetails: Array<{
        shopId: string;
        shopName: string;
        salesName: string;
        resultType: string;
        reasonText: string;
      }>;
    };

    expect(extendedReport.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salesName: "张三",
          totalSignedShopCount: 2,
          invalidShopCount: 2,
          terminatedWithinDaysCount: 1,
          finalShopCount: 2,
        }),
        expect.objectContaining({
          salesName: "李四",
          totalSignedShopCount: 1,
          invalidShopCount: 1,
          terminatedWithinDaysCount: 0,
          finalShopCount: 1,
        }),
        expect.objectContaining({
          salesName: "王五",
          totalSignedShopCount: 1,
          invalidShopCount: 0,
          terminatedWithinDaysCount: 0,
          finalShopCount: 0,
        }),
      ])
    );

    expect(extendedReport.terminatedWithinDaysDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          shopId: "m2",
          shopName: "仅3天内解约店铺",
          salesName: "张三",
          terminationDate: "2026-03-07",
          terminationCooperationDays: 3,
        }),
      ])
    );

    expect(extendedReport.finalDetails).toHaveLength(3);
    expect(extendedReport.finalDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          shopId: "m1",
          shopName: "仅无效店铺",
          salesName: "张三",
          resultType: "final",
          reasonText: "无效店铺",
        }),
        expect.objectContaining({
          shopId: "m2",
          shopName: "仅3天内解约店铺",
          salesName: "张三",
          resultType: "final",
          reasonText: "无效店铺 + 3天内解约",
        }),
        expect.objectContaining({
          shopId: "m3",
          shopName: "4天解约但仍是无效店铺",
          salesName: "李四",
          resultType: "final",
          reasonText: "无效店铺",
        }),
      ])
    );
  });

  it("签约未满15天时，不提前判定为无效店铺", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "陈韵涵店铺A",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "宜昌",
          salesName: "陈韵涵",
          operatorName: "运营A",
          contractSignedDate: "2026-03-31T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "陈韵涵店铺B",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          city: "宜昌",
          salesName: "陈韵涵",
          operatorName: "运营B",
          contractSignedDate: "2026-03-31T00:00:00+08:00",
        },
      ],
      dailyDetails: [],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    } as never);

    expect(report.invalidDetails).toEqual([]);
    expect(report.finalDetails).toEqual([]);
    expect(report.summary).toEqual([
      {
        salesName: "陈韵涵",
        totalSignedShopCount: 2,
        invalidShopCount: 0,
        terminatedWithinDaysCount: 0,
        finalShopCount: 0,
      },
    ]);
  });
});
