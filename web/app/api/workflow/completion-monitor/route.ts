import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedCompletionMonitor,
  setCachedCompletionMonitor,
} from "@/lib/workflow-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { getWorkflowFlowMetrics } from "@/lib/workflow-flow-metrics";
import { WORKFLOW_FLOW_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { fetchWorkflowStatusSnapshotByShopIds } from "@/lib/workflow-status-snapshot";
import { Shop } from "@/models/shop";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const COMPLETION_MONITOR_CACHE_KEY = "completion-monitor:v2";
const COMPLETION_MONITOR_RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=240",
};

type CompletionMonitorPayload = {
  operatorStats: Array<{
    operatorName: string;
    pendingShopCount: number;
  }>;
  totalPendingShops: number;
};

type ShopLite = {
  _id: unknown;
  operatorName?: string;
  deliveryPlatform?: string;
  shopStatus?: string;
  contractSignedDate?: Date | string;
};

function normalizeOperatorName(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "未分配";
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-completion-monitor",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...COMPLETION_MONITOR_RESPONSE_HEADERS,
            ...buildRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    await connectMongo();
    const cached = getCachedCompletionMonitor<CompletionMonitorPayload>(
      COMPLETION_MONITOR_CACHE_KEY
    );
    if (cached) {
      return NextResponse.json(cached, {
        headers: COMPLETION_MONITOR_RESPONSE_HEADERS,
      });
    }

    const shops = await Shop.find({
      shopStatus: { $nin: ["已解约", "无效店铺"] },
    })
      .select({
        _id: 1,
        operatorName: 1,
        deliveryPlatform: 1,
        shopStatus: 1,
        contractSignedDate: 1,
      })
      .lean<ShopLite[]>();

    if (shops.length === 0) {
      const emptyPayload: CompletionMonitorPayload = {
        operatorStats: [],
        totalPendingShops: 0,
      };
      return NextResponse.json(emptyPayload, {
        headers: COMPLETION_MONITOR_RESPONSE_HEADERS,
      });
    }

    const snapshotMap = await fetchWorkflowStatusSnapshotByShopIds(
      shops.map((shop) => shop._id),
      WORKFLOW_FLOW_PROGRESS_KEYS
    );

    const operatorCountMap = new Map<string, number>();
    let totalPendingShops = 0;

    shops.forEach((shop) => {
      const snapshot = snapshotMap.get(String(shop._id));
      const metrics = getWorkflowFlowMetrics({
        deliveryPlatform: shop.deliveryPlatform,
        shopStatus: shop.shopStatus,
        completedKeys: snapshot?.completedKeys,
        loggedKeys: snapshot?.loggedKeys,
      });

      if (metrics.remainingCount <= 0) {
        return;
      }

      totalPendingShops += 1;
      const operatorName = normalizeOperatorName(shop.operatorName);
      operatorCountMap.set(
        operatorName,
        (operatorCountMap.get(operatorName) ?? 0) + 1
      );
    });

    const payload: CompletionMonitorPayload = {
      operatorStats: Array.from(operatorCountMap.entries())
        .map(([operatorName, pendingShopCount]) => ({
          operatorName,
          pendingShopCount,
        }))
        .sort((left, right) => left.operatorName.localeCompare(right.operatorName, "zh-CN")),
      totalPendingShops,
    };

    setCachedCompletionMonitor(COMPLETION_MONITOR_CACHE_KEY, payload);

    return NextResponse.json(payload, {
      headers: COMPLETION_MONITOR_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取流程完成度监控失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
