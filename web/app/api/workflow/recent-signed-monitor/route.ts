import { NextRequest, NextResponse } from "next/server";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { connectMongo } from "@/lib/mongodb";
import { RECENT_SIGNED_WINDOW_DAYS, RECENT_SIGNED_WINDOW_LABEL } from "@/features/workflow/constants";
import { buildWorkflowRecentSignedMonitor } from "@/features/workflow/recent-signed-monitor";
import { Shop } from "@/models/shop";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RECENT_SIGNED_MONITOR_RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=240",
};

type ShopLite = {
  _id: unknown;
  operatorName?: string;
  shopStatus?: string;
  wechatGroupName?: string;
  contractSignedDate?: Date | string;
};

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-recent-signed-monitor",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...RECENT_SIGNED_MONITOR_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();

    const shops = await Shop.find({
      shopStatus: { $nin: ["已解约", "无效店铺"] },
    })
      .select({
        _id: 1,
        operatorName: 1,
        shopStatus: 1,
        wechatGroupName: 1,
        contractSignedDate: 1,
      })
      .lean<ShopLite[]>();

    const payload = buildWorkflowRecentSignedMonitor({
      shops,
      currentDateKey: formatShanghaiDate(new Date()),
      windowDays: RECENT_SIGNED_WINDOW_DAYS,
    });

    return NextResponse.json(payload, {
      headers: RECENT_SIGNED_MONITOR_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: `获取${RECENT_SIGNED_WINDOW_LABEL}店铺监控失败`,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
