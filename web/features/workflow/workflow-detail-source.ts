import {
  buildShopQuery,
  buildWorkflowDailyActionMonitorShopsQuery,
  buildWorkflowRecentSignedMonitorShopsQuery,
} from "./api";
import { RECENT_SIGNED_WINDOW_DAYS } from "./constants";

type ResolveWorkflowDetailSourceParams = {
  detailPage: number;
  selectedOperator: string;
  recentSignedFilterOperator: string;
  dailyActionFilterOperator: string;
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
};

type BuildWorkflowDefaultShopsQueryParams = {
  detailPage: number;
  selectedOperator: string;
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
};

export function buildWorkflowDefaultShopsQuery({
  detailPage,
  selectedOperator,
  shopNameKeyword,
  merchantIdKeyword,
  statusKeyword,
}: BuildWorkflowDefaultShopsQueryParams) {
  return buildShopQuery({
    page: detailPage,
    pageSize: 15,
    detailFullScopeMode: false,
    selectedOperator,
    excludeTerminated: false,
    excludeInvalid: true,
    shopNameKeyword,
    merchantIdKeyword,
    statusKeyword,
  });
}

export function resolveWorkflowDetailSource({
  detailPage,
  selectedOperator,
  recentSignedFilterOperator,
  dailyActionFilterOperator,
  shopNameKeyword,
  merchantIdKeyword,
  statusKeyword,
}: ResolveWorkflowDetailSourceParams) {
  if (recentSignedFilterOperator) {
    return {
      type: "recent-signed" as const,
      page: detailPage,
      operatorName: recentSignedFilterOperator,
      query: buildWorkflowRecentSignedMonitorShopsQuery({
        page: detailPage,
        pageSize: 15,
        windowDays: RECENT_SIGNED_WINDOW_DAYS,
        operatorName: recentSignedFilterOperator,
      }),
    };
  }

  if (dailyActionFilterOperator) {
    return {
      type: "daily-action" as const,
      page: detailPage,
      operatorName: dailyActionFilterOperator,
      shopNameKeyword,
      merchantIdKeyword,
      statusKeyword,
      query: buildWorkflowDailyActionMonitorShopsQuery({
        page: detailPage,
        pageSize: 15,
        operatorName: dailyActionFilterOperator,
        shopNameKeyword,
        merchantIdKeyword,
        statusKeyword,
      }),
    };
  }

  return {
    type: "default" as const,
    query: buildWorkflowDefaultShopsQuery({
      detailPage,
      selectedOperator,
      shopNameKeyword,
      merchantIdKeyword,
      statusKeyword,
    }),
  };
}
