import { buildConsecutiveDateKeys } from "@/lib/date-key-utils";
import { normalizeDateKey, normalizeText } from "@/lib/daily-point-derived";
import { DailyPointDetail } from "@/models/daily-point-detail";

export const LATEST_DAILY_POINT_WINDOW_DAYS = 2;

type LatestDailyPointShopRow = {
  merchantId?: string;
  storeId?: string;
  shopName?: string;
};

export type LatestDailyPointShopLookup = {
  latestDateKey: string;
  merchantIds: Set<string>;
  storeIds: Set<string>;
  shopNames: Set<string>;
};

export function pickLatestDailyPointDateKey(dateKeys: Array<string | null | undefined>) {
  const normalized = dateKeys
    .map((value) => normalizeDateKey(value))
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left));

  return normalized[0] ?? "";
}

export function buildLatestDailyPointWindowDateKeys(latestDateKey: string) {
  return buildConsecutiveDateKeys(latestDateKey, LATEST_DAILY_POINT_WINDOW_DAYS);
}

export function buildLatestDailyPointShopLookup(
  rows: LatestDailyPointShopRow[],
  latestDateKey = ""
): LatestDailyPointShopLookup {
  const merchantIds = new Set<string>();
  const storeIds = new Set<string>();
  const shopNames = new Set<string>();

  rows.forEach((row) => {
    const merchantId = normalizeText(row.merchantId);
    const storeId = normalizeText(row.storeId);
    const shopName = normalizeText(row.shopName);

    if (merchantId) {
      merchantIds.add(merchantId);
    }
    if (storeId) {
      storeIds.add(storeId);
    }
    if (shopName) {
      shopNames.add(shopName);
    }
  });

  return {
    latestDateKey,
    merchantIds,
    storeIds,
    shopNames,
  };
}

export async function fetchLatestDailyPointShopLookup() {
  const distinctDateKeys = await DailyPointDetail.distinct("recordDateKey", {
    recordDateKey: { $ne: "" },
  });
  const latestDateKey = pickLatestDailyPointDateKey(distinctDateKeys as string[]);
  const matchedDateKeys = buildLatestDailyPointWindowDateKeys(latestDateKey);

  if (matchedDateKeys.length === 0) {
    return buildLatestDailyPointShopLookup([], "");
  }

  const rows = await DailyPointDetail.find({
    recordDateKey: { $in: matchedDateKeys },
  })
    .select({ _id: 0, merchantId: 1, storeId: 1, shopName: 1 })
    .lean<LatestDailyPointShopRow[]>();

  return buildLatestDailyPointShopLookup(rows, latestDateKey);
}

export function matchesLatestDailyPointShop(
  lookup: LatestDailyPointShopLookup,
  shop: {
    merchantId?: string | null;
    shopName?: string | null;
  }
) {
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);

  if (merchantId && (lookup.merchantIds.has(merchantId) || lookup.storeIds.has(merchantId))) {
    return true;
  }

  if (shopName && lookup.shopNames.has(shopName)) {
    return true;
  }

  return false;
}
