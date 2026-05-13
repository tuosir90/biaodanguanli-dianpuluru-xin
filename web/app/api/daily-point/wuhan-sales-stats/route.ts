import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { ensureMonthlyDailyPointDerivedPrepared } from "@/lib/daily-point-derived-prep";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";
import {
  buildWuhanSalesAccumulatedShopCohort,
  buildWuhanSalesDetailFilterSets,
} from "@/features/wuhan-sales-stats/cohort";
import {
  WUHAN_SALES_STATS_MIN_DATE_KEY,
  buildWuhanSalesStatsMonthRange,
  getWuhanSalesStatsMinStartDate,
  isWuhanSalesStatsAllValue,
  normalizeWuhanSalesStatsMonth,
  shiftWuhanSalesStatsDateKey,
} from "@/features/wuhan-sales-stats/month";
import { buildWuhanSalesStatsReport } from "@/features/wuhan-sales-stats/report";
import type { WuhanSalesStatsResponse } from "@/features/wuhan-sales-stats/types";

export const maxDuration = 30;
const WUHAN_SALES_STATS_CACHE_NAMESPACE = "wuhan-sales";

function currentMonth() {
  const now = new Date();
  return normalizeWuhanSalesStatsMonth(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatYearMonth(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function findLatestMonthlyDailyPointDateKey(
  startDateKey: string,
  endDateKey: string
) {
  const [meituanLatest, elemeLatest] = await Promise.all([
    DailyPointDetail.findOne({
      platform: "meituan",
      recordDateKey: { $gte: startDateKey, $lte: endDateKey },
    })
      .sort({ recordDateKey: -1, importedAt: -1, updatedAt: -1 })
      .select({ _id: 0, recordDateKey: 1 })
      .lean<{ recordDateKey?: string } | null>(),
    DailyPointDetail.findOne({
      platform: "eleme",
      recordDateKey: { $gte: startDateKey, $lte: endDateKey },
    })
      .sort({ recordDateKey: -1, importedAt: -1, updatedAt: -1 })
      .select({ _id: 0, recordDateKey: 1 })
      .lean<{ recordDateKey?: string } | null>(),
  ]);

  return [
    normalizeText(meituanLatest?.recordDateKey),
    normalizeText(elemeLatest?.recordDateKey),
  ]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? "";
}

async function findLatestDailyPointDateKey() {
  const [meituanLatest, elemeLatest] = await Promise.all([
    DailyPointDetail.findOne({
      platform: "meituan",
      recordDateKey: { $ne: "" },
    })
      .sort({ recordDateKey: -1, importedAt: -1, updatedAt: -1 })
      .select({ _id: 0, recordDateKey: 1 })
      .lean<{ recordDateKey?: string } | null>(),
    DailyPointDetail.findOne({
      platform: "eleme",
      recordDateKey: { $ne: "" },
    })
      .sort({ recordDateKey: -1, importedAt: -1, updatedAt: -1 })
      .select({ _id: 0, recordDateKey: 1 })
      .lean<{ recordDateKey?: string } | null>(),
  ]);

  return [
    normalizeText(meituanLatest?.recordDateKey),
    normalizeText(elemeLatest?.recordDateKey),
  ]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const month = normalizeWuhanSalesStatsMonth(
      request.nextUrl.searchParams.get("month") ?? currentMonth()
    );
    const cachedPayload = getCachedReportPayload<WuhanSalesStatsResponse>(
      WUHAN_SALES_STATS_CACHE_NAMESPACE,
      month
    );
    if (cachedPayload) {
      return NextResponse.json(cachedPayload, {
        headers: REPORT_READ_RESPONSE_HEADERS,
      });
    }

    await connectMongo();
    const allMode = isWuhanSalesStatsAllValue(month);
    const monthRange = allMode ? null : buildWuhanSalesStatsMonthRange(month);
    if (!allMode && !monthRange) {
      return NextResponse.json(
        { message: "month 参数无效" },
        { status: 400, headers: REPORT_READ_RESPONSE_HEADERS }
      );
    }
    const nextMonth = monthRange ? formatYearMonth(monthRange.end) : "";

    const prepareTasks: Promise<unknown>[] = [];
    if (!allMode) {
      prepareTasks.push(
        ensureMonthlyDailyPointDerivedPrepared("meituan", month),
        ensureMonthlyDailyPointDerivedPrepared("eleme", month)
      );
    }
    if (!allMode && nextMonth) {
      prepareTasks.push(
        ensureMonthlyDailyPointDerivedPrepared("meituan", nextMonth),
        ensureMonthlyDailyPointDerivedPrepared("eleme", nextMonth)
      );
    }
    await Promise.all(prepareTasks);

    const [shops, latestDailyPointDateKey] = await Promise.all([
      Shop.find({
        $and: [
          {
            $or: [
              {
                entryDate: {
                  $gte: getWuhanSalesStatsMinStartDate(),
                  ...(monthRange ? { $lt: monthRange.end } : {}),
                },
              },
              {
                contractSignedDate: {
                  $gte: getWuhanSalesStatsMinStartDate(),
                  ...(monthRange ? { $lt: monthRange.end } : {}),
                },
              },
            ],
          },
          {
            $or: [{ salesName: { $ne: "" } }, { salesCity: { $ne: "" } }],
          },
        ],
      })
        .select({
          _id: 1,
          shopName: 1,
          merchantId: 1,
          deliveryPlatform: 1,
          salesName: 1,
          salesCity: 1,
          entryDate: 1,
          contractSignedDate: 1,
        })
        .lean(),
      allMode
        ? findLatestDailyPointDateKey()
        : findLatestMonthlyDailyPointDateKey(
            monthRange!.startDateKey,
            monthRange!.endDateKey
          ),
    ]);

    const allEligibleShops = shops.map((shop) => ({
      _id: String(shop._id),
      shopName: shop.shopName,
      merchantId: shop.merchantId,
      deliveryPlatform: shop.deliveryPlatform,
      salesName: shop.salesName,
      salesCity: shop.salesCity,
      entryDate: shop.entryDate,
      contractSignedDate: shop.contractSignedDate,
    }));
    const accumulatedShops = buildWuhanSalesAccumulatedShopCohort(allEligibleShops);
    const { detailFilters } = buildWuhanSalesDetailFilterSets(accumulatedShops);
    const detailStartDateKey = monthRange?.startDateKey ?? WUHAN_SALES_STATS_MIN_DATE_KEY;
    const detailFetchEndDateKey =
      monthRange?.endDateKey
        ? shiftWuhanSalesStatsDateKey(monthRange.endDateKey, 1)
        : latestDailyPointDateKey || detailStartDateKey;

    const dailyDetails =
      detailFilters.length > 0
        ? await DailyPointDetail.find({
            recordDateKey: {
              $gte: detailStartDateKey,
              $lte: detailFetchEndDateKey,
            },
            $or: detailFilters,
          })
            .select({
              _id: 0,
              platform: 1,
              merchantId: 1,
              storeId: 1,
              shopName: 1,
              recordDate: 1,
              recordDateKey: 1,
              amountValue: 1,
              rowData: 1,
            })
            .lean()
        : [];

    const report = buildWuhanSalesStatsReport({
      month,
      shops: accumulatedShops,
      dailyDetails,
      latestDailyPointDateKey,
    });

    const payload: WuhanSalesStatsResponse = {
      month,
      summary: report.summary,
      dailyStats: report.dailyStats,
    };

    setCachedReportPayload(WUHAN_SALES_STATS_CACHE_NAMESPACE, month, payload);

    return NextResponse.json(payload, {
      headers: REPORT_READ_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "武汉销售数据统计加载失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: REPORT_READ_RESPONSE_HEADERS }
    );
  }
}
