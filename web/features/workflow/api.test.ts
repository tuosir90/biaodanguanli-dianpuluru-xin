import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildShopQuery,
  buildWorkflowCompletionMonitorShopsQuery,
  buildWorkflowRecentSignedMonitorShopsQuery,
  buildWorkflowSummaryQuery,
  buildWorkflowStatusQuery,
  toggleWorkflowProgress,
} from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("workflow api query builders", () => {
  it("buildShopQuery returns window query when not full scope", () => {
    const query = buildShopQuery({
      page: 2,
      pageSize: 1000,
      detailFullScopeMode: false,
      startDate: "2026-02-01",
      endDate: "2026-02-15",
      selectedOperator: "张三",
      excludeTerminated: true,
      excludeInvalid: true,
      shopNameKeyword: "张玉莲",
      merchantIdKeyword: "25176810",
      statusKeyword: "正常",
    });
    expect(query).toContain("page=2");
    expect(query).toContain("pageSize=1000");
    expect(query).toContain("startDate=2026-02-01");
    expect(query).toContain("endDate=2026-02-15");
    expect(query).toContain("operator=%E5%BC%A0%E4%B8%89");
    expect(query).not.toContain("excludeTerminated=1");
    expect(query).not.toContain("excludeInvalid=1");
    expect(query).toContain("shopName=%E5%BC%A0%E7%8E%89%E8%8E%B2");
    expect(query).toContain("merchantId=25176810");
    expect(query).toContain("status=%E6%AD%A3%E5%B8%B8");
  });

  it("buildShopQuery omits date in full scope mode", () => {
    const query = buildShopQuery({
      page: 1,
      pageSize: 10000,
      detailFullScopeMode: true,
      startDate: "2026-02-01",
      endDate: "2026-02-15",
      selectedOperator: "__ALL__",
      excludeTerminated: false,
      excludeInvalid: false,
    });
    expect(query).toContain("pageSize=10000");
    expect(query).not.toContain("startDate=");
    expect(query).not.toContain("endDate=");
    expect(query).not.toContain("operator=");
    expect(query).not.toContain("excludeTerminated=1");
  });

  it("buildWorkflowSummaryQuery returns correct range and optional operator", () => {
    const query = buildWorkflowSummaryQuery({
      startDate: "2026-02-01",
      endDate: "2026-02-15",
      operatorName: "李四",
    });
    expect(query).toBe("startDate=2026-02-01&endDate=2026-02-15&operatorName=%E6%9D%8E%E5%9B%9B");
  });

  it("buildWorkflowStatusQuery omits empty operator", () => {
    const query = buildWorkflowStatusQuery({ operatorName: "", shopIds: ["1", "2"] });
    expect(query).toBe("shopIds=1%2C2");
  });

  it("buildWorkflowCompletionMonitorShopsQuery returns page and operator", () => {
    const query = buildWorkflowCompletionMonitorShopsQuery({
      page: 2,
      pageSize: 15,
      operatorName: "张三",
    });
    expect(query).toBe("page=2&pageSize=15&operatorName=%E5%BC%A0%E4%B8%89");
  });

  it("buildWorkflowRecentSignedMonitorShopsQuery returns page, 10-day window and operator", () => {
    const query = buildWorkflowRecentSignedMonitorShopsQuery({
      page: 3,
      pageSize: 15,
      windowDays: 10,
      operatorName: "张三",
    });

    expect(query).toBe(
      "page=3&pageSize=15&windowDays=10&operatorName=%E5%BC%A0%E4%B8%89"
    );
  });

  it("buildWorkflowCompletionMonitorShopsQuery omits invalid status by caller control", () => {
    const query = buildWorkflowCompletionMonitorShopsQuery({
      page: 1,
      pageSize: 15,
      operatorName: "张三",
      statusKeyword: "正常",
    });

    expect(query).toContain("status=%E6%AD%A3%E5%B8%B8");
    expect(query).not.toContain("%E6%97%A0%E6%95%88%E5%BA%97%E9%93%BA");
  });

  it("buildShopQuery uses explicit status filter without hidden exclusions", () => {
    const query = buildShopQuery({
      page: 1,
      pageSize: 15,
      detailFullScopeMode: false,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      selectedOperator: "__ALL__",
      excludeTerminated: true,
      excludeInvalid: true,
      statusKeyword: "无效店铺",
    });

    expect(query).toContain("status=%E6%97%A0%E6%95%88%E5%BA%97%E9%93%BA");
    expect(query).not.toContain("excludeInvalid=1");
    expect(query).not.toContain("excludeTerminated=1");
  });

  it("buildShopQuery uses keyword search without hidden exclusions", () => {
    const query = buildShopQuery({
      page: 1,
      pageSize: 15,
      detailFullScopeMode: false,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      selectedOperator: "__ALL__",
      excludeTerminated: true,
      excludeInvalid: true,
      merchantIdKeyword: "1300180053",
    });

    expect(query).toContain("merchantId=1300180053");
    expect(query).not.toContain("excludeInvalid=1");
    expect(query).not.toContain("excludeTerminated=1");
  });

  it("toggleWorkflowProgress 在接口失败时抛出后端错误信息", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ message: "当前店铺已锁定全店图流程" }),
    } as Response);

    await expect(
      toggleWorkflowProgress({
        shopId: "shop-1",
        operatorName: "运营A",
        progressKey: "dish_1_10",
        progressLabel: "菜品图（1-10张）",
        completed: true,
      })
    ).rejects.toThrow("当前店铺已锁定全店图流程");
  });
});
