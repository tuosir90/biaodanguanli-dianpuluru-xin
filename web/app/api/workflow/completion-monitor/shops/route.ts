import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { getWorkflowFlowMetrics } from "@/lib/workflow-flow-metrics";
import { WORKFLOW_FLOW_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { fetchWorkflowStatusSnapshotByShopIds } from "@/lib/workflow-status-snapshot";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

const MAX_PAGE_SIZE = 50;
const COMPLETION_MONITOR_SHOPS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

type ShopLite = {
  _id: unknown;
  shopName?: string;
  operatorName?: string;
  salesName?: string;
  merchantId?: string;
  wechatGroupName?: string;
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  shopStatus?: string;
  terminationDate?: Date | string;
  terminationCooperationDays?: number;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOperatorName(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "未分配";
}

function buildOperatorFilter(operatorName: string) {
  const normalized = operatorName.trim();
  if (!normalized) {
    return {};
  }

  if (normalized === "未分配") {
    return {
      $or: [
        { operatorName: "" },
        { operatorName: null },
        { operatorName: { $exists: false } },
      ],
    };
  }

  return { operatorName: normalized };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-completion-monitor-shops",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...COMPLETION_MONITOR_SHOPS_RESPONSE_HEADERS,
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

    if (statusKeyword === "已解约" || statusKeyword === "无效店铺") {
      return NextResponse.json(
        { data: [], total: 0, page, pageSize },
        { headers: COMPLETION_MONITOR_SHOPS_RESPONSE_HEADERS }
      );
    }

    const shopMatch: Record<string, unknown> = {
      ...buildOperatorFilter(operatorName),
      shopStatus: statusKeyword || { $nin: ["已解约", "无效店铺"] },
    };

    if (shopNameKeyword) {
      shopMatch.shopName = {
        $regex: escapeRegex(shopNameKeyword),
        $options: "i",
      };
    }

    if (merchantIdKeyword) {
      shopMatch.merchantId = {
        $regex: escapeRegex(merchantIdKeyword),
        $options: "i",
      };
    }

    const shops = await Shop.find(shopMatch)
      .select({
        _id: 1,
        shopName: 1,
        operatorName: 1,
        salesName: 1,
        merchantId: 1,
        wechatGroupName: 1,
        contractSignedDate: 1,
        deliveryPlatform: 1,
        shopStatus: 1,
        terminationDate: 1,
        terminationCooperationDays: 1,
      })
      .lean<ShopLite[]>();

    if (shops.length === 0) {
      return NextResponse.json(
        { data: [], total: 0, page, pageSize },
        { headers: COMPLETION_MONITOR_SHOPS_RESPONSE_HEADERS }
      );
    }

    const snapshotMap = await fetchWorkflowStatusSnapshotByShopIds(
      shops.map((shop) => shop._id),
      WORKFLOW_FLOW_PROGRESS_KEYS
    );

    const pendingShops = shops
      .map((shop) => {
        const snapshot = snapshotMap.get(String(shop._id));
        const metrics = getWorkflowFlowMetrics({
          deliveryPlatform: shop.deliveryPlatform,
          shopStatus: shop.shopStatus,
          completedKeys: snapshot?.completedKeys,
          loggedKeys: snapshot?.loggedKeys,
        });

        return {
          shop,
          metrics,
        };
      })
      .filter((item) => item.metrics.remainingCount > 0)
      .sort((left, right) => {
        const remainingDiff =
          right.metrics.remainingCount - left.metrics.remainingCount;
        if (remainingDiff !== 0) {
          return remainingDiff;
        }

        const operatorDiff = normalizeOperatorName(left.shop.operatorName).localeCompare(
          normalizeOperatorName(right.shop.operatorName),
          "zh-CN"
        );
        if (operatorDiff !== 0) {
          return operatorDiff;
        }

        return String(left.shop.shopName ?? "").localeCompare(
          String(right.shop.shopName ?? ""),
          "zh-CN"
        );
      });

    const total = pendingShops.length;
    const offset = (page - 1) * pageSize;
    const pagedShops = pendingShops.slice(offset, offset + pageSize).map(({ shop }) => ({
      ...shop,
      _id: String(shop._id),
    }));

    return NextResponse.json(
      { data: pagedShops, total, page, pageSize },
      { headers: COMPLETION_MONITOR_SHOPS_RESPONSE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取未完成流程店铺失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
