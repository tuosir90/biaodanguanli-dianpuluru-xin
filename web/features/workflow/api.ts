import type {
  CompletionMonitorResponse,
  CompletionMonitorShopsResponse,
  PatrolAlertResponse,
  PatrolHistoryResponse,
  PatrolStatusItem,
  RecentSignedMonitorResponse,
  RecentSignedMonitorShopsResponse,
  ShopItem,
  WorkflowDailyActionMonitorResponse,
  WorkflowDailyActionMonitorShopsResponse,
  WorkflowLogItem,
  WorkflowSummary,
  WorkflowTodayCompletedItem,
} from "./types";
import { RECENT_SIGNED_WINDOW_LABEL } from "./constants";

type ShopQueryParams = {
  page: number;
  pageSize: number;
  detailFullScopeMode: boolean;
  startDate?: string;
  endDate?: string;
  selectedOperator: string;
  excludeTerminated: boolean;
  excludeInvalid: boolean;
  shopNameKeyword?: string;
  merchantIdKeyword?: string;
  statusKeyword?: string;
};

type ShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type PatrolStatusResponse = {
  patrolStatus?: PatrolStatusItem[];
};

type PatrolShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type CompletionMonitorShopsQueryParams = {
  page: number;
  pageSize: number;
  operatorName?: string;
  shopNameKeyword?: string;
  merchantIdKeyword?: string;
  statusKeyword?: string;
};

type RecentSignedMonitorShopsQueryParams = {
  page: number;
  pageSize: number;
  windowDays: number;
  operatorName?: string;
};

type DailyActionMonitorShopsQueryParams = {
  page: number;
  pageSize: number;
  operatorName?: string;
  shopNameKeyword?: string;
  merchantIdKeyword?: string;
  statusKeyword?: string;
};

export function buildShopQuery(params: ShopQueryParams) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  const hasExplicitStatusKeyword = Boolean(params.statusKeyword?.trim());
  const hasExplicitKeyword = Boolean(
    params.shopNameKeyword?.trim() || params.merchantIdKeyword?.trim()
  );
  const shouldApplyHiddenExclusions =
    !hasExplicitStatusKeyword && !hasExplicitKeyword;

  if (!params.detailFullScopeMode && params.startDate && params.endDate) {
    search.set("startDate", params.startDate);
    search.set("endDate", params.endDate);
  }

  if (params.selectedOperator !== "__ALL__") {
    search.set("operator", params.selectedOperator);
  }

  if (params.excludeTerminated && shouldApplyHiddenExclusions) {
    search.set("excludeTerminated", "1");
  }
  if (params.excludeInvalid && shouldApplyHiddenExclusions) {
    search.set("excludeInvalid", "1");
  }
  if (params.shopNameKeyword?.trim()) {
    search.set("shopName", params.shopNameKeyword.trim());
  }
  if (params.merchantIdKeyword?.trim()) {
    search.set("merchantId", params.merchantIdKeyword.trim());
  }
  if (params.statusKeyword?.trim()) {
    search.set("status", params.statusKeyword.trim());
  }

  return search.toString();
}

export function buildWorkflowSummaryQuery(params: {
  startDate: string;
  endDate: string;
  operatorName?: string;
}) {
  const search = new URLSearchParams();
  search.set("startDate", params.startDate);
  search.set("endDate", params.endDate);
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  return search.toString();
}

export function buildWorkflowStatusQuery(params: {
  operatorName?: string;
  shopIds: string[];
}) {
  const search = new URLSearchParams();
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  if (params.shopIds.length > 0) {
    search.set("shopIds", params.shopIds.join(","));
  }
  return search.toString();
}

export function buildWorkflowTodayCompletedQuery(params: { shopIds: string[] }) {
  const search = new URLSearchParams();
  if (params.shopIds.length > 0) {
    search.set("shopIds", params.shopIds.join(","));
  }
  return search.toString();
}

export function buildWorkflowPatrolHistoryQuery(params: {
  page: number;
  pageSize: number;
  range: "today" | "7d";
  operatorName?: string;
  mode?: "patrol" | "completion";
}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  search.set("range", params.range);
  search.set("mode", params.mode ?? "patrol");
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  return search.toString();
}

export function buildWorkflowPatrolShopsQuery(params: {
  page: number;
  pageSize: number;
  minDays: number;
  operatorName?: string;
}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  search.set("minDays", String(params.minDays));
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  return search.toString();
}

export function buildWorkflowCompletionMonitorShopsQuery(
  params: CompletionMonitorShopsQueryParams
) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  if (params.shopNameKeyword?.trim()) {
    search.set("shopName", params.shopNameKeyword.trim());
  }
  if (params.merchantIdKeyword?.trim()) {
    search.set("merchantId", params.merchantIdKeyword.trim());
  }
  if (params.statusKeyword?.trim()) {
    search.set("status", params.statusKeyword.trim());
  }
  return search.toString();
}

