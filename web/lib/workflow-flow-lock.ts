import { DailyPointDetail } from "@/models/daily-point-detail";

type WorkflowFlowLockPlatform = "meituan" | "eleme";

export const LOW_REVENUE_LOCK_WINDOW_DAYS = 4;
export const LOW_REVENUE_LOCK_THRESHOLD_AMOUNT = 1;
export const LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS = [
  "dish_1_10",
  "dish_11_20",
  "dish_21_30",
  "dish_31_40",
  "dish_40_plus",
] as const;

export type WorkflowFlowLockShopSource = {
  _id: unknown;
  merchantId?: string;
  shopName?: string;
  deliveryPlatform?: string;
  contractSignedDate?: Date | string;
};

export type WorkflowFlowLockDailyPointRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  recordDateKey?: string;
  amountValue?: number;
};

export type WorkflowFlowLockInfo = {
  lockedProgressKeys: string[];
  reasonText: string;
  totalAmount: number;
  latestDateKey: string;
  windowDateKeys: string[];
};

export type WorkflowFlowLockLookup = Record<string, WorkflowFlowLockInfo>;

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function parseDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateKey: string, offset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";

  const dateValue = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  dateValue.setUTCDate(dateValue.getUTCDate() + offset);

  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pickLatestDateKey(dateKeys: string[]) {
  return Array.from(
    new Set(dateKeys.map((item) => normalizeText(item)).filter(Boolean))
  ).sort((left, right) => right.localeCompare(left))[0] ?? "";
}

export function normalizeWorkflowShopPlatform(
  deliveryPlatform: unknown
): WorkflowFlowLockPlatform {
  return normalizeText(deliveryPlatform).includes("饿了么") ? "eleme" : "meituan";
}

function buildAmountLookup(rows: WorkflowFlowLockDailyPointRow[]) {
  const rowsById = new Map<string, WorkflowFlowLockDailyPointRow[]>();
  const rowsByShopName = new Map<string, WorkflowFlowLockDailyPointRow[]>();

  rows.forEach((row) => {
    const identityValues = Array.from(
      new Set([normalizeText(row.merchantId), normalizeText(row.storeId)].filter(Boolean))
    );
    identityValues.forEach((identity) => {
      const existing = rowsById.get(identity) ?? [];
      existing.push(row);
      rowsById.set(identity, existing);
    });

    const shopName = normalizeText(row.shopName);
    if (shopName) {
      const existing = rowsByShopName.get(shopName) ?? [];
      existing.push(row);
      rowsByShopName.set(shopName, existing);
    }
  });

  return { rowsById, rowsByShopName };
}

function buildShopLockWindow(
  contractSignedDate: unknown,
  latestDateKey: string
) {
  const parsedDate = parseDate(contractSignedDate);
  if (!parsedDate) {
    return null;
  }

  const contractDateKey = formatDateKey(parsedDate);
  const windowStartDateKey = addDays(contractDateKey, 1);
  if (!windowStartDateKey) {
    return null;
  }

  const windowDateKeys = Array.from(
    { length: LOW_REVENUE_LOCK_WINDOW_DAYS },
    (_, index) => addDays(windowStartDateKey, index)
  ).filter(Boolean);
  const windowEndDateKey =
    windowDateKeys[windowDateKeys.length - 1] ?? windowStartDateKey;

  if (!latestDateKey || latestDateKey < windowEndDateKey) {
    return null;
  }

  return {
    latestDateKey,
    windowDateKeys,
  };
}

export function buildWorkflowFlowLockLookup(params: {
  shops: WorkflowFlowLockShopSource[];
  availableDateKeysByPlatform: Partial<Record<WorkflowFlowLockPlatform, string[]>>;
  dailyDetails: WorkflowFlowLockDailyPointRow[];
}) {
  const latestDateKeysByPlatform = {
    meituan: pickLatestDateKey(params.availableDateKeysByPlatform.meituan ?? []),
    eleme: pickLatestDateKey(params.availableDateKeysByPlatform.eleme ?? []),
  };
  const platformLookups = {
    meituan: buildAmountLookup(
      params.dailyDetails.filter((row) => normalizeText(row.platform) === "meituan")
    ),
    eleme: buildAmountLookup(
      params.dailyDetails.filter((row) => normalizeText(row.platform) === "eleme")
    ),
  };

  return params.shops.reduce<WorkflowFlowLockLookup>((lookup, shop) => {
    const platform = normalizeWorkflowShopPlatform(shop.deliveryPlatform);
    const windowInfo = buildShopLockWindow(
      shop.contractSignedDate,
      latestDateKeysByPlatform[platform]
    );
    if (!windowInfo) {
      return lookup;
    }

    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    if (!merchantId && !shopName) {
      return lookup;
    }

    const amountLookup = platformLookups[platform];
    const windowDateSet = new Set(windowInfo.windowDateKeys);
    const matchedRows =
      merchantId && (amountLookup.rowsById.get(merchantId)?.length ?? 0) > 0
        ? amountLookup.rowsById.get(merchantId) ?? []
        : shopName
          ? amountLookup.rowsByShopName.get(shopName) ?? []
          : [];
    const totalAmount = roundToTwo(
      matchedRows
        .filter((row) => windowDateSet.has(normalizeText(row.recordDateKey)))
        .reduce((sum, row) => sum + toFiniteNumber(row.amountValue), 0)
    );

    if (totalAmount >= LOW_REVENUE_LOCK_THRESHOLD_AMOUNT) {
      return lookup;
    }

    lookup[String(shop._id)] = {
      lockedProgressKeys: [...LOW_REVENUE_FULL_IMAGE_LOCK_PROGRESS_KEYS],
      reasonText: `签约次日起连续${LOW_REVENUE_LOCK_WINDOW_DAYS}天总回款 ${totalAmount.toFixed(
        2
      )} 元，低于 ${LOW_REVENUE_LOCK_THRESHOLD_AMOUNT} 元，已锁定全店图`,
      totalAmount,
      latestDateKey: windowInfo.latestDateKey,
      windowDateKeys: [...windowInfo.windowDateKeys],
    };
    return lookup;
  }, {});
}

