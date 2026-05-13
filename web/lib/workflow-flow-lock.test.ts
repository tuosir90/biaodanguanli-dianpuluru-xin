import { describe, expect, it } from "vitest";
import {
  LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS,
  buildWorkflowFlowLockLookup,
} from "@/lib/workflow-flow-lock";

describe("buildWorkflowFlowLockLookup", () => {
  it("按签约次日起连续4天总回款低于1元时锁定全店图流程", () => {
    const lookup = buildWorkflowFlowLockLookup({
      shops: [
        {
          _id: "shop-1",
          merchantId: "m1",
          shopName: "低回款店铺",
          deliveryPlatform: "美团餐饮",
          contractSignedDate: "2026-04-01T00:00:00+08:00",
        },
      ],
      availableDateKeysByPlatform: {
        meituan: ["2026-04-10", "2026-04-05", "2026-04-04", "2026-04-03", "2026-04-02"],
      },
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-04-02",
          amountValue: 0.2,
        },
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-04-03",
          amountValue: 0.3,
        },
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-04-04",
          amountValue: 0.3,
        },
        {
          platform: "meituan",
          storeId: "m1",
          recordDateKey: "2026-04-10",
          amountValue: 99,
        },
      ],
    });

    expect(lookup["shop-1"]).toEqual(
      expect.objectContaining({
        lockedProgressKeys: LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS,
        totalAmount: 0.8,
        latestDateKey: "2026-04-10",
        windowDateKeys: [
          "2026-04-02",
          "2026-04-03",
          "2026-04-04",
          "2026-04-05",
        ],
      })
    );
  });

  it("按签约次日起连续4天总回款达到1元时不锁定全店图流程", () => {
    const lookup = buildWorkflowFlowLockLookup({
      shops: [
        {
          _id: "shop-1b",
          merchantId: "m1b",
          shopName: "刚好超过1元店铺",
          deliveryPlatform: "美团餐饮",
          contractSignedDate: "2026-04-01T00:00:00+08:00",
        },
      ],
      availableDateKeysByPlatform: {
        meituan: ["2026-04-10", "2026-04-05", "2026-04-04", "2026-04-03", "2026-04-02"],
      },
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m1b",
          recordDateKey: "2026-04-02",
          amountValue: 1.2,
        },
        {
          platform: "meituan",
          storeId: "m1b",
          recordDateKey: "2026-04-03",
          amountValue: 0.6,
        },
        {
          platform: "meituan",
          storeId: "m1b",
          recordDateKey: "2026-04-04",
          amountValue: 0.4,
        },
      ],
    });

    expect(lookup["shop-1b"]).toBeUndefined();
  });

  it("平台最新日期未覆盖到签约次日起第4天时不锁定全店图流程", () => {
    const lookup = buildWorkflowFlowLockLookup({
      shops: [
        {
          _id: "shop-2",
          merchantId: "m2",
          shopName: "日期不完整店铺",
          deliveryPlatform: "美团餐饮",
          contractSignedDate: "2026-04-05T00:00:00+08:00",
        },
      ],
      availableDateKeysByPlatform: {
        meituan: ["2026-04-08", "2026-04-07", "2026-04-06"],
      },
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m2",
          recordDateKey: "2026-04-06",
          amountValue: 0.5,
        },
      ],
    });

    expect(lookup["shop-2"]).toBeUndefined();
  });

  it("当商家ID未命中时回退按店铺名统计近4天总回款", () => {
    const lookup = buildWorkflowFlowLockLookup({
      shops: [
        {
          _id: "shop-3",
          shopName: "店名回退匹配店铺",
          deliveryPlatform: "饿了么餐饮",
          contractSignedDate: "2026-04-01T00:00:00+08:00",
        },
      ],
      availableDateKeysByPlatform: {
        eleme: ["2026-04-05", "2026-04-04", "2026-04-03", "2026-04-02"],
      },
      dailyDetails: [
        {
          platform: "eleme",
          shopName: "店名回退匹配店铺",
          recordDateKey: "2026-04-02",
          amountValue: 1,
        },
        {
          platform: "eleme",
          shopName: "店名回退匹配店铺",
          recordDateKey: "2026-04-03",
          amountValue: 2.2,
        },
      ],
    });

    expect(lookup["shop-3"]).toBeUndefined();
  });
});
