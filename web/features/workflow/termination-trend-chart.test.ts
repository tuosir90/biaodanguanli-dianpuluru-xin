import { describe, expect, it } from "vitest";
import { buildWorkflowTerminationTrendChartData } from "./termination-trend-chart";

describe("buildWorkflowTerminationTrendChartData", () => {
  it("flattens workflow trend series for Ant Design Charts", () => {
    const data = buildWorkflowTerminationTrendChartData([
      {
        name: "王涛",
        values: [
          { date: "2026-04-01", value: 2 },
          { date: "2026-04-02", value: 0 },
        ],
      },
      {
        name: "",
        values: [{ date: "2026-04-01", value: 1 }],
      },
    ]);

    expect(data).toEqual([
      { date: "2026-04-01", operatorName: "王涛", terminatedShopCount: 2 },
      { date: "2026-04-02", operatorName: "王涛", terminatedShopCount: 0 },
      { date: "2026-04-01", operatorName: "未分配", terminatedShopCount: 1 },
    ]);
  });

  it("marks empty chart data when every point is zero", () => {
    const data = buildWorkflowTerminationTrendChartData([
      {
        name: "王涛",
        values: [{ date: "2026-04-01", value: 0 }],
      },
    ]);

    expect(data.some((item) => item.terminatedShopCount > 0)).toBe(false);
  });
});