export async function fetchWorkflowFlowLockLookup(
  shops: WorkflowFlowLockShopSource[]
) {
  if (shops.length === 0) {
    return {} as WorkflowFlowLockLookup;
  }

  const platformGroups = {
    meituan: {
      merchantIds: new Set<string>(),
      shopNames: new Set<string>(),
      windowDateKeys: new Set<string>(),
    },
    eleme: {
      merchantIds: new Set<string>(),
      shopNames: new Set<string>(),
      windowDateKeys: new Set<string>(),
    },
  };

  const [meituanDateKeys, elemeDateKeys] = await Promise.all([
    DailyPointDetail.distinct("recordDateKey", {
      platform: "meituan",
      recordDateKey: { $ne: "" },
    }),
    DailyPointDetail.distinct("recordDateKey", {
      platform: "eleme",
      recordDateKey: { $ne: "" },
    }),
  ]);

  const availableDateKeysByPlatform = {
    meituan: meituanDateKeys as string[],
    eleme: elemeDateKeys as string[],
  };
  const latestDateKeysByPlatform = {
    meituan: pickLatestDateKey(availableDateKeysByPlatform.meituan),
    eleme: pickLatestDateKey(availableDateKeysByPlatform.eleme),
  };

  shops.forEach((shop) => {
    const platform = normalizeWorkflowShopPlatform(shop.deliveryPlatform);
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    if (merchantId) platformGroups[platform].merchantIds.add(merchantId);
    if (shopName) platformGroups[platform].shopNames.add(shopName);

    const windowInfo = buildShopLockWindow(
      shop.contractSignedDate,
      latestDateKeysByPlatform[platform]
    );
    if (!windowInfo) {
      return;
    }

    windowInfo.windowDateKeys.forEach((dateKey) => {
      platformGroups[platform].windowDateKeys.add(dateKey);
    });
  });

  const rowFilters: Record<string, unknown>[] = [];
  (["meituan", "eleme"] as const).forEach((platform) => {
    const windowDateKeys = Array.from(platformGroups[platform].windowDateKeys);
    if (windowDateKeys.length === 0) return;

    const merchantIds = Array.from(platformGroups[platform].merchantIds);
    const shopNames = Array.from(platformGroups[platform].shopNames);
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
      recordDateKey: { $in: windowDateKeys },
      $or: identityFilter,
    });
  });

  const dailyDetails =
    rowFilters.length > 0
      ? await DailyPointDetail.aggregate<WorkflowFlowLockDailyPointRow>([
          { $match: { $or: rowFilters } },
          {
            $project: {
              _id: 0,
              platform: 1,
              merchantId: 1,
              storeId: 1,
              shopName: 1,
              recordDateKey: 1,
              amountValue: 1,
            },
          },
        ])
      : [];

  return buildWorkflowFlowLockLookup({
    shops,
    availableDateKeysByPlatform,
    dailyDetails,
  });
}

export function applyWorkflowFlowLockToShops<T extends { _id: unknown }>(
  shops: T[],
  lookup: WorkflowFlowLockLookup
) {
  return shops.map((shop) => {
    const lockInfo = lookup[String(shop._id)];
    if (!lockInfo) {
      return shop;
    }

    return {
      ...shop,
      flowLockedProgressKeys: [...lockInfo.lockedProgressKeys],
      flowLockReasonText: lockInfo.reasonText,
      flowLockAmount: lockInfo.totalAmount,
      flowLockDateKeys: [...lockInfo.windowDateKeys],
    };
  });
}
