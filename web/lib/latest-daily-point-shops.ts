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

type DailyPointPlatform = "meituan" | "eleme";

export type DailyPointTotalAmountShopSource = {
  _id?: unknown;
  merchantId?: string | null;
  shopName?: string | null;
  deliveryPlatform?: string | null;
};

export type DailyPointTotalAmountRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
};

export type DailyPointTotalAmountInfo = {
  totalAmount: number;
};

export type DailyPointTotalAmountLookup = {
  byId: Record<DailyPointPlatform, Map<string, DailyPointTotalAmountInfo>>;
  byShopName: Record<DailyPointPlatform, Map<string, DailyPointTotalAmountInfo>>;
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

function normalizeDailyPointPlatform(deliveryPlatform: unknown): DailyPointPlatform {
  return normalizeText(deliveryPlatform).includes("饿了么") ? "eleme" : "meituan";
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

function incrementTotalAmount(
  map: Map<string, DailyPointTotalAmountInfo>,
  key: string,
  amount: number
) {
  if (!key) return;
  const current = map.get(key)?.totalAmount ?? 0;
  map.set(key, { totalAmount: roundToTwo(current + amount) });
}

function buildEmptyTotalAmountLookup(): DailyPointTotalAmountLookup {
  return {
    byId: {
      meituan: new Map<string, DailyPointTotalAmountInfo>(),
      eleme: new Map<string, DailyPointTotalAmountInfo>(),
    },
    byShopName: {
      meituan: new Map<string, DailyPointTotalAmountInfo>(),
      eleme: new Map<string, DailyPointTotalAmountInfo>(),
    },
  };
}

export function buildDailyPointTotalAmountLookup(params: {
  shops: DailyPointTotalAmountShopSource[];
  dailyDetails: DailyPointTotalAmountRow[];
}) {
  const lookup = buildEmptyTotalAmountLookup();
  const platformsById = {
    meituan: new Set<string>(),
    eleme: new Set<string>(),
  };
  const platformsByShopName = {
    meituan: new Set<string>(),
    eleme: new Set<string>(),
  };

  params.shops.forEach((shop) => {
    const platform = normalizeDailyPointPlatform(shop.deliveryPlatform);
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    if (merchantId) platformsById[platform].add(merchantId);
    if (shopName) platformsByShopName[platform].add(shopName);
  });

  params.dailyDetails.forEach((row) => {
    const platform = normalizeText(row.platform) as DailyPointPlatform;
    if (platform !== "meituan" && platform !== "eleme") return;

    const amount = toFiniteNumber(row.amountValue);
    const merchantId = normalizeText(row.merchantId);
    const storeId = normalizeText(row.storeId);
    const shopName = normalizeText(row.shopName);

    Array.from(new Set([merchantId, storeId].filter(Boolean))).forEach((id) => {
      if (platformsById[platform].has(id)) {
        incrementTotalAmount(lookup.byId[platform], id, amount);
      }
    });

    if (platformsByShopName[platform].has(shopName)) {
      incrementTotalAmount(lookup.byShopName[platform], shopName, amount);
    }
  });

  return lookup;
}

export async function fetchDailyPointTotalAmountLookup(
  shops: DailyPointTotalAmountShopSource[]
) {
  if (shops.length === 0) {
    return buildEmptyTotalAmountLookup();
  }

  const groups = {
    meituan: {
      merchantIds: new Set<string>(),
      shopNames: new Set<string>(),
    },
    eleme: {
      merchantIds: new Set<string>(),
      shopNames: new Set<string>(),
    },
  };

  shops.forEach((shop) => {
    const platform = normalizeDailyPointPlatform(shop.deliveryPlatform);
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    if (merchantId) groups[platform].merchantIds.add(merchantId);
    if (shopName) groups[platform].shopNames.add(shopName);
  });

  const rowFilters: Record<string, unknown>[] = [];
  (["meituan", "eleme"] as const).forEach((platform) => {
    const merchantIds = Array.from(groups[platform].merchantIds);
    const shopNames = Array.from(groups[platform].shopNames);
    const identityFilter: Record<string, unknown>[] = [];
    if (merchantIds.length > 0) {
      identityFilter.push({ merchantId: { $in: merchantIds } });
      identityFilter.push({ storeId: { $in: merchantIds } });
    }
    if (shopNames.length > 0) {
      identityFilter.push({ shopName: { $in: shopNames } });
    }
    if (identityFilter.length === 0) return;

    rowFilters.push({
      platform,
      $or: identityFilter,
    });
  });

  const dailyDetails =
    rowFilters.length > 0
      ? await DailyPointDetail.aggregate<DailyPointTotalAmountRow>([
          { $match: { $or: rowFilters } },
          {
            $project: {
              _id: 0,
              platform: 1,
              merchantId: 1,
              storeId: 1,
              shopName: 1,
              amountValue: 1,
            },
          },
        ])
      : [];

  return buildDailyPointTotalAmountLookup({ shops, dailyDetails });
}

export function getDailyPointTotalAmountInfo(
  lookup: DailyPointTotalAmountLookup,
  shop: DailyPointTotalAmountShopSource
) {
  const platform = normalizeDailyPointPlatform(shop.deliveryPlatform);
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);

  if (merchantId) {
    const matchedById = lookup.byId[platform].get(merchantId);
    if (matchedById) return matchedById;
  }

  if (shopName) {
    return lookup.byShopName[platform].get(shopName) ?? null;
  }

  return null;
}

export function applyDailyPointTotalAmountToShops<
  T extends DailyPointTotalAmountShopSource,
>(shops: T[], lookup: DailyPointTotalAmountLookup) {
  return shops.map((shop) => {
    const amountInfo = getDailyPointTotalAmountInfo(lookup, shop);
    if (!amountInfo) {
      return shop;
    }

    return {
      ...shop,
      dailyPointTotalAmount: amountInfo.totalAmount,
    };
  });
}
