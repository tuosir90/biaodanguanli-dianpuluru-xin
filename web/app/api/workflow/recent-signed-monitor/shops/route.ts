import { NextRequest, NextResponse } from "next/server";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { connectMongo } from "@/lib/mongodb";
import { RECENT_SIGNED_WINDOW_DAYS, RECENT_SIGNED_WINDOW_LABEL } from "@/features/workflow/constants";
import {
  applyWorkflowFlowLockToShops,
  fetchWorkflowFlowLockLookup,
} from "@/lib/workflow-flow-lock";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

const MAX_PAGE_SIZE = 200;
const RECENT_SIGNED_MONITOR_SHOPS_RESPONSE_HEADERS = {
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

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateKey: string, dayOffset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";

  const dateValue = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  dateValue.setUTCDate(dateValue.getUTCDate() + dayOffset);

  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWithinRecentSignedWindow(
  contractSignedDate: unknown,
  currentDateKey: string,
  windowDays: number
) {
  if (!contractSignedDate || !currentDateKey || windowDays <= 0) {
    return false;
  }

  const parsedDate =
    contractSignedDate instanceof Date
      ? contractSignedDate
      : new Date(String(contractSignedDate));
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const contractDateKey = formatShanghaiDate(parsedDate);
  const windowEndDateKey = addDays(contractDateKey, windowDays - 1);
  if (!windowEndDateKey) {
    return false;
  }

  return currentDateKey >= contractDateKey && currentDateKey <= windowEndDateKey;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "workflow-recent-signed-monitor-shops",
      maxRequests: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "请求过于频繁，请稍后重试" },
        {
          status: 429,
          headers: {
            ...RECENT_SIGNED_MONITOR_SHOPS_RESPONSE_HEADERS,
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
    const windowDays = parsePositiveInt(
      searchParams.get("windowDays"),
      RECENT_SIGNED_WINDOW_DAYS
    );
    const operatorName = (searchParams.get("operatorName") ?? "").trim();

    const shops = await Shop.find({
      ...buildOperatorFilter(operatorName),
      shopStatus: { $nin: ["已解约", "无效店铺"] },
    })
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

    const currentDateKey = formatShanghaiDate(new Date());
    const filtered = shops
      .filter((shop) =>
        Boolean(String(shop.wechatGroupName ?? "").trim()) &&
        isWithinRecentSignedWindow(shop.contractSignedDate, currentDateKey, windowDays)
      )
      .sort((left, right) => {
        const leftDate = String(left.contractSignedDate ?? "");
        const rightDate = String(right.contractSignedDate ?? "");
        const dateDiff = rightDate.localeCompare(leftDate);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        const operatorDiff = normalizeOperatorName(left.operatorName).localeCompare(
          normalizeOperatorName(right.operatorName),
          "zh-CN"
        );
        if (operatorDiff !== 0) {
          return operatorDiff;
        }

        return String(left.shopName ?? "").localeCompare(
          String(right.shopName ?? ""),
          "zh-CN"
        );
      });

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const pagedShops = filtered.slice(offset, offset + pageSize).map((shop) => ({
      ...shop,
      _id: String(shop._id),
    }));
    const flowLockLookup = await fetchWorkflowFlowLockLookup(pagedShops);
    const data = applyWorkflowFlowLockToShops(pagedShops, flowLockLookup);

    return NextResponse.json(
      { data, total, page, pageSize },
      { headers: RECENT_SIGNED_MONITOR_SHOPS_RESPONSE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: `获取${RECENT_SIGNED_WINDOW_LABEL}店铺明细失败`,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
