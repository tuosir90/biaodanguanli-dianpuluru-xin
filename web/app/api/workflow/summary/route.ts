import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { Shop } from "@/models/shop";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";
import { buildWorkflowShopCountByOperatorPipeline } from "@/features/workflow/summary-shop-count";
import { buildWorkflowTerminationTrend } from "@/features/workflow/termination-trend";

export const maxDuration = 30;

type TerminationTrendShopLite = {
  operatorName?: string;
  shopStatus?: string;
  terminationDate?: Date | string | null;
};

function resolveMonth(monthValue: string | null) {
  if (monthValue) {
    const start = new Date(`${monthValue}-01T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return { start, end };
    }
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function resolveRange(startDateValue: string | null, endDateValue: string | null) {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const start = startDateValue ? new Date(startDateValue) : defaultStart;
  const end = endDateValue ? new Date(endDateValue) : defaultEnd;

  const safeStart = Number.isNaN(start.getTime()) ? defaultStart : start;
  const safeEnd = Number.isNaN(end.getTime()) ? defaultEnd : end;

  const normalizedStart = new Date(safeStart);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(safeEnd);
  normalizedEnd.setHours(23, 59, 59, 999);

  return { start: normalizedStart, end: normalizedEnd };
}

const summaryCache = new Map<string, { expiresAt: number; payload: unknown }>();
const SUMMARY_CACHE_TTL_MS = 2 * 60 * 1000;
const WORKFLOW_SUMMARY_RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-summary",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...WORKFLOW_SUMMARY_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();

    const month = request.nextUrl.searchParams.get("month");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    const operatorName = (request.nextUrl.searchParams.get("operatorName") ?? "").trim();
    const fallback = resolveMonth(month);
    const range = resolveRange(startDate, endDate);
    const start = startDate || endDate ? range.start : fallback.start;
    const end = startDate || endDate ? range.end : fallback.end;

    const cacheKey = `${start.toISOString()}:${end.toISOString()}:${operatorName}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, {
        headers: WORKFLOW_SUMMARY_RESPONSE_HEADERS,
      });
    }

    const shopCountByOperator = await Shop.aggregate(
      buildWorkflowShopCountByOperatorPipeline(start, end)
    );

    const progressMatch: Record<string, unknown> = {
      progressDate: { $gte: start, $lt: end },
      completed: true,
    };

    if (operatorName) {
      progressMatch.operatorName = operatorName;
    }

    const progressCountByItem = await WorkflowProgressLog.aggregate([
      { $match: progressMatch },
      {
        $group: {
          _id: {
            progressKey: "$progressKey",
            progressLabel: "$progressLabel",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          progressKey: "$_id.progressKey",
          progressLabel: "$_id.progressLabel",
          count: 1,
        },
      },
      { $sort: { count: -1, progressLabel: 1 } },
    ]);

    const terminationTrendShops = await Shop.find({
      terminationDate: { $gte: start, $lt: end },
      ...(operatorName ? { operatorName } : {}),
    })
      .select({
        _id: 0,
        operatorName: 1,
        shopStatus: 1,
        terminationDate: 1,
      })
      .lean<TerminationTrendShopLite[]>();

    const operatorTerminationTrend = buildWorkflowTerminationTrend({
      shops: terminationTrendShops,
      start,
      end,
      operatorName: operatorName || undefined,
    });

    const payload = {
      month: start.toISOString().slice(0, 7),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      shopCountByOperator,
      progressCountByItem,
      operatorTerminationTrend,
    };

    summaryCache.set(cacheKey, { expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS, payload });

    return NextResponse.json(payload, {
      headers: WORKFLOW_SUMMARY_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取工作进度月度统计失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
