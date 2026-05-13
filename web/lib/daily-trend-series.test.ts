import { describe, expect, it } from "vitest";
import { buildDailyCountTrendSeries } from "@/lib/daily-trend-series";

describe("buildDailyCountTrendSeries", () => {
  it("会补齐缺失日期并默认填 0", () => {
    const result = buildDailyCountTrendSeries(
      "美团",
      ["2026-03-01", "2026-03-02", "2026-03-03"],
      [
        { date: "2026-03-01", count: 2 },
        { date: "2026-03-03", count: 5 },
      ]
    );

    expect(result).toEqual([
      {
        name: "美团",
        values: [
          { date: "2026-03-01", value: 2 },
          { date: "2026-03-02", value: 0 },
          { date: "2026-03-03", value: 5 },
        ],
      },
    ]);
  });

  it("遇到非法数量时按 0 处理", () => {
    const result = buildDailyCountTrendSeries(
      "饿了么",
      ["2026-03-01"],
      [{ date: "2026-03-01", count: Number.NaN }]
    );

    expect(result[0]?.values[0]?.value).toBe(0);
  });
});
