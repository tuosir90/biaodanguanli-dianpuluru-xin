import { resolveSalesCity } from "@/lib/sales-city";
import { WUHAN_SALES_STATS_MIN_DATE_KEY } from "./month";
import { resolveWuhanSalesDailyPointDateKey } from "./daily-point-business-date";
import { resolveWuhanSalesOpenedDate, resolveWuhanSalesOpenedDateKey } from "./opened-date";
import type {
  WuhanSalesShopDetailItem,
  WuhanSalesShopDetailsReportResult,
} from "./shop-details-types";

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

function buildIndexKey(platform: string, value: string) {
  return `${platform}|${value}`;
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

function getMatchedRows(
  shop: ShopRow,
  indexes: ReturnType<typeof buildDailyPointIndexes>,
  monthPrefix: string
) {
  const platform = normalizePlatform(shop.deliveryPlatform);
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);
  const matchedMap = new Map<string, DailyPointRow>();

  if (merchantId) {
    [
      ...(indexes.merchantMap.get(buildIndexKey(platform, merchantId)) ?? []),
      ...(indexes.storeMap.get(buildIndexKey(platform, merchantId)) ?? []),
    ]
      .filter((row) =>
        resolveWuhanSalesDailyPointDateKey(row).startsWith(`${monthPrefix}-`)
      )
      .forEach((row) =>
        matchedMap.set(
          buildDailyPointRowKey(row, resolveWuhanSalesDailyPointDateKey(row)),
          row
        )
      );
  }

  if (matchedMap.size === 0 && shopName) {
    (indexes.shopNameMap.get(buildIndexKey(platform, shopName)) ?? [])
      .filter((row) =>
        resolveWuhanSalesDailyPointDateKey(row).startsWith(`${monthPrefix}-`)
      )
      .forEach((row) =>
        matchedMap.set(
          buildDailyPointRowKey(row, resolveWuhanSalesDailyPointDateKey(row)),
          row
        )
      );
  }

  return Array.from(matchedMap.values());
}

export function buildWuhanSalesShopDetailsReport(params: {
  month: string;
  shops: ShopRow[];
  dailyDetails: DailyPointRow[];
}): WuhanSalesShopDetailsReportResult {
  const monthPrefix = params.month;
  const indexes = buildDailyPointIndexes(params.dailyDetails);

  const details = params.shops
    .filter((shop) => {
      if (resolveSalesCity(shop.salesName, shop.salesCity) !== "武汉") {
        return false;
      }

      const openedDateKey = resolveWuhanSalesOpenedDateKey(shop);
      if (!openedDateKey) {
        return false;
      }

      return (
        openedDateKey >= WUHAN_SALES_STATS_MIN_DATE_KEY &&
        openedDateKey.startsWith(`${monthPrefix}-`)
      );
    })
    .map((shop) => {
      const openedDate = resolveWuhanSalesOpenedDate(shop);
      const matchedRows = getMatchedRows(shop, indexes, monthPrefix);
      const totalAmount = roundToTwo(
        matchedRows.reduce((sum, row) => sum + Number(row.amountValue ?? 0), 0)
      );

      return {
        shopId: normalizeText(shop.merchantId) || normalizeText(shop.shopName) || normalizeText(shop._id),
        contractSignedDate: openedDate
          ? resolveWuhanSalesOpenedDateKey(shop)
          : "",
        merchantId: normalizeText(shop.merchantId),
        shopName: normalizeText(shop.shopName),
        salesName: normalizeText(shop.salesName) || "未分配",
        totalAmount,
      } satisfies WuhanSalesShopDetailItem;
    })
    .sort(
      (left, right) =>
        right.totalAmount - left.totalAmount ||
        left.contractSignedDate.localeCompare(right.contractSignedDate) ||
        left.salesName.localeCompare(right.salesName, "zh-CN") ||
        left.shopName.localeCompare(right.shopName, "zh-CN")
    );

  return {
    summary: {
      totalShopCount: details.length,
      totalAmount: roundToTwo(
        details.reduce((sum, item) => sum + item.totalAmount, 0)
      ),
    },
    details,
  };
}
