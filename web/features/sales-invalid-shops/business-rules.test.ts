import { describe, expect, it } from "vitest";
import { buildSalesInvalidShopsReport } from "./report";

describe("sales invalid shops business rules", () => {
  it("按15天零回款口径识别无效店铺", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "第十五天有回款",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          city: "武汉",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-03-15",
          amountValue: 8,
        },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    expect(report.invalidDetails).toEqual([]);
    expect(report.summary).toEqual([
      {
        salesName: "张三",
        totalSignedShopCount: 1,
        invalidShopCount: 0,
        terminatedWithinDaysCount: 0,
        finalShopCount: 0,
      },
    ]);
  });

  it("仅统计3天内解约店铺，并在最终汇总中按新口径去重", () => {
    const report = buildSalesInvalidShopsReport({
      month: "2026-03",
      shops: [
        {
          _id: "s1",
          shopName: "仅3天内解约店铺",
          merchantId: "m1",
          deliveryPlatform: "饿了么餐饮",
          city: "宜昌",
          salesName: "张三",
          operatorName: "运营A",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-03-03T00:00:00+08:00",
          terminationCooperationDays: 3,
        },
        {
          _id: "s2",
          shopName: "4天解约不再计入",
          merchantId: "m2",
          deliveryPlatform: "饿了么餐饮",
          city: "宜昌",
          salesName: "张三",
          operatorName: "运营B",
          contractSignedDate: "2026-03-05T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-03-08T00:00:00+08:00",
          terminationCooperationDays: 4,
        },
      ],
      dailyDetails: [
        {
          platform: "eleme",
          storeId: "m1",
          recordDateKey: "2026-03-02",
          amountValue: 5,
        },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-03-31",
        eleme: "2026-03-31",
      },
    });

    expect(report.terminatedWithinDaysDetails).toEqual([
      expect.objectContaining({
        shopId: "m1",
        shopName: "仅3天内解约店铺",
        salesName: "张三",
        terminationCooperationDays: 3,
        reasonText: "3天内解约",
      }),
    ]);

    expect(report.finalDetails).toEqual(
      expect.arrayContaining([
      expect.objectContaining({
        shopId: "m1",
        shopName: "仅3天内解约店铺",
        salesName: "张三",
        reasonText: "3天内解约",
      }),
      ])
    );

    expect(report.summary).toEqual([
      {
        salesName: "张三",
        totalSignedShopCount: 2,
        invalidShopCount: 1,
        terminatedWithinDaysCount: 1,
        finalShopCount: 2,
      },
    ]);
  });
});
