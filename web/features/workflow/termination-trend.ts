import type { WorkflowTrendSeries } from "./types";

type WorkflowTerminationShop = {
  operatorName?: string;
  shopStatus?: string;
  terminationDate?: Date | string | null;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateKeys(start: Date, end: Date) {
  const dateKeys: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    dateKeys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dateKeys;
}

export function buildWorkflowTerminationTrend(params: {
  shops: WorkflowTerminationShop[];
  start: Date;
  end: Date;
  operatorName?: string;
}): WorkflowTrendSeries[] {
  const dateKeys = buildDateKeys(params.start, params.end);
  const dateKeySet = new Set(dateKeys);
  const normalizedOperatorFilter = normalizeText(params.operatorName);
  const operatorDailyCounts = new Map<string, Map<string, number>>();

  params.shops.forEach((shop) => {
    const operatorName = normalizeText(shop.operatorName) || "未分配";
    if (normalizedOperatorFilter && operatorName !== normalizedOperatorFilter) {
      return;
    }

    if (normalizeText(shop.shopStatus) !== "已解约") {
      return;
    }

    const terminationDate = toValidDate(shop.terminationDate);
    if (!terminationDate) {
      return;
    }

    const dateKey = formatDateKey(terminationDate);
    if (!dateKeySet.has(dateKey)) {
      return;
    }

    if (!operatorDailyCounts.has(operatorName)) {
      operatorDailyCounts.set(operatorName, new Map());
    }

    const dailyCounts = operatorDailyCounts.get(operatorName)!;
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);
  });

  return Array.from(operatorDailyCounts.entries())
    .sort((left, right) => left[0].localeCompare(right[0], "zh-CN"))
    .map(([operatorName, dailyCounts]) => ({
      name: operatorName,
      values: dateKeys.map((dateKey) => ({
        date: dateKey,
        value: dailyCounts.get(dateKey) ?? 0,
      })),
    }));
}
