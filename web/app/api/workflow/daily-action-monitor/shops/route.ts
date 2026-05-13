import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { fetchWorkflowDailyActionShopItems } from "@/lib/workflow-daily-action";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";

export const maxDuration = 30;

const MAX_PAGE_SIZE = 50;
const DAILY_ACTION_MONITOR_SHOPS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-daily-action-monitor-shops",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...DAILY_ACTION_MONITOR_SHOPS_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get("pageSize"), 15),
      MAX_PAGE_SIZE
    );
    const operatorName = (searchParams.get("operatorName") ?? "").trim();
    const shopNameKeyword = (searchParams.get("shopName") ?? "").trim();
    const merchantIdKeyword = (searchParams.get("merchantId") ?? "").trim();
    const statusKeyword = (searchParams.get("status") ?? "").trim();

    const items = await fetchWorkflowDailyActionShopItems({
      operatorName,
      shopNameKeyword,
      merchantIdKeyword,
      statusKeyword,
    });

    const total = items.length;
    const offset = (page - 1) * pageSize;
    const data = items.slice(offset, offset + pageSize);

    return NextResponse.json(
      { data, total, page, pageSize },
      { headers: DAILY_ACTION_MONITOR_SHOPS_RESPONSE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取今日待处理店铺失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
