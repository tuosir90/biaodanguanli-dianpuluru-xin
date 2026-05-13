import { NextRequest, NextResponse } from "next/server";
import { buildOnlineShopCountReport } from "@/features/online-shop-stats/report";
import { normalizeOnlineShopCountUploadPayload } from "@/features/online-shop-stats/payload";
import { connectMongo } from "@/lib/mongodb";
import {
  clearReportReadCaches,
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { OnlineShopCountSnapshot } from "@/models/online-shop-count-snapshot";
import type { OnlineShopCountReport, OnlineShopCountSnapshotItem } from "@/features/online-shop-stats/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const ONLINE_SHOP_COUNT_CACHE_NAMESPACE = "online-shop-counts";

function resolveCurrentMonth() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((item) => item.type === "year")?.value ?? "";
  const month = parts.find((item) => item.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

function resolveMonth(value: string | null) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }
  return resolveCurrentMonth();
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "online-shop-counts-read",
      maxRequests: 120,
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

    const month = resolveMonth(request.nextUrl.searchParams.get("month"));
    const cached = getCachedReportPayload<OnlineShopCountReport>(
      ONLINE_SHOP_COUNT_CACHE_NAMESPACE,
      month
    );
    if (cached) {
      return NextResponse.json(cached, { headers: REPORT_READ_RESPONSE_HEADERS });
    }

    await connectMongo();
    const snapshots = await OnlineShopCountSnapshot.find({
      statDateKey: { $regex: new RegExp(`^${month}-`) },
    })
      .select({ _id: 0, platform: 1, statDateKey: 1, count: 1, capturedAt: 1, summaryText: 1 })
      .lean<OnlineShopCountSnapshotItem[]>();

    const payload = buildOnlineShopCountReport({ month, snapshots });
    setCachedReportPayload(ONLINE_SHOP_COUNT_CACHE_NAMESPACE, month, payload);

    return NextResponse.json(payload, { headers: REPORT_READ_RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取在线店铺数失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "online-shop-counts-write",
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        { status: 429, headers: buildRateLimitHeaders(rateLimit) }
      );
    }

    const payload = normalizeOnlineShopCountUploadPayload(await request.json());
    await connectMongo();

    const importedAt = new Date();
    const result = await OnlineShopCountSnapshot.bulkWrite(
      payload.records.map((record) => ({
        updateOne: {
          filter: { platform: record.platform, captureKey: record.captureKey },
          update: {
            $setOnInsert: {
              platform: record.platform,
              statDateKey: payload.statDateKey,
              count: record.count,
              summaryText: record.summaryText,
              captureSource: payload.captureSource,
              captureKey: record.captureKey,
              capturedAt: payload.capturedAt,
              importedAt,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    clearReportReadCaches();

    return NextResponse.json({
      success: true,
      statDate: payload.statDateKey,
      inserted: result.upsertedCount,
      skipped: payload.records.length - result.upsertedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const status = message.includes("参数") || message.includes("必须") || message.includes("至少")
      ? 400
      : 500;

    return NextResponse.json(
      {
        message: status === 400 ? "在线店铺数上传参数无效" : "在线店铺数上传失败",
        error: message,
      },
      { status }
    );
  }
}
