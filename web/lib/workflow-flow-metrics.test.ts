import { describe, expect, it } from "vitest";
import {
  getWorkflowEffectiveCompletedKeys,
  getWorkflowFlowMetrics,
  getWorkflowFlowProgressKeys,
} from "@/lib/workflow-flow-metrics";
import { LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS } from "@/lib/workflow-flow-lock";

describe("getWorkflowFlowMetrics", () => {
  it("自动把普通美团店铺的图片墙计为已完成", () => {
    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: ["market_plan"],
      loggedKeys: ["market_plan"],
    });

    expect(metrics.completedCount).toBe(2);
    expect(metrics.remainingCount).toBe(metrics.totalProgressCount - 2);
  });

  it("新店不会自动完成图片墙", () => {
    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "美团餐饮",
      shopStatus: "新店",
      completedKeys: ["market_plan"],
      loggedKeys: ["market_plan"],
    });

    expect(metrics.completedCount).toBe(1);
    expect(metrics.remainingCount).toBe(metrics.totalProgressCount - 1);
  });

  it("美团店铺不包含橱窗展示流程", () => {
    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: [],
      loggedKeys: [],
    });

    expect(metrics.totalProgressCount).toBe(24);
  });

  it("饿了么店铺包含视频店招并排除其他隐藏流程项", () => {
    const flowKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: [],
      loggedKeys: [],
    });

    expect(flowKeys).toContain("video_sign");
    expect(flowKeys).not.toContain("image_wall");
    expect(flowKeys).not.toContain("mt_detail");
    expect(flowKeys).not.toContain("brand_story");
    expect(metrics.totalProgressCount).toBe(22);
    expect(metrics.remainingCount).toBe(22);
  });

  it("所有平台都在菜品描述撰写后追加菜品描述全部上线流程", () => {
    const meituanKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");

    expect(meituanKeys[meituanKeys.indexOf("dish_desc") + 1]).toBe(
      "dish_desc_online"
    );
    expect(elemeKeys[elemeKeys.indexOf("dish_desc") + 1]).toBe(
      "dish_desc_online"
    );
  });

  it("历史已完成店铺会默认补标菜品描述全部上线", () => {
    const flowKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const completedBeforeNewStep = flowKeys.filter(
      (key) => key !== "dish_desc_online"
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: completedBeforeNewStep,
      loggedKeys: completedBeforeNewStep,
    });

    expect(completedSet.has("dish_desc_online")).toBe(true);
  });

  it("流程剩余5个以内的店铺会默认补标菜品描述全部上线", () => {
    const flowKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const completedKeys = flowKeys.filter(
      (key) =>
        ![
          "dish_desc_online",
          "review_appeal",
          "coupon_marketing",
          "weekly_report",
          "paid_tuning",
        ].includes(key)
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys,
      loggedKeys: completedKeys,
    });

    expect(completedSet.has("dish_desc_online")).toBe(true);
  });

  it("流程剩余超过5个的未完成店铺不会默认补标菜品描述全部上线", () => {
    const flowKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const completedKeys = flowKeys.filter(
      (key) =>
        ![
          "dish_desc_online",
          "review_appeal",
          "brand_story",
          "coupon_marketing",
          "weekly_report",
          "store_score",
          "new_product",
          "paid_tuning",
        ].includes(key)
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys,
      loggedKeys: completedKeys,
    });

    expect(completedSet.has("dish_desc_online")).toBe(false);
  });

  it("美团历史完成店铺缺少新标签时仍会默认补标开启新店特权", () => {
    const meituanKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const completedKeys = meituanKeys.filter(
      (key) => !["new_store_privilege", "dish_desc_online"].includes(key)
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys,
      loggedKeys: completedKeys,
    });

    expect(completedSet.has("dish_desc_online")).toBe(true);
    expect(completedSet.has("new_store_privilege")).toBe(true);
  });

  it("饿了么历史完成店铺缺少新标签时仍会默认补标新店特权、视频店招、橱窗展示和店铺分解析", () => {
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const defaultKeys = [
      "new_store_privilege",
      "video_sign",
      "window_display",
      "store_score",
      "dish_desc_online",
    ];
    const completedKeys = elemeKeys.filter((key) => !defaultKeys.includes(key));

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys,
      loggedKeys: completedKeys,
    });

    defaultKeys.forEach((key) => {
      expect(completedSet.has(key)).toBe(true);
    });
  });

  it("饿了么已完成店铺会默认补标视频店招、橱窗展示和店铺分解析", () => {
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const baselineKeys = elemeKeys.filter(
      (key) =>
        !["video_sign", "window_display", "store_score", "new_store_privilege"].includes(key)
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: baselineKeys,
      loggedKeys: baselineKeys,
    });

    expect(completedSet.has("video_sign")).toBe(true);
    expect(completedSet.has("window_display")).toBe(true);
    expect(completedSet.has("store_score")).toBe(true);
    expect(completedSet.has("new_store_privilege")).toBe(true);
  });

  it("饿了么未完成店铺不会默认补标视频店招、橱窗展示和店铺分解析", () => {
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const baselineKeys = elemeKeys
      .filter(
        (key) =>
          !["video_sign", "window_display", "store_score", "new_store_privilege"].includes(key)
      )
      .slice(0, -1);

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: baselineKeys,
      loggedKeys: baselineKeys,
    });

    expect(completedSet.has("video_sign")).toBe(false);
    expect(completedSet.has("window_display")).toBe(false);
    expect(completedSet.has("store_score")).toBe(false);
    expect(completedSet.has("new_store_privilege")).toBe(false);
  });

  it("历史已完成的美团店铺会默认补标开启新店特权", () => {
    const meituanKeys = getWorkflowFlowProgressKeys("美团餐饮");
    const baselineKeys = meituanKeys.filter(
      (key) => key !== "new_store_privilege"
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: baselineKeys,
      loggedKeys: baselineKeys,
    });

    expect(completedSet.has("new_store_privilege")).toBe(true);
  });

  it("美团完整流程包含5个菜品图", () => {
    const requiredKeys = getWorkflowFlowProgressKeys("美团餐饮");

    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: requiredKeys,
      loggedKeys: requiredKeys,
    });

    expect(metrics.totalProgressCount).toBe(24);
    expect(metrics.completedCount).toBe(24);
    expect(metrics.remainingCount).toBe(0);
  });

  it("低回款锁定后会把5个菜品图从完整流程中排除", () => {
    const lockedKeySet = new Set<string>(
      LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS
    );
    const requiredKeys = getWorkflowFlowProgressKeys("美团餐饮").filter(
      (key) => !lockedKeySet.has(key)
    );

    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "美团餐饮",
      shopStatus: "正常",
      completedKeys: requiredKeys,
      loggedKeys: requiredKeys,
      lockedProgressKeys: LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS,
    });

    expect(metrics.totalProgressCount).toBe(19);
    expect(metrics.completedCount).toBe(19);
    expect(metrics.remainingCount).toBe(0);
  });
});
