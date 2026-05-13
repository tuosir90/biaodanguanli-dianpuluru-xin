import {
  SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS,
  SALES_INVALID_SHOPS_THRESHOLD_AMOUNT,
} from "./constants";
import {
  buildShopDetailKey,
  buildSignedWindow,
  formatShanghaiDate,
  normalizePlatform,
  normalizeText,
  parseDate,
  roundToTwo,
} from "./shared";
import type {
  SalesInvalidShopDetailItem,
  SalesInvalidShopReasonType,
} from "./types";

export type SalesInvalidShopSourceRow = {
  _id: string;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  city?: string;
  salesName?: string;
  operatorName?: string;
  contractSignedDate?: Date | string;
  shopStatus?: string;
  terminationDate?: Date | string | null;
  terminationCooperationDays?: number | null;
};

export type SalesInvalidDailyPointRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  recordDateKey?: string;
  amountValue?: number;
};

export type SalesInvalidLatestAvailableDateKeys = Partial<
  Record<"meituan" | "eleme", string>
>;

function buildBaseDetail(shop: SalesInvalidShopSourceRow) {
  const contractSignedDate = parseDate(shop.contractSignedDate);
  if (!contractSignedDate) return null;

  const shopName = normalizeText(shop.shopName);
  const merchantId = normalizeText(shop.merchantId);
  const shopId = buildShopDetailKey(
    normalizeText(shop._id),
    merchantId,
    shopName
  );

  return {
    shopId,
    shopName,
    merchantId,
    deliveryPlatform: normalizeText(shop.deliveryPlatform),
    city: normalizeText(shop.city),
    salesName: normalizeText(shop.salesName) || "未分配",
    operatorName: normalizeText(shop.operatorName) || "未分配",
    contractSignedDate: formatShanghaiDate(contractSignedDate),
  };
}

export function buildInvalidShopDetail(
  shop: SalesInvalidShopSourceRow,
  dailyDetails: SalesInvalidDailyPointRow[],
  latestAvailableDateKeys: SalesInvalidLatestAvailableDateKeys = {}
): SalesInvalidShopDetailItem | null {
  const baseDetail = buildBaseDetail(shop);
  if (!baseDetail) return null;

  const signedWindow = buildSignedWindow(baseDetail.contractSignedDate);
  const windowEndDate =
    signedWindow[signedWindow.length - 1] || baseDetail.contractSignedDate;
  const signedWindowSet = new Set(signedWindow);
  const platform = normalizePlatform(shop.deliveryPlatform);
  const latestAvailableDateKey = normalizeText(latestAvailableDateKeys[platform]);

  if (!latestAvailableDateKey || latestAvailableDateKey < windowEndDate) {
    return null;
  }

  const platformRows = dailyDetails.filter(
    (row) => normalizeText(row.platform) === platform
  );

  const idMatchedRows = baseDetail.merchantId
    ? platformRows.filter((row) => {
        const rowMerchantId = normalizeText(row.merchantId);
        const rowStoreId = normalizeText(row.storeId);
        return (
          rowMerchantId === baseDetail.merchantId ||
          rowStoreId === baseDetail.merchantId
        );
      })
    : [];

  const nameMatchedRows =
    idMatchedRows.length === 0 && baseDetail.shopName
      ? platformRows.filter(
          (row) => normalizeText(row.shopName) === baseDetail.shopName
        )
      : [];

  const matchedRows = idMatchedRows.length > 0 ? idMatchedRows : nameMatchedRows;
  const windowTotalAmount = roundToTwo(
    matchedRows
      .filter((row) => signedWindowSet.has(normalizeText(row.recordDateKey)))
      .reduce((sum, row) => sum + Number(row.amountValue ?? 0), 0)
  );

  if (windowTotalAmount !== SALES_INVALID_SHOPS_THRESHOLD_AMOUNT) {
    return null;
  }

  const matchStrategy =
    idMatchedRows.length > 0
      ? "商家ID/门店ID匹配"
      : nameMatchedRows.length > 0
        ? "店铺名匹配"
        : "未匹配到抽点明细";

  return {
    ...baseDetail,
    windowStartDate: baseDetail.contractSignedDate,
    windowEndDate,
    windowTotalAmount,
    matchStrategy,
    terminationDate: "",
    terminationCooperationDays: null,
    resultType: "invalid" as const,
    reasonTypes: ["invalid"] as SalesInvalidShopReasonType[],
    reasonText: "无效店铺",
  } satisfies SalesInvalidShopDetailItem;
}

export function buildTerminatedWithinDaysDetail(
  shop: SalesInvalidShopSourceRow
): SalesInvalidShopDetailItem | null {
  const baseDetail = buildBaseDetail(shop);
  if (!baseDetail) return null;

  const terminationDate = parseDate(shop.terminationDate);
  const terminationCooperationDays = Number(shop.terminationCooperationDays);
  const normalizedDays = Number.isFinite(terminationCooperationDays)
    ? terminationCooperationDays
    : null;

  if (!terminationDate || normalizedDays === null) {
    return null;
  }

  if (normalizedDays > SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS) {
    return null;
  }

  return {
    ...baseDetail,
    windowStartDate: "",
    windowEndDate: "",
    windowTotalAmount: null,
    matchStrategy: "",
    terminationDate: formatShanghaiDate(terminationDate),
    terminationCooperationDays: normalizedDays,
    resultType: "terminated" as const,
    reasonTypes: ["terminated_within_days"] as SalesInvalidShopReasonType[],
    reasonText: `${SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS}天内解约`,
  } satisfies SalesInvalidShopDetailItem;
}

function buildReasonText(reasonTypes: SalesInvalidShopReasonType[]) {
  const labels = reasonTypes.map((item) =>
    item === "invalid"
      ? "无效店铺"
      : `${SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS}天内解约`
  );
  return labels.join(" + ");
}

export function mergeFinalShopDetails(
  invalidDetails: SalesInvalidShopDetailItem[],
  terminatedWithinDaysDetails: SalesInvalidShopDetailItem[]
) {
  const mergedMap = new Map<string, SalesInvalidShopDetailItem>();

  [...invalidDetails, ...terminatedWithinDaysDetails].forEach((detail) => {
    const existing = mergedMap.get(detail.shopId);
    if (!existing) {
      mergedMap.set(detail.shopId, {
        ...detail,
        resultType: "final",
      });
      return;
    }

    const reasonTypes = Array.from(
      new Set([...existing.reasonTypes, ...detail.reasonTypes])
    ).sort();

    mergedMap.set(detail.shopId, {
      ...existing,
      windowStartDate: existing.windowStartDate || detail.windowStartDate,
      windowEndDate: existing.windowEndDate || detail.windowEndDate,
      windowTotalAmount:
        existing.windowTotalAmount ?? detail.windowTotalAmount ?? null,
      matchStrategy: existing.matchStrategy || detail.matchStrategy,
      terminationDate: existing.terminationDate || detail.terminationDate,
      terminationCooperationDays:
        existing.terminationCooperationDays ?? detail.terminationCooperationDays,
      resultType: "final",
      reasonTypes,
      reasonText: buildReasonText(reasonTypes),
    });
  });

  return Array.from(mergedMap.values());
}

export function sortSalesInvalidDetails(details: SalesInvalidShopDetailItem[]) {
  return [...details].sort(
    (left, right) =>
      left.salesName.localeCompare(right.salesName, "zh-CN") ||
      left.contractSignedDate.localeCompare(right.contractSignedDate) ||
      left.shopName.localeCompare(right.shopName, "zh-CN")
  );
}
