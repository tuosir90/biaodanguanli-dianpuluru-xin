import { describe, expect, it } from "vitest";
import { buildSalesInvalidShopsMonthRange } from "./month";

describe("buildSalesInvalidShopsMonthRange", () => {
  it("3 月范围必须稳定覆盖到 3 月 31 日，不受运行时时区影响", () => {
    const range = buildSalesInvalidShopsMonthRange("2026-03");

    expect(range).toEqual({
      queryStart: new Date(Date.UTC(2026, 1, 28, 0, 0, 0)),
      start: new Date(Date.UTC(2026, 2, 1, 0, 0, 0)),
      end: new Date(Date.UTC(2026, 3, 1, 0, 0, 0)),
      startDateKey: "2026-03-01",
      windowEndDateKey: "2026-04-14",
    });
  });

  it("无效月份返回 null", () => {
    expect(buildSalesInvalidShopsMonthRange("2026/03")).toBeNull();
  });
});
