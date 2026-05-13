import { resolveSalesCity } from "@/lib/sales-city";
import { WUHAN_SALES_STATS_MIN_DATE_KEY } from "./month";
import { resolveWuhanSalesOpenedDateKey } from "./opened-date";

export type WuhanSalesShopRow = {
  _id: string;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  salesName?: string;
  salesCity?: string;
  entryDate?: Date | string;
  contractSignedDate?: Date | string;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function buildWuhanSalesSignedShopCohort(params: {
  month: string;
  shops: WuhanSalesShopRow[];
}) {
  return params.shops.filter((shop) => {
    if (resolveSalesCity(shop.salesName, shop.salesCity) !== "武汉") {
      return false;
    }

    const openedDateKey = resolveWuhanSalesOpenedDateKey(shop);
    if (!openedDateKey) {
      return false;
    }

    return (
      openedDateKey >= WUHAN_SALES_STATS_MIN_DATE_KEY &&
      openedDateKey.startsWith(`${params.month}-`)
    );
  });
}

export function buildWuhanSalesAccumulatedShopCohort(shops: WuhanSalesShopRow[]) {
  return shops.filter((shop) => {
    if (resolveSalesCity(shop.salesName, shop.salesCity) !== "武汉") {
      return false;
    }

    const openedDateKey = resolveWuhanSalesOpenedDateKey(shop);
    if (!openedDateKey) {
      return false;
    }

    return openedDateKey >= WUHAN_SALES_STATS_MIN_DATE_KEY;
  });
}

export function buildWuhanSalesDetailFilterSets(shops: WuhanSalesShopRow[]) {
  const merchantIds = Array.from(
    new Set(shops.map((shop) => normalizeText(shop.merchantId)).filter(Boolean))
  );
  const shopNames = Array.from(
    new Set(shops.map((shop) => normalizeText(shop.shopName)).filter(Boolean))
  );
  const detailFilters: Array<Record<string, unknown>> = [];

  if (merchantIds.length > 0) {
    detailFilters.push({ merchantId: { $in: merchantIds } });
    detailFilters.push({ storeId: { $in: merchantIds } });
  }

  if (shopNames.length > 0) {
    detailFilters.push({ shopName: { $in: shopNames } });
  }

  return {
    merchantIds,
    shopNames,
    detailFilters,
  };
}
