import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedPatrolAlerts,
  setCachedPatrolAlerts,
} from "@/lib/workflow-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import {
  fetchLatestDailyPointShopLookup,
  matchesLatestDailyPointShop,
} from "@/lib/latest-daily-point-shops";
import { WORKFLOW_ALL_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

const SHANGHAI_TIMEZONE = "Asia/Shanghai";
const PATROL_ALERTS_CACHE_KEY = "patrol-alerts:v1";
const PATROL_ALERTS_RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=240",
};

type PatrolAlertsPayload = {
  alerts: Array<{ operatorName: string; alertCount: number }>;
  totalAlertShops: number;
};

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toDayNumber(date: Date) {
  const formatted = formatShanghaiDate(date);
  const matched = formatted.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  return Math.floor(Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000));
}

function calcDaysUnpatrolled(baseDate: Date | null) {
  if (!baseDate) return null;
  const todayNumber = toDayNumber(new Date());
  const baseNumber = toDayNumber(baseDate);
  if (todayNumber === null || baseNumber === null) return null;
  const diff = todayNumber - baseNumber;
  if (diff <= 0) return 0;
  return diff;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-patrol-alerts",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...PATROL_ALERTS_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();
    const cached = getCachedPatrolAlerts<PatrolAlertsPayload>(PATROL_ALERTS_CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: PATROL_ALERTS_RESPONSE_HEADERS,
      });
    }

    const latestDailyPointLookup = await fetchLatestDailyPointShopLookup();
    if (!latestDailyPointLookup.latestDateKey) {
      return NextResponse.json(
        { alerts: [], totalAlertShops: 0 },
        { headers: PATROL_ALERTS_RESPONSE_HEADERS }
      );
    }

    const shops = await Shop.find({
      $or: [
        { shopStatus: "正常" },
        { shopStatus: "新店" },
        { shopStatus: null },
        { shopStatus: "" },
        { shopStatus: { $exists: false } },
      ],
    })
      .select({
        _id: 1,
        operatorName: 1,
        contractSignedDate: 1,
        entryDate: 1,
        merchantId: 1,
        shopName: 1,
      })
      .lean();

    const latestDailyPointShops = shops.filter((shop) =>
      matchesLatestDailyPointShop(latestDailyPointLookup, {
        merchantId: typeof shop.merchantId === "string" ? shop.merchantId : "",
        shopName: typeof shop.shopName === "string" ? shop.shopName : "",
      })
    );

    if (latestDailyPointShops.length === 0) {
      return NextResponse.json(
        { alerts: [], totalAlertShops: 0 },
        { headers: PATROL_ALERTS_RESPONSE_HEADERS }
      );
    }

    const shopIds = latestDailyPointShops.map((shop) => shop._id);
    const latestLogs = await WorkflowProgressLog.aggregate([
      {
        $match: {
          shopId: { $in: shopIds },
          completed: true,
          progressKey: { $in: [...WORKFLOW_ALL_PROGRESS_KEYS] },
        },
      },
      {
        $group: {
          _id: "$shopId",
          latestDailyPatrolDate: {
            $max: {
              $cond: [
                { $eq: ["$progressKey", "daily_patrol"] },
                "$progressDate",
                null,
              ],
            },
          },
          latestFlowCompletedAt: {
            $max: {
              $cond: [
                { $ne: ["$progressKey", "daily_patrol"] },
                "$completedAt",
                null,
              ],
            },
          },
        },
      },
    ]).option({ comment: "workflow_patrol_alerts_latest_by_shop" });

    const latestMap = new Map<string, Date>();
    latestLogs.forEach((item) => {
      const candidates = [item.latestDailyPatrolDate, item.latestFlowCompletedAt]
        .filter(Boolean)
        .map((value) => (value instanceof Date ? value : new Date(value)))
        .filter((date) => !Number.isNaN(date.getTime()));

      if (candidates.length === 0) return;

      const latestDate = candidates.reduce((latest, current) =>
        current.getTime() > latest.getTime() ? current : latest
      );
      latestMap.set(String(item._id), latestDate);
    });

    const alertCountByOperator = new Map<string, number>();
    let totalAlertShops = 0;

    latestDailyPointShops.forEach((shop) => {
      const latestPatrolDate = latestMap.get(String(shop._id)) ?? null;
      const contractSignedDate =
        shop.contractSignedDate instanceof Date
          ? shop.contractSignedDate
          : shop.contractSignedDate
            ? new Date(shop.contractSignedDate)
            : null;
      const entryDate =
        shop.entryDate instanceof Date
          ? shop.entryDate
          : shop.entryDate
            ? new Date(shop.entryDate)
            : null;
      const baselineDate = latestPatrolDate ?? contractSignedDate ?? entryDate;
      const daysUnpatrolled = calcDaysUnpatrolled(baselineDate);

      if ((daysUnpatrolled ?? 0) >= 1) {
        totalAlertShops += 1;
        const operatorName = (shop.operatorName ?? "").trim() || "未分配";
        alertCountByOperator.set(
          operatorName,
          (alertCountByOperator.get(operatorName) ?? 0) + 1
        );
      }
    });

    const alerts = Array.from(alertCountByOperator.entries())
      .map(([operatorName, alertCount]) => ({ operatorName, alertCount }))
      .sort((a, b) => b.alertCount - a.alertCount || a.operatorName.localeCompare(b.operatorName));

    const payload: PatrolAlertsPayload = { alerts, totalAlertShops };
    setCachedPatrolAlerts(PATROL_ALERTS_CACHE_KEY, payload);
    return NextResponse.json(payload, {
      headers: PATROL_ALERTS_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取运营未巡店监测失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
