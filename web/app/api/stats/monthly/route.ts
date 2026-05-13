import { NextRequest, NextResponse } from "next/server";
import {
  extractDailyPointAmount,
  normalizeDateKey,
  type DailyPointPlatform,
} from "@/lib/daily-point-derived";
import {
  buildDailyCountTrendSeries,
  type DailyTrendSeries,
} from "@/lib/daily-trend-series";
import { buildSalesCityShopTrend } from "@/features/stats/sales-city-trend";
import {
  buildDailyPointRelatedShopFilter,
  buildDailyPointTrends,
  type DailyPointTrendDetail,
  type DailyPointTrendShop,
} from "@/features/stats/daily-point-trends";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

type MonthlyTrendItem = {
  name?: string;
  date?: string;
  count: number;
};

type StatsMonthlyPayload = {
  month: string;
  monthlyShopCount: number;
  dailyOrderShopTrend: MonthlyTrendItem[];
  operatorShopTrend: MonthlyTrendItem[];
  salesShopTrend: MonthlyTrendItem[];
  salesCityShopTrend: MonthlyTrendItem[];
  operatorTerminationTrend: MonthlyTrendItem[];
  meituanDailyTerminationShopTrend: DailyTrendSeries[];
  elemeDailyTerminationShopTrend: DailyTrendSeries[];
  meituanDailyPointShopTrend: DailyTrendSeries[];
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointShopTrend: DailyTrendSeries[];
  elemeDailyPointAmountTrend: DailyTrendSeries[];
};

const DERIVED_PREPARED_TTL_MS = 30 * 60 * 1000;
const monthlyDerivedPreparedCache = new Map<string, number>();
const IS_DEV = process.env.NODE_ENV !== "production";
const STATS_MONTHLY_CACHE_NAMESPACE = "stats-monthly";

function debugStatsLog(message: string, payload?: Record<string, unknown>) {
  if (!IS_DEV) return;

  if (payload) {
    console.info(`[stats/monthly] ${message}`, payload);
    return;
  }

  console.info(`[stats/monthly] ${message}`);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMonthRecordDateRegex(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    return new RegExp(`^${escapeRegex(month)}`);
  }

  const year = matched[1];
  const monthNoPad = String(Number(matched[2]));
  return new RegExp(`^${year}(?:[-/年\\s]+)0?${monthNoPad}(?:月|[-/\\s]|$)`);
}

function monthDateKeys(start: Date, end: Date) {
  const keys: string[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function resolveMonthRange(month: string | null) {
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return { start, end, month: month.slice(0, 7) };
    }
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = start.getFullYear();
  const mon = String(start.getMonth() + 1).padStart(2, "0");
  return { start, end, month: `${year}-${mon}` };
}

function buildTerminationPlatformMatch(platform: DailyPointPlatform) {
  if (platform === "eleme") {
    return { deliveryPlatform: { $regex: "饿了么" } };
  }

  return { deliveryPlatform: { $not: /饿了么/ } };
}

async function ensureMonthlyDerivedPrepared(
  platform: DailyPointPlatform,
  month: string,
  monthRecordDateRegex: RegExp
) {
  const cacheKey = `${platform}:${month}`;
  const cachedUntil = monthlyDerivedPreparedCache.get(cacheKey);
  if (cachedUntil && cachedUntil > Date.now()) {
    debugStatsLog("派生字段补齐命中缓存", { platform, month });
    return;
  }

  const missingDocs = await DailyPointDetail.find({
    platform,
    recordDate: { $regex: monthRecordDateRegex },
    $or: [
      { recordDateKey: { $exists: false } },
      { recordDateKey: "" },
      { amountValue: { $exists: false } },
      { amountValue: null },
    ],
  })
    .select({ _id: 1, recordDate: 1, rowData: 1 })
    .lean<DailyPointTrendDetail[]>();
  debugStatsLog("派生字段待补齐数量", {
    platform,
    month,
    missingCount: missingDocs.length,
  });

  if (missingDocs.length > 0) {
    const operations = missingDocs
      .filter((doc) => Boolean(doc._id))
      .map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              recordDateKey: normalizeDateKey(doc.recordDate),
              amountValue: extractDailyPointAmount(
                (doc.rowData ?? {}) as Record<string, unknown>,
                platform
              ),
            },
          },
        },
      }));

    if (operations.length > 0) {
      await DailyPointDetail.bulkWrite(operations, { ordered: false });
      debugStatsLog("派生字段补齐完成", {
        platform,
        month,
        updatedCount: operations.length,
      });
    }
  }

  monthlyDerivedPreparedCache.set(cacheKey, Date.now() + DERIVED_PREPARED_TTL_MS);
}

