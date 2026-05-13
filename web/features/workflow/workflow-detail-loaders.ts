import {
  fetchWorkflowDailyActionMonitorShops,
  fetchWorkflowPatrolBatch,
  fetchWorkflowRecentSignedMonitorShops,
  fetchWorkflowShops,
  fetchWorkflowStatus,
} from "./api";
import { resolveWorkflowDetailSource } from "./workflow-detail-source";
import type { PatrolStatusItem, ShopItem, WorkflowLogItem } from "./types";
import { chunkArray, statusKey } from "./utils";

type FetchWorkflowDetailShopsParams = {
  detailPage: number;
  selectedOperator: string;
  recentSignedFilterOperator: string;
  dailyActionFilterOperator: string;
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
};

type WorkflowDetailShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export async function fetchWorkflowDetailShops(
  params: FetchWorkflowDetailShopsParams
) {
  const source = resolveWorkflowDetailSource(params);

  if (source.type === "recent-signed") {
    return fetchWorkflowRecentSignedMonitorShops(source.query);
  }

  if (source.type === "daily-action") {
    return fetchWorkflowDailyActionMonitorShops(source.query);
  }

  return fetchWorkflowShops(source.query) as Promise<WorkflowDetailShopsResponse>;
}

export async function fetchWorkflowStatusMap(params: {
  selectedOperator: string;
  shopIds: string[];
  batchSize: number;
}) {
  const operatorName = params.selectedOperator !== "__ALL__" ? params.selectedOperator : "";
  const chunks = chunkArray(params.shopIds, params.batchSize);
  const results = await Promise.all(
    chunks.map((chunk) => fetchWorkflowStatus({ operatorName, shopIds: chunk }))
  );

  const map: Record<string, boolean> = {};
  results.forEach((result: { logs?: WorkflowLogItem[] }) => {
    (result.logs ?? []).forEach((log) => {
      map[statusKey(log.shopId, log.progressKey)] = Boolean(log.completed);
    });
  });

  return map;
}

export async function fetchWorkflowPatrolStatusMap(params: {
  shopIds: string[];
  batchSize: number;
}) {
  const chunks = chunkArray(params.shopIds, params.batchSize);
  const results = await Promise.all(
    chunks.map((chunk) => fetchWorkflowPatrolBatch({ shopIds: chunk }))
  );

  const map: Record<string, PatrolStatusItem> = {};
  results.forEach((result: { patrolStatus?: PatrolStatusItem[] }) => {
    (result.patrolStatus ?? []).forEach((item) => {
      map[item.shopId] = item;
    });
  });

  return map;
}
