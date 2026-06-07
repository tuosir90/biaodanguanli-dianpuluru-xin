import { describe, expect, it } from "vitest";
import { buildWorkflowShopFlowMetricsMap } from "./workflow-shop-flow-metrics";
import { statusKey } from "./utils";

describe("buildWorkflowShopFlowMetricsMap", () => {
  it("按当前按钮状态计算完成度，取消默认补全项后不会再自动算为已完成", () => {
    const metricsMap = buildWorkflowShopFlowMetricsMap(
      [
        {
          _id: "shop-1",
          deliveryPlatform: "美团餐饮",
          flowLockedProgressKeys: [],
        },
      ],
      {
        [statusKey("shop-1", "market_plan")]: true,
        [statusKey("shop-1", "image_wall")]: false,
      }
    );

    expect(metricsMap["shop-1"].completedCount).toBe(1);
    expect(metricsMap["shop-1"].remainingCount).toBe(
      metricsMap["shop-1"].totalProgressCount - 1
    );
  });
});
