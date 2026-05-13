import { describe, expect, it } from "vitest";
import {
  WUHAN_SALES_STATS_ALL_VALUE,
  buildWuhanSalesStatsDateKeys,
  WUHAN_SALES_STATS_MIN_MONTH,
  buildWuhanSalesStatsMonthRange,
  isWuhanSalesStatsAllValue,
  normalizeWuhanSalesStatsMonth,
  shiftWuhanSalesStatsDateKey,
} from "./month";

describe("normalizeWuhanSalesStatsMonth", () => {
  it("把早于起始月份的值统一归一到 2026-03", () => {
    expect(normalizeWuhanSalesStatsMonth("2026-02")).toBe("2026-03");
    expect(normalizeWuhanSalesStatsMonth("2025-12")).toBe("2026-03");
  });

  it("保留 2026-03 及之后的月份", () => {
    expect(normalizeWuhanSalesStatsMonth("2026-03")).toBe("2026-03");
    expect(normalizeWuhanSalesStatsMonth("2026-04")).toBe("2026-04");
  });

  it("无效值回退到起始月份", () => {
    expect(normalizeWuhanSalesStatsMonth("")).toBe(WUHAN_SALES_STATS_MIN_MONTH);
    expect(normalizeWuhanSalesStatsMonth("2026/03")).toBe(WUHAN_SALES_STATS_MIN_MONTH);
  });

  it("保留全部日期视图值", () => {
    expect(normalizeWuhanSalesStatsMonth("all")).toBe(WUHAN_SALES_STATS_ALL_VALUE);
    expect(isWuhanSalesStatsAllValue("all")).toBe(true);
  });
});

describe("buildWuhanSalesStatsMonthRange", () => {
  it("3 月的结束日期必须稳定落在 3 月 31 日，不受运行时时区影响", () => {
    const range = buildWuhanSalesStatsMonthRange("2026-03");

    expect(range).toEqual({
      start: new Date(Date.UTC(2026, 2, 1, 0, 0, 0)),
      end: new Date(Date.UTC(2026, 3, 1, 0, 0, 0)),
      startDateKey: "2026-03-01",
      endDateKey: "2026-03-31",
    });
  });

  it("4 月的结束日期正确落在 4 月 30 日", () => {
    const range = buildWuhanSalesStatsMonthRange("2026-04");

    expect(range?.endDateKey).toBe("2026-04-30");
  });

  it("可以稳定把月底日期向后顺延一天", () => {
    expect(shiftWuhanSalesStatsDateKey("2026-03-31", 1)).toBe("2026-04-01");
    expect(shiftWuhanSalesStatsDateKey("2026-04-30", 1)).toBe("2026-05-01");
  });

  it("可以按起止日期生成完整日期序列", () => {
    expect(buildWuhanSalesStatsDateKeys("2026-03-30", "2026-04-02")).toEqual([
      "2026-03-30",
      "2026-03-31",
      "2026-04-01",
      "2026-04-02",
    ]);
  });
});
