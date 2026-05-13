import { resolveSalesCity } from "@/lib/sales-city";
import {
  WUHAN_SALES_STATS_ALL_VALUE,
  WUHAN_SALES_STATS_MIN_DATE_KEY,
  buildWuhanSalesStatsDateKeys,
} from "./month";
import { resolveWuhanSalesDailyPointDateKey } from "./daily-point-business-date";
import { resolveWuhanSalesOpenedDateKey } from "./opened-date";
import type { WuhanSalesDailyStatItem, WuhanSalesStatsReportResult } from "./types";

type ShopRow = {
  _id: string;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  salesName?: string;
  salesCity?: string;
  entryDate?: Date | string;
  contractSignedDate?: Date | string;
};

type DailyPointRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  recordDate?: string;
  recordDateKey?: string;
  amountValue?: number;
  rowData?: Record<string, unknown>;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizePlatform(deliveryPlatform: unknown) {
  return normalizeText(deliveryPlatform).includes("饿了么") ? "eleme" : "meituan";
}

function buildMonthDateKeys(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return [];

  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${matched[1]}-${matched[2]}-${day}`;
  });
}

function buildReportDateKeys(params: {
  month: string;
  latestDailyPointDateKey?: string;
  shops: ShopRow[];
}) {
  if (params.month !== WUHAN_SALES_STATS_ALL_VALUE) {
    return buildMonthDateKeys(params.month);
  }

  const latestSignedShopDateKey = params.shops
    .map((shop) => resolveWuhanSalesOpenedDateKey(shop))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? "";
  const endDateCandidates = [
    params.latestDailyPointDateKey,
    latestSignedShopDateKey,
  ].filter((value): value is string => Boolean(value));
  const endDateKey = endDateCandidates
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? WUHAN_SALES_STATS_MIN_DATE_KEY;

  return buildWuhanSalesStatsDateKeys(WUHAN_SALES_STATS_MIN_DATE_KEY, endDateKey);
}

function buildDailyPointRowKey(row: DailyPointRow, recordDateKey: string) {
  return [
    normalizeText(row.platform),
    recordDateKey,
    normalizeText(row.merchantId),
    normalizeText(row.storeId),
    normalizeText(row.shopName),
    String(Number(row.amountValue ?? 0)),
  ].join("|");
}

function buildShopKey(shop: ShopRow) {
  const platform = normalizePlatform(shop.deliveryPlatform);
  return `${platform}|${normalizeText(shop.merchantId) || normalizeText(shop.shopName) || normalizeText(shop._id)}`;
}

function buildIndexKey(platform: string, value: string) {
  return `${platform}|${value}`;
}

function buildDailyPointIndexes(dailyDetails: DailyPointRow[]) {
  const merchantMap = new Map<string, DailyPointRow[]>();
  const storeMap = new Map<string, DailyPointRow[]>();
  const shopNameMap = new Map<string, DailyPointRow[]>();

  dailyDetails.forEach((row) => {
    const platform = normalizeText(row.platform);
    const merchantId = normalizeText(row.merchantId);
    const storeId = normalizeText(row.storeId);
    const shopName = normalizeText(row.shopName);

    if (platform && merchantId) {
      const key = buildIndexKey(platform, merchantId);
      merchantMap.set(key, [...(merchantMap.get(key) ?? []), row]);
    }

    if (platform && storeId) {
      const key = buildIndexKey(platform, storeId);
      storeMap.set(key, [...(storeMap.get(key) ?? []), row]);
    }

    if (platform && shopName) {
      const key = buildIndexKey(platform, shopName);
      shopNameMap.set(key, [...(shopNameMap.get(key) ?? []), row]);
    }
  });

  return { merchantMap, storeMap, shopNameMap };
}

function getMatchedDailyRows(
  shop: ShopRow,
  indexes: ReturnType<typeof buildDailyPointIndexes>
) {
  const platform = normalizePlatform(shop.deliveryPlatform);
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);
  const matchedMap = new Map<string, DailyPointRow>();

  if (merchantId) {
    [
      ...(indexes.merchantMap.get(buildIndexKey(platform, merchantId)) ?? []),
      ...(indexes.storeMap.get(buildIndexKey(platform, merchantId)) ?? []),
    ].forEach((row) => {
      matchedMap.set(
        buildDailyPointRowKey(row, resolveWuhanSalesDailyPointDateKey(row)),
        row
      );
    });
  }

  if (matchedMap.size === 0 && shopName) {
    (indexes.shopNameMap.get(buildIndexKey(platform, shopName)) ?? []).forEach(
      (row) => {
        matchedMap.set(
          buildDailyPointRowKey(row, resolveWuhanSalesDailyPointDateKey(row)),
          row
        );
      }
    );
  }

  return Array.from(matchedMap.values());
}

export function buildWuhanSalesStatsReport(params: {
  month: string;
  shops: ShopRow[];
  dailyDetails: DailyPointRow[];
  latestDailyPointDateKey?: string;
}): WuhanSalesStatsReportResult {
  const dateKeys = buildReportDateKeys(params);
  const dateSet = new Set(dateKeys);
  const dayMap = new Map<string, WuhanSalesDailyStatItem>();

  dateKeys.forEach((date) =>
    dayMap.set(date, {
      date,
      dailyPointShopCount: 0,
      dailyPointAmountTotal: 0,
      meituanDailyPointShopCount: 0,
      meituanDailyPointAmountTotal: 0,
      elemeDailyPointShopCount: 0,
      elemeDailyPointAmountTotal: 0,
      signedShopCount: 0,
      signedShops: [],
    })
  );

  const indexes = buildDailyPointIndexes(params.dailyDetails);
  const rowKeyMap = new Map<string, Set<string>>();
  const shopKeyMap = new Map<string, Set<string>>();

  const wuhanShops = params.shops.filter(
    (shop) => {
      if (resolveSalesCity(shop.salesName, shop.salesCity) !== "武汉") {
        return false;
      }

      const openedDateKey = resolveWuhanSalesOpenedDateKey(shop);
      if (!openedDateKey) {
        return false;
      }

      return openedDateKey >= WUHAN_SALES_STATS_MIN_DATE_KEY;
    }
  );
  const signedShopsInMonth =
    params.month === WUHAN_SALES_STATS_ALL_VALUE
      ? wuhanShops
      : wuhanShops.filter((shop) =>
          resolveWuhanSalesOpenedDateKey(shop).startsWith(`${params.month}-`)
        );

  signedShopsInMonth.forEach((shop) => {
    const openedDateKey = resolveWuhanSalesOpenedDateKey(shop);
    if (dateSet.has(openedDateKey)) {
      const day = dayMap.get(openedDateKey);
      if (day) {
        day.signedShops.push({
          shopId: normalizeText(shop.merchantId) || normalizeText(shop.shopName) || normalizeText(shop._id),
          shopName: normalizeText(shop.shopName),
          merchantId: normalizeText(shop.merchantId),
          salesName: normalizeText(shop.salesName) || "未分配",
          contractSignedDate: openedDateKey,
        });
        day.signedShops.sort(
          (left, right) =>
            left.salesName.localeCompare(right.salesName, "zh-CN") ||
            left.shopName.localeCompare(right.shopName, "zh-CN")
        );
        day.signedShopCount = day.signedShops.length;
      }
    }

  });

  wuhanShops.forEach((shop) => {
    getMatchedDailyRows(shop, indexes).forEach((row) => {
      const recordDateKey = resolveWuhanSalesDailyPointDateKey(row);
      if (!dateSet.has(recordDateKey)) {
        return;
      }

      const day = dayMap.get(recordDateKey);
      if (!day) {
        return;
      }

      const rowKeys = rowKeyMap.get(recordDateKey) ?? new Set<string>();
      const shopKeys = shopKeyMap.get(recordDateKey) ?? new Set<string>();
      const rowKey = buildDailyPointRowKey(row, recordDateKey);
      const shopKey = buildShopKey(shop);
      const detailPlatform = normalizeText(row.platform) || normalizePlatform(shop.deliveryPlatform);

      if (!rowKeys.has(rowKey)) {
        const amountValue = Number(row.amountValue ?? 0);
        day.dailyPointAmountTotal = roundToTwo(day.dailyPointAmountTotal + amountValue);
        if (detailPlatform === "eleme") {
          day.elemeDailyPointAmountTotal = roundToTwo(
            day.elemeDailyPointAmountTotal + amountValue
          );
        } else {
          day.meituanDailyPointAmountTotal = roundToTwo(
            day.meituanDailyPointAmountTotal + amountValue
          );
        }
        rowKeys.add(rowKey);
        rowKeyMap.set(recordDateKey, rowKeys);
      }

      if (!shopKeys.has(shopKey)) {
        day.dailyPointShopCount += 1;
        if (detailPlatform === "eleme") {
          day.elemeDailyPointShopCount += 1;
        } else {
          day.meituanDailyPointShopCount += 1;
        }
        shopKeys.add(shopKey);
        shopKeyMap.set(recordDateKey, shopKeys);
      }
    });
  });

  const dailyStats = dateKeys.map((date) => dayMap.get(date)!);
  const salesNameSet = new Set(
    signedShopsInMonth
      .map((shop) => normalizeText(shop.salesName))
      .filter(Boolean)
  );

  return {
    summary: {
      totalSignedShopCount: signedShopsInMonth.length,
      totalDailyPointAmount: roundToTwo(
        dailyStats.reduce((sum, item) => sum + item.dailyPointAmountTotal, 0)
      ),
      totalSalesPersonCount: salesNameSet.size,
    },
    dailyStats,
  };
}
