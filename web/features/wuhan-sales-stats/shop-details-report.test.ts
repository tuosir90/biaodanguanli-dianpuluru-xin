import { describe, expect, it } from "vitest";
import { buildWuhanSalesShopDetailsReport } from "./shop-details-report";

describe("buildWuhanSalesShopDetailsReport", () => {
  it("按月汇总每个武汉销售店铺的总回款金额", () => {
    const report = buildWuhanSalesShopDetailsReport({
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
          shopName: "2月老店",
          merchantId: "old-1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          contractSignedDate: "2026-02-28T00:00:00+08:00",
        },
        {
          _id: "s4",
          shopName: "宜昌店",
          merchantId: "yc-1",
          deliveryPlatform: "美团餐饮",
          salesName: "王五",
          salesCity: "宜昌",
          contractSignedDate: "2026-03-05T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-03-01",
          amountValue: 10,
        },
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-03-05",
          amountValue: 12.5,
        },
        {
          platform: "eleme",
          merchantId: "e1",
          recordDateKey: "2026-03-02",
          amountValue: 8,
        },
        {
          platform: "eleme",
          merchantId: "e1",
          recordDateKey: "2026-03-20",
          amountValue: 5,
        },
        {
          platform: "meituan",
          merchantId: "old-1",
          recordDateKey: "2026-03-03",
          amountValue: 99,
        },
      ],
    });

    expect(report.summary).toEqual({
      totalShopCount: 2,
      totalAmount: 35.5,
    });

    expect(report.details).toEqual([
      {
        shopId: "m1",
        contractSignedDate: "2026-03-01",
        merchantId: "m1",
        shopName: "武汉美团店A",
        salesName: "屈维涛",
        totalAmount: 22.5,
      },
      {
        shopId: "e1",
        contractSignedDate: "2026-03-02",
        merchantId: "e1",
        shopName: "武汉饿了么店B",
        salesName: "李帅",
        totalAmount: 13,
      },
    ]);
  });

  it("当商家ID为空时回退按店铺名匹配，并保留零回款店铺", () => {
    const report = buildWuhanSalesShopDetailsReport({
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
        {
          _id: "s2",
          shopName: "零回款店",
          merchantId: "zero-1",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          contractSignedDate: "2026-03-11T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          shopName: "武汉同名店",
          recordDateKey: "2026-03-18",
          amountValue: 6.66,
        },
      ],
    });

    expect(report.details).toEqual([
      {
        shopId: "武汉同名店",
        contractSignedDate: "2026-03-10",
        merchantId: "",
        shopName: "武汉同名店",
        salesName: "屈维涛",
        totalAmount: 6.66,
      },
      {
        shopId: "zero-1",
        contractSignedDate: "2026-03-11",
        merchantId: "zero-1",
        shopName: "零回款店",
        salesName: "李帅",
        totalAmount: 0,
      },
    ]);
  });

  it("店铺明细按录入日期归属月份统计", () => {
    const report = buildWuhanSalesShopDetailsReport({
      month: "2026-04",
      shops: [
        {
          _id: "s1",
          shopName: "4月录入店",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-04-03T00:00:00+08:00",
          contractSignedDate: "2026-03-30T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "3月录入店",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-03-28T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          recordDateKey: "2026-04-10",
          amountValue: 11,
        },
        {
          platform: "meituan",
          merchantId: "m2",
          recordDateKey: "2026-04-10",
          amountValue: 99,
        },
      ],
    } as never);

    expect(report.summary).toEqual({
      totalShopCount: 1,
      totalAmount: 11,
    });
    expect(report.details).toEqual([
      {
        shopId: "m1",
        contractSignedDate: "2026-04-03",
        merchantId: "m1",
        shopName: "4月录入店",
        salesName: "屈维涛",
        totalAmount: 11,
      },
    ]);
  });

  it("美团跨月回款按结算周期归属到上月店铺明细", () => {
    const report = buildWuhanSalesShopDetailsReport({
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
          amountValue: 15.2,
          rowData: {
            日期: "2026-04-01",
            结算周期: "2026-03-31~2026-03-31",
          },
        },
      ],
    } as never);

    expect(report.summary).toEqual({
      totalShopCount: 1,
      totalAmount: 15.2,
    });
    expect(report.details).toEqual([
      {
        shopId: "m1",
        contractSignedDate: "2026-03-01",
        merchantId: "m1",
        shopName: "武汉美团店A",
        salesName: "屈维涛",
        totalAmount: 15.2,
      },
    ]);
  });
});
