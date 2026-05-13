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

    expect(metrics.totalProgressCount).toBe(23);
  });

  it("饿了么店铺会排除隐藏流程项", () => {
    const metrics = getWorkflowFlowMetrics({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: [],
      loggedKeys: [],
    });

    expect(metrics.totalProgressCount).toBe(20);
    expect(metrics.remainingCount).toBe(20);
  });

  it("饿了么已完成店铺会默认补标橱窗展示和店铺分解析", () => {
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const baselineKeys = elemeKeys.filter(
      (key) => !["window_display", "store_score", "new_store_privilege"].includes(key)
    );

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: baselineKeys,
      loggedKeys: baselineKeys,
    });

    expect(completedSet.has("window_display")).toBe(true);
    expect(completedSet.has("store_score")).toBe(true);
    expect(completedSet.has("new_store_privilege")).toBe(true);
  });

  it("饿了么未完成店铺不会默认补标橱窗展示和店铺分解析", () => {
    const elemeKeys = getWorkflowFlowProgressKeys("饿了么餐饮");
    const baselineKeys = elemeKeys
      .filter((key) => !["window_display", "store_score", "new_store_privilege"].includes(key))
      .slice(0, -1);

    const completedSet = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: "饿了么餐饮",
      shopStatus: "正常",
      completedKeys: baselineKeys,
      loggedKeys: baselineKeys,
    });

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

    expect(metrics.totalProgressCount).toBe(18);
    expect(metrics.completedCount).toBe(18);
    expect(metrics.remainingCount).toBe(0);
  });
});
