import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkflowDailyActionSection } from "./workflow-daily-action-section";
import { WorkflowHistoryPanel } from "./workflow-history-panel";
import { WorkflowRecentSignedSection } from "./workflow-recent-signed-section";

describe("WorkflowRecentSignedSection", () => {
  it("展示签约10天内运营提醒和查看明细按钮", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowRecentSignedSection, {
        recentSignedMonitor: [
          {
            operatorName: "王清月",
            recentSignedShopCount: 3,
          },
        ],
        recentSignedTotalShops: 3,
        recentSignedExpandedOperator: "",
        recentSignedDetailItemsMap: {},
        recentSignedDetailTotalMap: {},
        recentSignedDetailLoadingOperator: "",
        recentSignedDetailErrorMap: {},
        onToggleRecentSignedDetails: () => undefined,
      })
    );

    expect(html).toContain("签约10天内店铺提醒统计");
    expect(html).toContain("王清月");
    expect(html).toContain("查看 3 家提醒店铺");
  });
});

describe("WorkflowDailyActionSection", () => {
  it("在每个运营卡片下展示流程历史和巡店历史按钮，并在对应卡片下方展开历史面板", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowDailyActionSection, {
        dailyActionMonitor: [
          {
            operatorName: "王涛",
            pendingShopCount: 3,
            flowPendingShopCount: 2,
            patrolPendingShopCount: 1,
          },
          {
            operatorName: "王清月",
            pendingShopCount: 4,
            flowPendingShopCount: 3,
            patrolPendingShopCount: 1,
          },
        ],
        dailyActionTotalPendingShops: 7,
        dailyActionFilterOperator: "王涛",
        onClearDailyActionFilter: () => undefined,
        onApplyDailyActionFilter: () => undefined,
        historyOpen: true,
        historyMode: "completion",
        historyOperator: "王涛",
        onOpenFlowHistory: () => undefined,
        onOpenPatrolHistory: () => undefined,
        historyRange: "today",
        historyPage: 1,
        historyTotalPages: 1,
        historyLoading: false,
        historyError: "",
        historyItems: [
          {
            shopId: "shop-1",
            merchantId: "123",
            shopName: "测试店铺",
            operatorName: "王涛",
            patrolDate: "2026-04-07",
            markedAt: "2026-04-07 12:00:00",
            progressLabel: "分类栏优化",
          },
        ],
        historyTotal: 1,
        onHistoryRangeChange: () => undefined,
        onHistoryClearOperator: () => undefined,
        onHistoryPrevPage: () => undefined,
        onHistoryNextPage: () => undefined,
      })
    );

    expect(html).toContain("今日待处理店铺监控");
    expect(html).toContain("近2日有抽点的店铺");
    expect(html).toContain("流程推进：2家");
    expect(html).toContain("巡店标记：1家");
    expect(html).toContain("清空筛选");
    expect(html).toContain("md:justify-between");
    expect(html).toContain("md:ml-auto");
    expect(html).toContain("md:justify-end");
    expect(html.match(/查看流程历史/g)?.length).toBe(1);
    expect(html.match(/收起流程历史/g)?.length).toBe(1);
    expect(html.match(/查看巡店历史/g)?.length).toBe(2);
    const firstOperatorIndex = html.indexOf("王涛");
    const historyPanelIndex = html.indexOf("流程完成历史已标记商家ID");
    const secondOperatorIndex = html.lastIndexOf("王清月");
    expect(firstOperatorIndex).toBeGreaterThan(-1);
    expect(historyPanelIndex).toBeGreaterThan(firstOperatorIndex);
    expect(secondOperatorIndex).toBeGreaterThan(historyPanelIndex);
  });
});

describe("WorkflowHistoryPanel", () => {
  it("展示历史已标记记录明细", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowHistoryPanel, {
        historyMode: "completion",
        historyRange: "today",
        historyOperator: "王郡江",
        historyPage: 1,
        historyTotalPages: 1,
        historyLoading: false,
        historyError: "",
        historyItems: [
          {
            shopId: "shop-1",
            merchantId: "123",
            shopName: "测试店铺",
            operatorName: "王郡江",
            patrolDate: "2026-04-07",
            markedAt: "2026-04-07 12:00:00",
            progressLabel: "分类栏优化",
          },
        ],
        historyTotal: 1,
        onRangeChange: () => undefined,
        onClearOperator: () => undefined,
        onPrevPage: () => undefined,
        onNextPage: () => undefined,
      })
    );

    expect(html).toContain("流程完成历史已标记商家ID");
    expect(html).toContain("测试店铺");
    expect(html).toContain("分类栏优化");
  });
});
