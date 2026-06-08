import { describe, expect, it } from "vitest";
import { buildWorkflowShopCountByOperatorPipeline } from "./summary-shop-count";

describe("buildWorkflowShopCountByOperatorPipeline", () => {
  it("uses contractSignedDate as the date range for operator shop counts", () => {
    const start = new Date("2026-03-01T00:00:00.000Z");
    const end = new Date("2026-04-01T00:00:00.000Z");

    const pipeline = buildWorkflowShopCountByOperatorPipeline(start, end);

    expect(pipeline[0]).toEqual({
      $match: {
        contractSignedDate: { $gte: start, $lt: end },
      },
    });
    expect(JSON.stringify(pipeline)).not.toContain("entryDate");
  });
});
