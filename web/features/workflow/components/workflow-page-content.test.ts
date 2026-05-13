import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkflowPageContent } from "./workflow-page-content";

vi.mock("./workflow-overview-section", () => ({
  WorkflowOverviewSection: () => createElement("div", null, "概览区块"),
}));

vi.mock("./workflow-monitor-panels", () => ({
  WorkflowMonitorPanels: () => createElement("div", null, "监控区块"),
}));

vi.mock("./workflow-detail-controls", () => ({
  WorkflowDetailControls: () => createElement("div", null, "明细控制区块"),
}));

vi.mock("./workflow-shop-list", () => ({
  WorkflowShopList: () => createElement("div", null, "店铺列表区块"),
}));

describe("WorkflowPageContent", () => {
  it("渲染概览、监控和明细区域", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowPageContent, {
        filters: {
          selectedOperator: "__ALL__",
          detailPage: 1,
          chartOperator: "",
          startDate: "2026-04-01",
          endDate: "2026-04-30",
          shopNameKeyword: "",
          merchantIdKeyword: "",
          statusKeyword: "",
          recentSignedFilterOperator: "",
          dailyActionFilterOperator: "",
          hasKeywordFilters: false,
          detailFullScopeMode: false,
          setStartDate: () => undefined,
          setEndDate: () => undefined,
          setChartOperator: () => undefined,
          resetByOperatorChange: () => undefined,
          updateShopNameKeyword: () => undefined,
          updateMerchantIdKeyword: () => undefined,
          updateStatusKeyword: () => undefined,
          clearKeywords: () => undefined,
          setDetailPage: () => undefined,
          clearDailyActionFilter: () => undefined,
          applyDailyActionFilter: () => undefined,
        },
        operators: ["王涛"],
        detailData: {
          shops: [],
          shopsTotal: 0,
          loading: false,
          hasNextWindow: false,
          statusMap: {},
          statusLoading: false,
          patrolDateMap: {},
          setPatrolDateMap: () => undefined,
          patrolStatusMap: {},
          patrolStatusLoading: false,
          patrolLoadingMap: {},
          patrolMessageMap: {},
          copiedShopId: null,
          overviewRefreshToken: 0,
          toggleProgress: () => Promise.resolve(),
          markDailyPatrol: () => Promise.resolve(),
          copyShopName: () => Promise.resolve(),
        },
        overviewData: {
          summary: {
            month: "2026-04",
            shopCountByOperator: [],
            progressCountByItem: [],
            operatorTerminationTrend: [],
          },
          dailyActionMonitor: [],
          dailyActionTotalPendingShops: 0,
          recentSignedMonitor: [],
          recentSignedTotalShops: 0,
        },
        detailLoading: false,
        isDailyActionPaginationMode: false,
        hasActiveDetailFilters: false,
        listResetKey: "__ALL__|1|||||all",
        shopFlowMetricsMap: {},
      })
    );

    expect(html).toContain("概览区块");
    expect(html).toContain("监控区块");
    expect(html).toContain("明细控制区块");
    expect(html).toContain("店铺列表区块");
  });
});
