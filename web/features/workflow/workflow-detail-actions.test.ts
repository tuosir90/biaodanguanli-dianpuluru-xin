import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyWorkflowShopNameAction,
  markWorkflowDailyPatrolAction,
  toggleWorkflowProgressAction,
} from "@/features/workflow/workflow-detail-actions";

vi.mock("@/features/workflow/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/workflow/api")>();
  return {
    ...actual,
    toggleWorkflowProgress: vi.fn(),
    fetchWorkflowPatrolStatus: vi.fn(),
    markWorkflowDailyPatrol: vi.fn(),
  };
});

const apiModule = await import("@/features/workflow/api");

describe("toggleWorkflowProgressAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("成功时刷新 overview/detail token 并回写巡店状态", async () => {
    const setStatusMap = vi.fn();
    const setOverviewRefreshToken = vi.fn();
    const setDetailRefreshToken = vi.fn();
    const setPatrolStatusMap = vi.fn();

    vi.mocked(apiModule.toggleWorkflowProgress).mockResolvedValue(undefined);
    vi.mocked(apiModule.fetchWorkflowPatrolStatus).mockResolvedValue({
      patrolStatus: [
        {
          shopId: "shop-1",
          latestPatrolDate: "2026-04-07",
          latestUpdatedDate: "2026-04-07",
          daysUnpatrolled: 0,
        },
      ],
    });

    await toggleWorkflowProgressAction({
      shopId: "shop-1",
      operatorName: "王涛",
      progressKey: "market_plan",
      progressLabel: "市场调查四套方案",
      previousCompleted: false,
      setStatusMap,
      setOverviewRefreshToken,
      setDetailRefreshToken,
      setPatrolStatusMap,
    });

    expect(apiModule.toggleWorkflowProgress).toHaveBeenCalledTimes(1);
    expect(setOverviewRefreshToken).toHaveBeenCalledTimes(1);
    expect(setDetailRefreshToken).toHaveBeenCalledTimes(1);
    expect(setPatrolStatusMap).toHaveBeenCalledTimes(1);
  });

  it("已完成流程再次点击时发送取消完成状态", async () => {
    vi.mocked(apiModule.toggleWorkflowProgress).mockResolvedValue(undefined);
    vi.mocked(apiModule.fetchWorkflowPatrolStatus).mockResolvedValue({
      patrolStatus: [],
    });

    await toggleWorkflowProgressAction({
      shopId: "shop-1",
      operatorName: "王涛",
      progressKey: "market_plan",
      progressLabel: "市场调查四套方案",
      previousCompleted: true,
      setStatusMap: vi.fn(),
      setOverviewRefreshToken: vi.fn(),
      setDetailRefreshToken: vi.fn(),
      setPatrolStatusMap: vi.fn(),
    });

    expect(apiModule.toggleWorkflowProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop-1",
        progressKey: "market_plan",
        completed: false,
      })
    );
  });
});

describe("markWorkflowDailyPatrolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("成功时刷新 token、消息和巡店状态", async () => {
    const setPatrolLoadingMap = vi.fn();
    const setOverviewRefreshToken = vi.fn();
    const setDetailRefreshToken = vi.fn();
    const setPatrolMessageMap = vi.fn();
    const setPatrolStatusMap = vi.fn();

    vi.mocked(apiModule.markWorkflowDailyPatrol).mockResolvedValue({
      ok: true,
    } as Response);
    vi.mocked(apiModule.fetchWorkflowPatrolStatus).mockResolvedValue({
      patrolStatus: [
        {
          shopId: "shop-1",
          latestPatrolDate: "2026-04-07",
          latestUpdatedDate: "2026-04-07",
          daysUnpatrolled: 0,
        },
      ],
    });

    await markWorkflowDailyPatrolAction({
      shop: {
        _id: "shop-1",
        shopName: "测试店铺",
        operatorName: "王涛",
      },
      patrolDate: "2026-04-07",
      setPatrolLoadingMap,
      setOverviewRefreshToken,
      setDetailRefreshToken,
      setPatrolMessageMap,
      setPatrolStatusMap,
    });

    expect(apiModule.markWorkflowDailyPatrol).toHaveBeenCalledTimes(1);
    expect(setOverviewRefreshToken).toHaveBeenCalledTimes(1);
    expect(setDetailRefreshToken).toHaveBeenCalledTimes(1);
    expect(setPatrolMessageMap).toHaveBeenCalledTimes(1);
    expect(setPatrolStatusMap).toHaveBeenCalledTimes(1);
  });
});

describe("copyWorkflowShopNameAction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("成功复制后记录 copiedShopId", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    const setCopiedShopId = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((handler: TimerHandler) => {
      if (typeof handler === "function") {
        handler();
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);

    await copyWorkflowShopNameAction({
      shopId: "shop-1",
      shopName: "测试店铺",
      setCopiedShopId,
    });

    expect(writeText).toHaveBeenCalledWith("测试店铺");
    expect(setCopiedShopId).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});