async function fetchMonthlyDerivedDetails(
  platform: DailyPointPlatform,
  month: string,
  monthRecordDateRegex: RegExp
) {
  await ensureMonthlyDerivedPrepared(platform, month, monthRecordDateRegex);
  const monthDateKeyRegex = new RegExp(`^${escapeRegex(month)}-`);

  return DailyPointDetail.find({
    platform,
    recordDateKey: { $regex: monthDateKeyRegex },
  })
    .select({
      _id: 0,
      platform: 1,
      recordDateKey: 1,
      recordDate: 1,
      merchantId: 1,
      storeId: 1,
      shopName: 1,
      amountValue: 1,
      rowData: 1,
    })
    .lean<DailyPointTrendDetail[]>();
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "stats-monthly",
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...REPORT_READ_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    const { start, end, month } = resolveMonthRange(
      request.nextUrl.searchParams.get("month")
    );
    const startTime = Date.now();
    const cached = getCachedReportPayload<StatsMonthlyPayload>(
      STATS_MONTHLY_CACHE_NAMESPACE,
      month
    );
    if (cached) {
      debugStatsLog("统计缓存命中", { month });
      return NextResponse.json(cached, {
        headers: REPORT_READ_RESPONSE_HEADERS,
      });
    }
    debugStatsLog("统计缓存未命中", { month });
    await connectMongo();
    const monthRecordDateRegex = buildMonthRecordDateRegex(month);
    const match = { entryDate: { $gte: start, $lt: end } };

    const [
      monthlyShopCount,
      dailyOrderShopTrend,
      operatorShopTrend,
      salesShopTrend,
      salesCityShopTrend,
      operatorTerminationTrend,
      meituanDailyTerminationTrend,
      elemeDailyTerminationTrend,
      meituanDailyPointDetails,
      elemeDailyPointDetails,
    ] = await Promise.all([
      Shop.countDocuments(match),
      Shop.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$entryDate",
                timezone: "Asia/Shanghai",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
      Shop.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ["$operatorName", ""] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { count: -1, name: 1 } },
      ]),
      Shop.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ["$salesName", ""] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { count: -1, name: 1 } },
      ]),
      Shop.aggregate([
        {
          $match: {
            ...match,
            salesName: { $ne: "" },
            salesCity: { $in: ["武汉", "宜昌"] },
          },
        },
        {
          $group: {
            _id: "$salesCity",
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { name: 1 } },
      ]),
      Shop.aggregate([
        {
          $match: {
            shopStatus: "已解约",
            terminationDate: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$operatorName", ""] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { count: -1, name: 1 } },
      ]),
      Shop.aggregate([
        {
          $match: {
            shopStatus: "已解约",
            terminationDate: { $gte: start, $lt: end },
            ...buildTerminationPlatformMatch("meituan"),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$terminationDate",
                timezone: "Asia/Shanghai",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
      Shop.aggregate([
        {
          $match: {
            shopStatus: "已解约",
            terminationDate: { $gte: start, $lt: end },
            ...buildTerminationPlatformMatch("eleme"),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$terminationDate",
                timezone: "Asia/Shanghai",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
      fetchMonthlyDerivedDetails("meituan", month, monthRecordDateRegex),
      fetchMonthlyDerivedDetails("eleme", month, monthRecordDateRegex),
    ]);

    const dateKeys = monthDateKeys(start, end);

    const { shopRelationFilter } = buildDailyPointRelatedShopFilter([
      ...meituanDailyPointDetails,
      ...elemeDailyPointDetails,
    ]);

    const relatedShops =
      shopRelationFilter.length > 0
        ? await Shop.find({ $or: shopRelationFilter })
            .select({ _id: 0, merchantId: 1, shopName: 1, operatorName: 1 })
            .lean<DailyPointTrendShop[]>()
        : [];

    const meituanTrends = buildDailyPointTrends({
      details: meituanDailyPointDetails,
      shops: relatedShops,
      month,
      start,
      end,
    });
    const elemeTrends = buildDailyPointTrends({
      details: elemeDailyPointDetails,
      shops: relatedShops,
      month,
      start,
      end,
    });

    const payload: StatsMonthlyPayload = {
      month,
      monthlyShopCount,
      dailyOrderShopTrend,
      operatorShopTrend,
      salesShopTrend,
      salesCityShopTrend: buildSalesCityShopTrend(salesCityShopTrend),
      operatorTerminationTrend,
      meituanDailyTerminationShopTrend: buildDailyCountTrendSeries(
        "美团",
        dateKeys,
        meituanDailyTerminationTrend
      ),
      elemeDailyTerminationShopTrend: buildDailyCountTrendSeries(
        "饿了么",
        dateKeys,
        elemeDailyTerminationTrend
      ),
      meituanDailyPointShopTrend: meituanTrends.shopCountTrend,
      meituanDailyPointAmountTrend: meituanTrends.totalAmountTrend,
      elemeDailyPointShopTrend: elemeTrends.shopCountTrend,
      elemeDailyPointAmountTrend: elemeTrends.totalAmountTrend,
    };

    setCachedReportPayload(STATS_MONTHLY_CACHE_NAMESPACE, month, payload);
    debugStatsLog("统计缓存写入", {
      month,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(payload, {
      headers: REPORT_READ_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取月度统计失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
