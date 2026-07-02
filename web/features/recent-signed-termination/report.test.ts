import { describe, expect, it } from "vitest";
import {
  buildRecentSignedTerminationReport,
  buildRecentSignedTerminationMonthRange,
} from "./report";

describe("buildRecentSignedTerminationMonthRange", () => {
  it("统计 6 月时签约范围覆盖 5 月和 6 月，解约范围只覆盖 6 月", () => {
    expect(buildRecentSignedTerminationMonthRange("2026-06")).toEqual({
      month: "2026-06",
      signedStart: new Date("2026-05-01T00:00:00+08:00"),
      signedEnd: new Date("2026-07-01T00:00:00+08:00"),
      terminationStart: new Date("2026-06-01T00:00:00+08:00"),
      terminationEnd: new Date("2026-07-01T00:00:00+08:00"),
      signedMonthRange: {
        startMonth: "2026-05",
        endMonth: "2026-06",
        startDate: "2026-05-01",
        endDate: "2026-06-30",
      },
      twoMonthSignedRange: {
        startMonth: "2026-05",
        endMonth: "2026-06",
        startDate: "2026-05-01",
        endDate: "2026-06-30",
      },
      twoMonthSignedStart: new Date("2026-05-01T00:00:00+08:00"),
      twoMonthSignedEnd: new Date("2026-07-01T00:00:00+08:00"),
      terminationDateRange: {
        startDate: "2026-06-01",
        endDate: "2026-06-30",
      },
    });
  });

  it("无效月份返回 null", () => {
    expect(buildRecentSignedTerminationMonthRange("2026/06")).toBeNull();
  });
});

describe("buildRecentSignedTerminationReport", () => {
  it("只统计本月或上月签约且本月解约的店铺，并按运营汇总", () => {
    const report = buildRecentSignedTerminationReport({
      month: "2026-06",
      shops: [
        {
          _id: "shop-1",
          shopName: "5月签约6月解约",
          merchantId: "1001",
          deliveryPlatform: "美团餐饮",
          operatorName: "张三",
          contractSignedDate: "2026-05-10T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-06-08T00:00:00+08:00",
          terminationCooperationDays: 29,
        },
        {
          _id: "shop-2",
          shopName: "6月签约6月解约",
          merchantId: "1002",
          deliveryPlatform: "饿了么餐饮",
          operatorName: "张三",
          contractSignedDate: "2026-06-03T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-06-20T00:00:00+08:00",
          terminationCooperationDays: 18,
        },
        {
          _id: "shop-3",
          shopName: "空运营",
          merchantId: "1003",
          deliveryPlatform: "美团餐饮",
          operatorName: "",
          contractSignedDate: "2026-05-15T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-06-12T00:00:00+08:00",
          terminationCooperationDays: 29,
        },
        {
          _id: "shop-4",
          shopName: "4月签约6月解约",
          merchantId: "1004",
          deliveryPlatform: "美团餐饮",
          operatorName: "李四",
          contractSignedDate: "2026-04-28T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-06-12T00:00:00+08:00",
          terminationCooperationDays: 46,
        },
        {
          _id: "shop-5",
          shopName: "5月签约7月解约",
          merchantId: "1005",
          deliveryPlatform: "美团餐饮",
          operatorName: "王五",
          contractSignedDate: "2026-05-15T00:00:00+08:00",
          shopStatus: "已解约",
          terminationDate: "2026-07-01T00:00:00+08:00",
          terminationCooperationDays: 48,
        },
        {
          _id: "shop-6",
          shopName: "6月签约未解约",
          merchantId: "1006",
          deliveryPlatform: "美团餐饮",
          operatorName: "赵六",
          contractSignedDate: "2026-06-15T00:00:00+08:00",
          shopStatus: "正常",
          terminationDate: null,
          terminationCooperationDays: null,
        },
        {
          _id: "shop-7",
          shopName: "4月签约正常店",
          merchantId: "1007",
          deliveryPlatform: "美团餐饮",
          operatorName: "李四",
          contractSignedDate: "2026-04-05T00:00:00+08:00",
          shopStatus: "正常",
          terminationDate: null,
          terminationCooperationDays: null,
        },
        {
          _id: "shop-8",
          shopName: "3月签约不计入两个月总数",
          merchantId: "1008",
          deliveryPlatform: "美团餐饮",
          operatorName: "李四",
          contractSignedDate: "2026-03-31T00:00:00+08:00",
          shopStatus: "正常",
          terminationDate: null,
          terminationCooperationDays: null,
        },
      ],
    });

    expect(report.totalTerminatedCount).toBe(3);
    expect(report.twoMonthSignedShopCount).toBe(5);
    expect(report.operatorCount).toBe(4);
    expect(report.operatorStats).toEqual([
      { operatorName: "张三", count: 2, twoMonthSignedShopCount: 2, terminationRate: 1 },
      { operatorName: "未分配", count: 1, twoMonthSignedShopCount: 1, terminationRate: 1 },
      { operatorName: "王五", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
      { operatorName: "赵六", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
    ]);
    expect(report.shops.map((shop) => shop.merchantId)).toEqual([
      "1002",
      "1003",
      "1001",
    ]);
  });
});
