import { NextRequest, NextResponse } from "next/server";
import { buildPremiumShopReportFromLookup } from "@/features/premium-shops/report";
import type {
  PremiumShopPlatform,
  PremiumShopReport,
  PremiumShopSource,
} from "@/features/premium-shops/types";
import { fetchDailyPointTotalAmountLookup } from "@/lib/latest-daily-point-shops";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { buildRateLimitHeaders, checkRouteRateLimit } from "@/lib/request-rate-limit";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";

export const runtime = "nodejs";
export const maxDuration = 30;

const PREMIUM_SHOPS_CACHE_NAMESPACE = "premium-shops";
const PREMIUM_SHOPS_CACHE_KEY = "all";

async function fetchLatestDateByPlatform() {
  const latestDateRows = await DailyPointDetail.aggregate<{
    _id: PremiumShopPlatform;
    latestDateKey: string;
  }>([
    {
      $match: {
        platform: { $in: ["meituan", "eleme"] },
        recordDateKey: { $ne: "" },
      },
    },
    {
      $group: {
        _id: "$platform",
        latestDateKey: { $max: "$recordDateKey" },
      },
    },
  ]);

  return latestDateRows.reduce<Partial<Record<PremiumShopPlatform, string>>>(
    (map, row) => {
      if (row._id === "meituan" || row._id === "eleme") {
        map[row._id] = row.latestDateKey;
      }
      return map;
    },
    {}
  );
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRouteRateLimit(request, {
      routeKey: "premium-shops-read",
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

    const cached = getCachedReportPayload<PremiumShopReport>(
      PREMIUM_SHOPS_CACHE_NAMESPACE,
      PREMIUM_SHOPS_CACHE_KEY
    );
    if (cached) {
      return NextResponse.json(cached, { headers: REPORT_READ_RESPONSE_HEADERS });
    }

    await connectMongo();

    const shops = await Shop.find({
      shopStatus: { $nin: ["已解约", "无效店铺"] },
    })
      .select({
        _id: 1,
        shopName: 1,
        merchantId: 1,
        wechatGroupName: 1,
        deliveryPlatform: 1,
        shopStatus: 1,
      })
      .lean<PremiumShopSource[]>();

    const [amountLookup, latestDateByPlatform] = await Promise.all([
      fetchDailyPointTotalAmountLookup(shops),
      fetchLatestDateByPlatform(),
    ]);
    const payload = buildPremiumShopReportFromLookup({
      shops,
      amountLookup,
      latestDateByPlatform,
    });
    setCachedReportPayload(PREMIUM_SHOPS_CACHE_NAMESPACE, PREMIUM_SHOPS_CACHE_KEY, payload);

    return NextResponse.json(payload, { headers: REPORT_READ_RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取优质店铺列表失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
