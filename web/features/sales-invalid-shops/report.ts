import {
  buildInvalidShopDetail,
  type SalesInvalidLatestAvailableDateKeys,
  buildTerminatedWithinDaysDetail,
  mergeFinalShopDetails,
  sortSalesInvalidDetails,
  type SalesInvalidDailyPointRow,
  type SalesInvalidShopSourceRow,
} from "./detail-builders";
import { formatShanghaiDate, parseDate } from "./shared";
import type {
  SalesInvalidShopDetailItem,
  SalesInvalidShopSummaryItem,
  SalesInvalidShopsReportResult,
} from "./types";

export function filterSalesInvalidShopsBySignedMonth(
  month: string,
  shops: SalesInvalidShopSourceRow[]
) {
  return shops.filter((shop) => {
    const contractSignedDate = parseDate(shop.contractSignedDate);
    if (!contractSignedDate) return false;
    return formatShanghaiDate(contractSignedDate).startsWith(`${month}-`);
  });
}

function buildSummary(
  monthlyShops: SalesInvalidShopSourceRow[],
  invalidDetails: SalesInvalidShopDetailItem[],
  terminatedDetails: SalesInvalidShopDetailItem[],
  finalDetails: SalesInvalidShopDetailItem[]
) {
  const summaryMap = new Map<string, SalesInvalidShopSummaryItem>();

  monthlyShops.forEach((shop) => {
    const salesName = shop.salesName?.trim() || "未分配";
    const previous = summaryMap.get(salesName) ?? {
      salesName,
      totalSignedShopCount: 0,
      invalidShopCount: 0,
      terminatedWithinDaysCount: 0,
      finalShopCount: 0,
    };

    summaryMap.set(salesName, {
      ...previous,
      totalSignedShopCount: previous.totalSignedShopCount + 1,
    });
  });

  invalidDetails.forEach((detail) => {
    const previous = summaryMap.get(detail.salesName);
    if (!previous) return;
    previous.invalidShopCount += 1;
  });

  terminatedDetails.forEach((detail) => {
    const previous = summaryMap.get(detail.salesName);
    if (!previous) return;
    previous.terminatedWithinDaysCount += 1;
  });

  finalDetails.forEach((detail) => {
    const previous = summaryMap.get(detail.salesName);
    if (!previous) return;
    previous.finalShopCount += 1;
  });

  return Array.from(summaryMap.values()).sort(
    (left, right) =>
      right.finalShopCount - left.finalShopCount ||
      right.invalidShopCount - left.invalidShopCount ||
      right.terminatedWithinDaysCount - left.terminatedWithinDaysCount ||
      right.totalSignedShopCount - left.totalSignedShopCount ||
      left.salesName.localeCompare(right.salesName, "zh-CN")
  );
}

export function buildSalesInvalidShopsReport(params: {
  month: string;
  shops: SalesInvalidShopSourceRow[];
  dailyDetails: SalesInvalidDailyPointRow[];
  latestAvailableDateKeys?: SalesInvalidLatestAvailableDateKeys;
}): SalesInvalidShopsReportResult {
  const monthlyShops = filterSalesInvalidShopsBySignedMonth(
    params.month,
    params.shops
  );

  const invalidDetails = sortSalesInvalidDetails(
    monthlyShops
      .map((shop) =>
        buildInvalidShopDetail(
          shop,
          params.dailyDetails,
          params.latestAvailableDateKeys
        )
      )
      .filter((item): item is SalesInvalidShopDetailItem => item !== null)
  );

  const terminatedWithinDaysDetails = sortSalesInvalidDetails(
    monthlyShops
      .map((shop) => buildTerminatedWithinDaysDetail(shop))
      .filter((item): item is SalesInvalidShopDetailItem => item !== null)
  );

  const finalDetails = sortSalesInvalidDetails(
    mergeFinalShopDetails(invalidDetails, terminatedWithinDaysDetails)
  );

  return {
    summary: buildSummary(
      monthlyShops,
      invalidDetails,
      terminatedWithinDaysDetails,
      finalDetails
    ),
    invalidDetails,
    terminatedWithinDaysDetails,
    finalDetails,
  };
}
