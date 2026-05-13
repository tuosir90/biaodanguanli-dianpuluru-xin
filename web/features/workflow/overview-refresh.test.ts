import { describe, expect, it } from "vitest";
import {
  shouldCommitOverviewRefreshFetch,
  shouldThrottleOverviewRefresh,
} from "./overview-refresh";

describe("shouldThrottleOverviewRefresh", () => {
  it("手动刷新不应被节流拦截", () => {
    const result = shouldThrottleOverviewRefresh({
      refreshSource: "manual",
      lastFetchAt: 1000,
      now: 1000 + 30_000,
      throttleMs: 120_000,
    });

    expect(result).toBe(false);
  });

  it("被动刷新在节流窗口内应跳过", () => {
    const result = shouldThrottleOverviewRefresh({
      refreshSource: "passive",
      lastFetchAt: 1000,
      now: 1000 + 30_000,
      throttleMs: 120_000,
    });

    expect(result).toBe(true);
  });

  it("被动刷新超过节流窗口后应放行", () => {
    const result = shouldThrottleOverviewRefresh({
      refreshSource: "passive",
      lastFetchAt: 1000,
      now: 1000 + 180_000,
      throttleMs: 120_000,
    });

    expect(result).toBe(false);
  });
});

describe("shouldCommitOverviewRefreshFetch", () => {
  it("严格模式首轮副作用已被清理时，不应记录被动刷新的完成时间", () => {
    const result = shouldCommitOverviewRefreshFetch({
      active: false,
    });

    expect(result).toBe(false);
  });

  it("副作用仍处于激活状态时，应允许记录本次刷新的完成时间", () => {
    const result = shouldCommitOverviewRefreshFetch({
      active: true,
    });

    expect(result).toBe(true);
  });
});
