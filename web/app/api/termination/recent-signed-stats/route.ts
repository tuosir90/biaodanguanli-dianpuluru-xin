import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { Shop } from "@/models/shop";
import {
  buildRecentSignedTerminationMonthRange,
  buildRecentSignedTerminationReport,
  type RecentSignedTerminationReport,
  type RecentSignedTerminationShopSource,
} from "@/features/recent-signed-termination/report";

export const maxDuration = 30;

const RECENT_SIGNED_TERMINATION_CACHE_NAMESPACE = "recent-signed-termination";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "termination-recent-signed-stats",
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

    const month = (request.nextUrl.searchParams.get("month") ?? currentMonth()).trim();
    const range = buildRecentSignedTerminationMonthRange(month);
    if (!range) {
      return NextResponse.json({ message: "month 参数无效" }, { status: 400 });
    }

    const cached = getCachedReportPayload<RecentSignedTerminationReport>(
      RECENT_SIGNED_TERMINATION_CACHE_NAMESPACE,
      month
    );
    if (cached) {
      return NextResponse.json(cached, { headers: REPORT_READ_RESPONSE_HEADERS });
    }

    await connectMongo();
    const shops = await Shop.find({
      shopStatus: "已解约",
      terminationDate: { $gte: range.terminationStart, $lt: range.terminationEnd },
      contractSignedDate: { $gte: range.signedStart, $lt: range.signedEnd },
    })
      .select({
        _id: 1,
        shopName: 1,
        merchantId: 1,
        deliveryPlatform: 1,
        operatorName: 1,
        contractSignedDate: 1,
        shopStatus: 1,
        terminationDate: 1,
        terminationCooperationDays: 1,
      })
      .lean();

    const sourceShops: RecentSignedTerminationShopSource[] = shops.map((shop) => ({
        _id: String(shop._id),
        shopName: shop.shopName,
        merchantId: shop.merchantId,
        deliveryPlatform: shop.deliveryPlatform,
        operatorName: shop.operatorName,
        contractSignedDate: shop.contractSignedDate,
        shopStatus: shop.shopStatus,
        terminationDate: shop.terminationDate,
        terminationCooperationDays: shop.terminationCooperationDays,
    }));

    const report = buildRecentSignedTerminationReport({
      month,
      shops: sourceShops,
    });

    setCachedReportPayload(RECENT_SIGNED_TERMINATION_CACHE_NAMESPACE, month, report);
    return NextResponse.json(report, { headers: REPORT_READ_RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        message: "新签解约统计数据加载失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
