import { describe, expect, it } from "vitest";
import {
  buildDailyPointRelatedShopFilter,
  buildDailyPointTrends,
} from "./daily-point-trends";

describe("buildDailyPointRelatedShopFilter", () => {
  it("会同时收集商家ID、门店ID和店铺名用于查询关联店铺", () => {
    const result = buildDailyPointRelatedShopFilter([
      {
        merchantId: "m-1",
        storeId: "s-1",
        shopName: "店铺A",
      },
      {
        merchantId: "",
        storeId: "s-2",
        shopName: "店铺B",
      },
    ]);

    expect(result).toEqual({
      idValues: ["m-1", "s-1", "s-2"],
      shopNames: ["店铺A", "店铺B"],
      shopRelationFilter: [
        { merchantId: { $in: ["m-1", "s-1", "s-2"] } },
        { shopName: { $in: ["店铺A", "店铺B"] } },
      ],
    });
  });
});

describe("buildDailyPointTrends", () => {
  it("饿了么重复明细不会重复累计店铺数和金额", () => {
    const result = buildDailyPointTrends({
      details: [
        {
          platform: "eleme",
          recordDateKey: "2026-04-10",
          merchantId: "",
          storeId: "1327890541",
          shopName: "真真厨房（嘉华城店）",
          amountValue: 42.69,
        },
        {
          platform: "eleme",
          recordDateKey: "2026-04-10",
          merchantId: "",
          storeId: "1327890541",
          shopName: "真真厨房（嘉华城店）",
          amountValue: 42.69,
        },
      ],
      shops: [
        {
          merchantId: "1327890541",
          shopName: "真真厨房（嘉华城店）",
          operatorName: "张三",
        },
      ],
      month: "2026-04",
      start: new Date("2026-04-01T00:00:00+08:00"),
      end: new Date("2026-05-01T00:00:00+08:00"),
    });

    expect(result.shopCountTrend).toEqual([
      {
        name: "张三",
        values: expect.arrayContaining([{ date: "2026-04-10", value: 1 }]),
      },
    ]);
    expect(result.totalAmountTrend).toEqual([
      {
        name: "张三",
        values: expect.arrayContaining([{ date: "2026-04-10", value: 42.69 }]),
      },
    ]);
  });

  it("同店同日多笔不同金额明细会合并店铺数但累计金额", () => {
    const result = buildDailyPointTrends({
      details: [
        {
          platform: "meituan",
          recordDateKey: "2026-04-08",
          merchantId: "m-1",
          storeId: "m-1",
          shopName: "店铺A",
          amountValue: 10,
        },
        {
          platform: "meituan",
          recordDateKey: "2026-04-08",
          merchantId: "m-1",
          storeId: "m-1",
          shopName: "店铺A",
          amountValue: 20,
        },
      ],
      shops: [
        {
          merchantId: "m-1",
          shopName: "店铺A",
          operatorName: "李四",
        },
      ],
      month: "2026-04",
      start: new Date("2026-04-01T00:00:00+08:00"),
      end: new Date("2026-05-01T00:00:00+08:00"),
    });

    expect(result.shopCountTrend).toEqual([
      {
        name: "李四",
        values: expect.arrayContaining([{ date: "2026-04-08", value: 1 }]),
      },
    ]);
    expect(result.totalAmountTrend).toEqual([
      {
        name: "李四",
        values: expect.arrayContaining([{ date: "2026-04-08", value: 30 }]),
      },
    ]);
  });
});
