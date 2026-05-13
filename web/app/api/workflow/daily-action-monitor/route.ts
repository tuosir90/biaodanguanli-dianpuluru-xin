import { NextRequest, NextResponse } from "next/server";
import { buildWorkflowDailyActionSummary } from "@/features/workflow/daily-action-monitor";
import { connectMongo } from "@/lib/mongodb";
import { fetchWorkflowDailyActionShopItems } from "@/lib/workflow-daily-action";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";

export const maxDuration = 30;

const DAILY_ACTION_MONITOR_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-daily-action-monitor",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...DAILY_ACTION_MONITOR_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();
    const items = await fetchWorkflowDailyActionShopItems();
    const payload = buildWorkflowDailyActionSummary(
      items.map((item) => ({
        operatorName: item.operatorName || "未分配",
        actionType: item.todayActionType,
      }))
    );

    return NextResponse.json(payload, {
      headers: DAILY_ACTION_MONITOR_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取今日待处理监控失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
