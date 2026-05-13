import { describe, expect, it } from "vitest";
import { normalizeOnlineShopCountUploadPayload } from "./payload";

describe("normalizeOnlineShopCountUploadPayload", () => {
  it("会补齐默认日期、来源和采集键", () => {
    const now = new Date("2026-04-24T01:30:00.000Z");

    const payload = normalizeOnlineShopCountUploadPayload(
      {
        records: [
          {
            platform: "meituan",
            count: 925,
            summaryText: "符合检索条件的数量：925",
          },
        ],
      },
      now
    );

    expect(payload.statDateKey).toBe("2026-04-24");
    expect(payload.captureSource).toBe("online-shop-crawler");
    expect(payload.records[0]).toMatchObject({
      platform: "meituan",
      count: 925,
      summaryText: "符合检索条件的数量：925",
    });
    expect(payload.records[0].captureKey).toContain("meituan:2026-04-24:");
  });

  it("会保留调用方传入的 statDate、capturedAt 和 captureKey", () => {
    const payload = normalizeOnlineShopCountUploadPayload({
      statDate: "2026-04-23",
      capturedAt: "2026-04-24T09:30:00+08:00",
      source: "manual-check",
      records: [
        {
          platform: "eleme",
          count: 353,
          captureKey: "eleme-2026-04-23-093000",
        },
      ],
    });

    expect(payload.statDateKey).toBe("2026-04-23");
    expect(payload.captureSource).toBe("manual-check");
    expect(payload.capturedAt.toISOString()).toBe("2026-04-24T01:30:00.000Z");
    expect(payload.records[0].captureKey).toBe("eleme-2026-04-23-093000");
  });

  it("会拒绝非法平台", () => {
    expect(() =>
      normalizeOnlineShopCountUploadPayload({
        records: [{ platform: "douyin", count: 1 }],
      })
    ).toThrow("records.platform 参数无效");
  });

  it("会拒绝非法数量", () => {
    expect(() =>
      normalizeOnlineShopCountUploadPayload({
        records: [{ platform: "meituan", count: -1 }],
      })
    ).toThrow("records.count 必须为大于等于 0 的整数");
  });

  it("会拒绝空记录列表", () => {
    expect(() =>
      normalizeOnlineShopCountUploadPayload({
        records: [],
      })
    ).toThrow("records 至少需要 1 条");
  });
});