export function buildWorkflowRecentSignedMonitorShopsQuery(
  params: RecentSignedMonitorShopsQueryParams
) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  search.set("windowDays", String(params.windowDays));
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  return search.toString();
}

export function buildWorkflowDailyActionMonitorShopsQuery(
  params: DailyActionMonitorShopsQueryParams
) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  if (params.operatorName) {
    search.set("operatorName", params.operatorName);
  }
  if (params.shopNameKeyword?.trim()) {
    search.set("shopName", params.shopNameKeyword.trim());
  }
  if (params.merchantIdKeyword?.trim()) {
    search.set("merchantId", params.merchantIdKeyword.trim());
  }
  if (params.statusKeyword?.trim()) {
    search.set("status", params.statusKeyword.trim());
  }
  return search.toString();
}

export async function fetchWorkflowShops(query: string) {
  const response = await fetch(`/api/shops?${query}`, { cache: "no-store" });
  return (await response.json()) as ShopsResponse;
}

export async function fetchWorkflowStatus(payload: {
  operatorName: string;
  shopIds: string[];
}) {
  const response = await fetch("/api/workflow/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as { logs?: WorkflowLogItem[] };
}

export async function fetchWorkflowTodayCompleted(query: string) {
  const response = await fetch(`/api/workflow/today-completed?${query}`, {
    cache: "no-store",
  });
  return (await response.json()) as { logs?: WorkflowTodayCompletedItem[] };
}

export async function fetchWorkflowPatrolBatch(payload: { shopIds: string[] }) {
  const response = await fetch("/api/workflow/patrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as PatrolStatusResponse;
}

export async function fetchWorkflowDropdowns() {
  const response = await fetch("/api/dropdowns");
  return (await response.json()) as { operatorName?: string[]; salesCityMap?: Record<string, string> };
}

export async function fetchWorkflowCompletionMonitor() {
  const response = await fetch("/api/workflow/completion-monitor");
  return (await response.json()) as CompletionMonitorResponse;
}

export async function fetchWorkflowRecentSignedMonitor() {
  const response = await fetch("/api/workflow/recent-signed-monitor");
  return (await response.json()) as RecentSignedMonitorResponse;
}

export async function fetchWorkflowDailyActionMonitor() {
  const response = await fetch("/api/workflow/daily-action-monitor", {
    cache: "no-store",
  });
  return (await response.json()) as WorkflowDailyActionMonitorResponse;
}

export async function fetchWorkflowCompletionMonitorShops(query: string) {
  const response = await fetch(`/api/workflow/completion-monitor/shops?${query}`, {
    cache: "no-store",
  });
  const result = (await response.json()) as CompletionMonitorShopsResponse & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(result.message || "获取未完成流程店铺失败");
  }
  return result;
}

export async function fetchWorkflowRecentSignedMonitorShops(query: string) {
  const response = await fetch(`/api/workflow/recent-signed-monitor/shops?${query}`, {
    cache: "no-store",
  });
  const result = (await response.json()) as RecentSignedMonitorShopsResponse & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(result.message || `获取${RECENT_SIGNED_WINDOW_LABEL}店铺失败`);
  }
  return result;
}

export async function fetchWorkflowDailyActionMonitorShops(query: string) {
  const response = await fetch(`/api/workflow/daily-action-monitor/shops?${query}`, {
    cache: "no-store",
  });
  const result = (await response.json()) as WorkflowDailyActionMonitorShopsResponse & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(result.message || "获取今日待处理店铺失败");
  }
  return result;
}

export async function fetchWorkflowPatrolAlerts() {
  const response = await fetch("/api/workflow/patrol/alerts");
  return (await response.json()) as PatrolAlertResponse;
}

export async function fetchWorkflowPatrolHistory(query: string) {
  const response = await fetch(`/api/workflow/patrol/history?${query}`, { cache: "no-store" });
  return (await response.json()) as PatrolHistoryResponse;
}

export async function fetchWorkflowPatrolShops(query: string) {
  const response = await fetch(`/api/workflow/patrol/shops?${query}`, {
    cache: "no-store",
  });
  return (await response.json()) as PatrolShopsResponse;
}

export async function fetchWorkflowSummary(query: string) {
  const response = await fetch(`/api/workflow/summary?${query}`);
  return (await response.json()) as WorkflowSummary;
}

export async function toggleWorkflowProgress(payload: {
  shopId: string;
  operatorName: string;
  progressKey: string;
  progressLabel: string;
  completed: boolean;
}) {
  const response = await fetch("/api/workflow/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = (await response.json()) as { message?: string };
    throw new Error(result.message || "更新工作进度失败");
  }
}

export async function markWorkflowDailyPatrol(payload: {
  shopId: string;
  operatorName: string;
  patrolDate: string;
  completed: boolean;
}) {
  return fetch("/api/workflow/patrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchWorkflowPatrolStatus(query: string) {
  const response = await fetch(`/api/workflow/patrol?${query}`);
  return (await response.json()) as PatrolStatusResponse;
}
