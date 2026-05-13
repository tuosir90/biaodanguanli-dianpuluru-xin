import { describe, expect, it } from "vitest";
import {
  buildWorkflowDailyActionItems,
  buildWorkflowDailyActionSummary,
  isWorkflowFlowTaskCompletedToday,
  resolveWorkflowDailyAction,
} from "@/features/workflow/daily-action-monitor";

describe("isWorkflowFlowTaskCompletedToday", () => {
  it("分类栏优化和图片三件套当天只完成一个时，今日任务仍未完成", () => {
    expect(
      isWorkflowFlowTaskCompletedToday({
        deliveryPlatform: "美团餐饮",
        incompleteFlowKeys: ["category_opt", "image_pack", "market_plan"],
        todayCompletedFlowKeys: ["category_opt"],
      })
    ).toBe(false);
  });

  it("分类栏优化和图片三件套当天两个都完成后，今日任务完成", () => {
    expect(
      isWorkflowFlowTaskCompletedToday({
        deliveryPlatform: "饿了么餐饮",
        incompleteFlowKeys: ["market_plan"],
        todayCompletedFlowKeys: ["category_opt", "image_pack"],
      })
    ).toBe(true);
  });

  it("美团开启新店特权和视频店招当天只完成一个时，今日任务仍未完成", () => {
    expect(
      isWorkflowFlowTaskCompletedToday({
        deliveryPlatform: "美团餐饮",
        incompleteFlowKeys: ["new_store_privilege", "video_sign"],
        todayCompletedFlowKeys: ["new_store_privilege"],
      })
    ).toBe(false);
  });

  it("饿了么开启新店特权和橱窗展示当天只完成一个时，今日任务仍未完成", () => {
    expect(
      isWorkflowFlowTaskCompletedToday({
        deliveryPlatform: "饿了么餐饮",
        incompleteFlowKeys: ["new_store_privilege", "window_display"],
        todayCompletedFlowKeys: ["window_display"],
      })
    ).toBe(false);
  });

  it("没有命中成对规则时，今天完成任意一个流程就算完成今日任务", () => {
    expect(
      isWorkflowFlowTaskCompletedToday({
        deliveryPlatform: "美团餐饮",
        incompleteFlowKeys: ["dish_desc", "review_appeal"],
        todayCompletedFlowKeys: ["dish_desc"],
      })
    ).toBe(true);
  });
});

describe("resolveWorkflowDailyAction", () => {
  it("将未完成流程且今天还未推进的新店判定为流程待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-flow",
        operatorName: "王清月",
        remainingCount: 5,
        isNewShop: true,
        flowCompletedToday: false,
        latestDailyPointMatched: false,
        daysUnpatrolled: 0,
      })
    ).toMatchObject({
      shopId: "shop-flow",
      operatorName: "王清月",
      actionType: "flow",
    });
  });

  it("新店当天只要推进过一个流程项就不再计入待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-flow-done",
        operatorName: "王清月",
        remainingCount: 3,
        isNewShop: true,
        flowCompletedToday: true,
        latestDailyPointMatched: false,
        daysUnpatrolled: 0,
      })
    ).toBeNull();
  });

  it("正常店且流程未完成、今天还未推进且命中最新抽点时计入流程待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-normal",
        operatorName: "王清月",
        remainingCount: 2,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 3,
      })
    ).toMatchObject({
      shopId: "shop-normal",
      operatorName: "王清月",
      actionType: "flow",
    });
  });

  it("正常店且流程未完成但未命中最新抽点时不计入流程待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-normal-no-daily-point",
        operatorName: "王清月",
        remainingCount: 2,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: false,
        daysUnpatrolled: 3,
      })
    ).toBeNull();
  });

  it("流程已完成且命中最新抽点并超过2天未巡店时判定为巡店待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-patrol",
        operatorName: "王涛",
        remainingCount: 0,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 2,
      })
    ).toMatchObject({
      shopId: "shop-patrol",
      operatorName: "王涛",
      actionType: "patrol",
    });
  });

  it("流程已完成但1天未巡店时不计入巡店待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-patrol-recent",
        operatorName: "王涛",
        remainingCount: 0,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 1,
      })
    ).toBeNull();
  });

  it("流程已完成但未命中最新抽点时不计入巡店待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-no-daily-point",
        operatorName: "王涛",
        remainingCount: 0,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: false,
        daysUnpatrolled: 4,
      })
    ).toBeNull();
  });

  it("无效店铺即使命中最新抽点且超过2天未巡店也不计入今日待处理", () => {
    expect(
      resolveWorkflowDailyAction({
        shopId: "shop-invalid",
        operatorName: "张玉莲",
        remainingCount: 0,
        isNewShop: false,
        isInvalidShop: true,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 48,
      })
    ).toBeNull();
  });
});

describe("buildWorkflowDailyActionSummary", () => {
  it("按运营汇总流程待处理和巡店待处理，并且总数不重叠", () => {
    const items = buildWorkflowDailyActionItems([
      {
        shopId: "shop-flow-1",
        operatorName: "王清月",
        remainingCount: 4,
        isNewShop: true,
        flowCompletedToday: false,
        latestDailyPointMatched: false,
        daysUnpatrolled: 0,
      },
      {
        shopId: "shop-flow-2",
        operatorName: "王清月",
        remainingCount: 1,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 5,
      },
      {
        shopId: "shop-patrol-1",
        operatorName: "王涛",
        remainingCount: 0,
        isNewShop: false,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 2,
      },
      {
        shopId: "shop-patrol-2",
        operatorName: "王涛",
        remainingCount: 0,
        isNewShop: true,
        flowCompletedToday: false,
        latestDailyPointMatched: true,
        daysUnpatrolled: 3,
      },
    ]);

    expect(items).toHaveLength(4);

    expect(buildWorkflowDailyActionSummary(items)).toEqual({
      operatorStats: [
        {
          operatorName: "王清月",
          pendingShopCount: 2,
          flowPendingShopCount: 2,
          patrolPendingShopCount: 0,
        },
        {
          operatorName: "王涛",
          pendingShopCount: 2,
          flowPendingShopCount: 0,
          patrolPendingShopCount: 2,
        },
      ],
      totalPendingShops: 4,
    });
  });
});
