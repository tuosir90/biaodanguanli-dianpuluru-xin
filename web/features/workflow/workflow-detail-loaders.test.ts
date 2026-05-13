import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchWorkflowDetailShops,
  fetchWorkflowPatrolStatusMap,
  fetchWorkflowStatusMap,
} from "@/features/workflow/workflow-detail-loaders";
import { statusKey } from "@/features/workflow/utils";

vi.mock("@/features/workflow/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/workflow/api")>();
  return {
    ...actual,
    fetchWorkflowShops: vi.fn(),
    fetchWorkflowRecentSignedMonitorShops: vi.fn(),
    fetchWorkflowDailyActionMonitorShops: vi.fn(),
    fetchWorkflowStatus: vi.fn(),
    fetchWorkflowPatrolBatch: vi.fn(),
  };
});

const apiModule = await import("@/features/workflow/api");

describe("fetchWorkflowDetailShops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("优先请求签约提醒明细", async () => {
    vi.mocked(apiModule.fetchWorkflowRecentSignedMonitorShops).mockResolvedValue({
      data: [{ _id: "shop-1", shopName: "测试店铺", operatorName: "王涛" }],
      total: 1,
    });

    const result = await fetchWorkflowDetailShops({
      detailPage: 1,
      selectedOperator: "__ALL__",
      recentSignedFilterOperator: "王涛",
      dailyActionFilterOperator: "王清月",
      shopNameKeyword: "",
      merchantIdKeyword: "",
      statusKeyword: "",
    });

    expect(apiModule.fetchWorkflowRecentSignedMonitorShops).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
  });

  it("没有签约提醒时请求今日待处理明细", async () => {
    vi.mocked(apiModule.fetchWorkflowDailyActionMonitorShops).mockResolvedValue({
      data: [{ _id: "shop-2", shopName: "今日待处理店铺", operatorName: "王清月" }],
      total: 2,
    });

    const result = await fetchWorkflowDetailShops({
      detailPage: 2,
      selectedOperator: "__ALL__",
      recentSignedFilterOperator: "",
      dailyActionFilterOperator: "王清月",
      shopNameKeyword: "店铺",
      merchantIdKeyword: "",
      statusKeyword: "新店",
    });

    expect(apiModule.fetchWorkflowDailyActionMonitorShops).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(2);
  });

  it("默认请求普通店铺列表", async () => {
    vi.mocked(apiModule.fetchWorkflowShops).mockResolvedValue({
      data: [{ _id: "shop-3", shopName: "普通店铺", operatorName: "张玉莲" }],
      total: 3,
    });

    const result = await fetchWorkflowDetailShops({
      detailPage: 3,
      selectedOperator: "张玉莲",
      recentSignedFilterOperator: "",
      dailyActionFilterOperator: "",
      shopNameKeyword: "",
      merchantIdKeyword: "",
      statusKeyword: "",
    });

    expect(apiModule.fetchWorkflowShops).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(3);
  });
});

describe("fetchWorkflowStatusMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("按分块结果合并状态映射", async () => {
    vi.mocked(apiModule.fetchWorkflowStatus)
      .mockResolvedValueOnce({
        logs: [{ shopId: "shop-1", progressKey: "market_plan", completed: true }],
      })
      .mockResolvedValueOnce({
        logs: [{ shopId: "shop-2", progressKey: "title_keyword", completed: true }],
      });

    const result = await fetchWorkflowStatusMap({
      selectedOperator: "王涛",
      shopIds: ["shop-1", "shop-2"],
      batchSize: 1,
    });

    expect(result).toEqual({
      [statusKey("shop-1", "market_plan")]: true,
      [statusKey("shop-2", "title_keyword")]: true,
    });
  });
});

describe("fetchWorkflowPatrolStatusMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("按分块结果合并巡店状态映射", async () => {
    vi.mocked(apiModule.fetchWorkflowPatrolBatch)
      .mockResolvedValueOnce({
        patrolStatus: [{ shopId: "shop-1", latestPatrolDate: "2026-04-07", latestUpdatedDate: "2026-04-07", daysUnpatrolled: 1 }],
      })
      .mockResolvedValueOnce({
        patrolStatus: [{ shopId: "shop-2", latestPatrolDate: null, latestUpdatedDate: null, daysUnpatrolled: 3 }],
      });

    const result = await fetchWorkflowPatrolStatusMap({
      shopIds: ["shop-1", "shop-2"],
      batchSize: 1,
    });

    expect(result["shop-1"]?.daysUnpatrolled).toBe(1);
    expect(result["shop-2"]?.daysUnpatrolled).toBe(3);
  });
});
