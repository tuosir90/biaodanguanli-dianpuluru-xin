import { buildConsecutiveDateKeys } from "@/lib/date-key-utils";
import { normalizeDateKey, normalizeText } from "@/lib/daily-point-derived";
import { DailyPointDetail } from "@/models/daily-point-detail";

export const LATEST_DAILY_POINT_WINDOW_DAYS = 2;

type LatestDailyPointShopRow = {
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  recordDateKey?: string;
  amountValue?: number;
};

export type LatestDailyPointAmountInfo = {
  amount: number;
  dateKey: string;
};

export type LatestDailyPointShopLookup = {
  latestDateKey: string;
  merchantIds: Set<string>;
  storeIds: Set<string>;
  shopNames: Set<string>;
  amountInfoById: Map<string, LatestDailyPointAmountInfo>;
  amountInfoByShopName: Map<string, LatestDailyPointAmountInfo>;
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

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function upsertLatestAmountInfo(
  map: Map<string, LatestDailyPointAmountInfo>,
  key: string,
  row: LatestDailyPointShopRow
) {
  if (!key) return;
  const dateKey = normalizeDateKey(row.recordDateKey);
  if (!dateKey) return;

  const amount = roundToTwo(toFiniteNumber(row.amountValue));
  const current = map.get(key);
  if (!current || dateKey > current.dateKey) {
    map.set(key, { amount, dateKey });
    return;
  }

  if (dateKey === current.dateKey) {
    map.set(key, {
      amount: roundToTwo(current.amount + amount),
      dateKey,
    });
  }
}

export function buildLatestDailyPointShopLookup(
  rows: LatestDailyPointShopRow[],
  latestDateKey = ""
): LatestDailyPointShopLookup {
  const merchantIds = new Set<string>();
  const storeIds = new Set<string>();
  const shopNames = new Set<string>();
  const amountInfoById = new Map<string, LatestDailyPointAmountInfo>();
  const amountInfoByShopName = new Map<string, LatestDailyPointAmountInfo>();

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

    Array.from(new Set([merchantId, storeId].filter(Boolean))).forEach((id) => {
      upsertLatestAmountInfo(amountInfoById, id, row);
    });
    upsertLatestAmountInfo(amountInfoByShopName, shopName, row);
  });

  return {
    latestDateKey,
    merchantIds,
    storeIds,
    shopNames,
    amountInfoById,
    amountInfoByShopName,
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
    .select({ _id: 0, merchantId: 1, storeId: 1, shopName: 1, recordDateKey: 1, amountValue: 1 })
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

export function getLatestDailyPointAmountInfo(
  lookup: LatestDailyPointShopLookup,
  shop: {
    merchantId?: string | null;
    shopName?: string | null;
  }
) {
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);

  if (merchantId) {
    const matchedById = lookup.amountInfoById.get(merchantId);
    if (matchedById) return matchedById;
  }

  if (shopName) {
    return lookup.amountInfoByShopName.get(shopName) ?? null;
  }

  return null;
}

export function applyLatestDailyPointAmountToShops<
  T extends { merchantId?: string | null; shopName?: string | null },
>(shops: T[], lookup: LatestDailyPointShopLookup) {
  return shops.map((shop) => {
    const amountInfo = getLatestDailyPointAmountInfo(lookup, shop);
    if (!amountInfo) {
      return shop;
    }

    return {
      ...shop,
      latestDailyPointAmount: amountInfo.amount,
      latestDailyPointDateKey: amountInfo.dateKey,
    };
  });
}
