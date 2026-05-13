import {
  normalizeDateKey,
  normalizeText,
  type DailyPointPlatform,
} from "@/lib/daily-point-derived";
import { type DailyTrendSeries } from "@/lib/daily-trend-series";
import { resolveDailyPointImportUniqueKey } from "@/lib/daily-point-import-key";

export type DailyPointTrendDetail = {
  _id?: unknown;
  platform?: DailyPointPlatform;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
  rowData?: Record<string, unknown>;
};

export type DailyPointTrendShop = {
  merchantId?: string;
  shopName?: string;
  operatorName?: string;
};

function monthDateKeys(start: Date, end: Date) {
  const keys: string[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function normalizeRowData(
  rowData?: Record<string, unknown>
): Record<string, string> {
  if (!rowData || typeof rowData !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rowData)
      .map(([key, value]) => [normalizeText(key), normalizeText(value)] as const)
      .filter(([key]) => key)
  );
}

function buildCanonicalDetailKey(
  detail: DailyPointTrendDetail,
  dateKey: string
) {
  const platform = detail.platform;
  const normalizedRowData = normalizeRowData(detail.rowData);

  if (platform && Object.keys(normalizedRowData).length > 0) {
    return resolveDailyPointImportUniqueKey(platform, normalizedRowData);
  }

  return [
    normalizeText(platform),
    dateKey,
    normalizeText(detail.merchantId),
    normalizeText(detail.storeId),
    normalizeText(detail.shopName),
    String(toFiniteNumber(detail.amountValue)),
  ].join("|");
}

export function buildDailyPointRelatedShopFilter(details: DailyPointTrendDetail[]) {
  const idValues = Array.from(
    new Set(
      details.flatMap((detail) => [
        normalizeText(detail.merchantId),
        normalizeText(detail.storeId),
      ])
    )
  ).filter(Boolean);
  const shopNames = Array.from(
    new Set(details.map((detail) => normalizeText(detail.shopName)).filter(Boolean))
  );
  const shopRelationFilter: Array<Record<string, unknown>> = [];

  if (idValues.length > 0) {
    shopRelationFilter.push({ merchantId: { $in: idValues } });
  }

  if (shopNames.length > 0) {
    shopRelationFilter.push({ shopName: { $in: shopNames } });
  }

  return {
    idValues,
    shopNames,
    shopRelationFilter,
  };
}

export function buildDailyPointTrends(params: {
  details: DailyPointTrendDetail[];
  shops: DailyPointTrendShop[];
  month: string;
  start: Date;
  end: Date;
}) {
  const idToOperator = new Map<string, string>();
  const shopNameToOperator = new Map<string, string>();

  params.shops.forEach((shop) => {
    const operator = normalizeText(shop.operatorName) || "未分配";
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);

    if (merchantId) {
      idToOperator.set(merchantId, operator);
    }

    if (shopName) {
      shopNameToOperator.set(shopName, operator);
    }
  });

  const dateKeys = monthDateKeys(params.start, params.end);
  const dateSet = new Set(dateKeys);
  const operatorDaily = new Map<
    string,
    Map<string, { shopKeys: Set<string>; rowKeys: Set<string>; amountTotal: number }>
  >();

  params.details.forEach((detail) => {
    const dateKey = normalizeDateKey(detail.recordDateKey || detail.recordDate);
    if (!dateKey || !dateSet.has(dateKey) || !dateKey.startsWith(params.month)) {
      return;
    }

    const merchantId = normalizeText(detail.merchantId);
    const storeId = normalizeText(detail.storeId);
    const shopName = normalizeText(detail.shopName);
    const operatorName =
      idToOperator.get(merchantId) ||
      idToOperator.get(storeId) ||
      shopNameToOperator.get(shopName) ||
      "未分配";

    if (!operatorDaily.has(operatorName)) {
      operatorDaily.set(operatorName, new Map());
    }

    const byDate = operatorDaily.get(operatorName)!;
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        shopKeys: new Set(),
        rowKeys: new Set(),
        amountTotal: 0,
      });
    }

    const metric = byDate.get(dateKey)!;
    const shopKey = storeId || merchantId || shopName || "unknown";
    metric.shopKeys.add(shopKey);

    const rowKey = buildCanonicalDetailKey(detail, dateKey);
    if (!metric.rowKeys.has(rowKey)) {
      metric.rowKeys.add(rowKey);
      metric.amountTotal = roundToTwo(
        metric.amountTotal + toFiniteNumber(detail.amountValue)
      );
    }
  });

  const sortedOperators = Array.from(operatorDaily.keys()).sort((left, right) =>
    left.localeCompare(right, "zh-CN")
  );

  return {
    shopCountTrend: sortedOperators.map((operatorName) => ({
      name: operatorName,
      values: dateKeys.map((date) => ({
        date,
        value: operatorDaily.get(operatorName)?.get(date)?.shopKeys.size ?? 0,
      })),
    })) satisfies DailyTrendSeries[],
    totalAmountTrend: sortedOperators.map((operatorName) => ({
      name: operatorName,
      values: dateKeys.map((date) => ({
        date,
        value: operatorDaily.get(operatorName)?.get(date)?.amountTotal ?? 0,
      })),
    })) satisfies DailyTrendSeries[],
  };
}
