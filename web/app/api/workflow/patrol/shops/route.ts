import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  fetchLatestDailyPointShopLookup,
  matchesLatestDailyPointShop,
} from "@/lib/latest-daily-point-shops";
import {
  getCachedPatrolShops,
  setCachedPatrolShops,
} from "@/lib/workflow-read-cache";
import { WORKFLOW_ALL_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { Shop } from "@/models/shop";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

export const maxDuration = 30;

const SHANGHAI_TIMEZONE = "Asia/Shanghai";
const MAX_PAGE_SIZE = 50;

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
  entryDate?: Date | string;
};

type PatrolShopsPayload = {
  data: Array<ShopLite & { _id: string }>;
  total: number;
  page: number;
  pageSize: number;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toDayNumber(date: Date) {
  const formatted = formatShanghaiDate(date);
  const matched = formatted.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  return Math.floor(Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000));
}

function calcDaysUnpatrolled(baseDate: Date | null) {
  if (!baseDate) return null;
  const todayNumber = toDayNumber(new Date());
  const baseNumber = toDayNumber(baseDate);
  if (todayNumber === null || baseNumber === null) return null;
  const diff = todayNumber - baseNumber;
  if (diff <= 0) return 0;
  return diff;
}

function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get("pageSize"), 15),
      MAX_PAGE_SIZE
    );
    const minDays = parsePositiveInt(searchParams.get("minDays"), 1);
    const operatorName = (searchParams.get("operatorName") ?? "").trim();
    const cacheKey = `patrol-shops:${page}:${pageSize}:${minDays}:${operatorName}`;
    const cached = getCachedPatrolShops<PatrolShopsPayload>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const shopMatch: Record<string, unknown> = {
      $or: [
        { shopStatus: "正常" },
        { shopStatus: "新店" },
        { shopStatus: null },
        { shopStatus: "" },
        { shopStatus: { $exists: false } },
      ],
    };
    if (operatorName) {
      shopMatch.operatorName = operatorName;
    }

    const latestDailyPointLookup = await fetchLatestDailyPointShopLookup();
    if (!latestDailyPointLookup.latestDateKey) {
      const payload: PatrolShopsPayload = { data: [], total: 0, page, pageSize };
      setCachedPatrolShops(cacheKey, payload);
      return NextResponse.json(payload);
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
        entryDate: 1,
      })
      .lean<ShopLite[]>();

    const latestDailyPointShops = shops.filter((shop) =>
      matchesLatestDailyPointShop(latestDailyPointLookup, {
        merchantId: shop.merchantId,
        shopName: shop.shopName,
      })
    );

    if (latestDailyPointShops.length === 0) {
      const payload: PatrolShopsPayload = { data: [], total: 0, page, pageSize };
      setCachedPatrolShops(cacheKey, payload);
      return NextResponse.json(payload);
    }

    const shopIds = latestDailyPointShops.map((shop) => shop._id);
    const latestLogs = await WorkflowProgressLog.aggregate([
      {
        $match: {
          shopId: { $in: shopIds },
          completed: true,
          progressKey: { $in: [...WORKFLOW_ALL_PROGRESS_KEYS] },
        },
      },
      {
        $group: {
          _id: "$shopId",
          latestDailyPatrolDate: {
            $max: {
              $cond: [
                { $eq: ["$progressKey", "daily_patrol"] },
                "$progressDate",
                null,
              ],
            },
          },
          latestFlowCompletedAt: {
            $max: {
              $cond: [
                { $ne: ["$progressKey", "daily_patrol"] },
                "$completedAt",
                null,
              ],
            },
          },
        },
      },
    ]).option({ comment: "workflow_patrol_shops_latest_by_shop" });

    const latestMap = new Map<string, Date>();
    latestLogs.forEach((item) => {
      const candidates = [item.latestDailyPatrolDate, item.latestFlowCompletedAt]
        .filter(Boolean)
        .map((value) => (value instanceof Date ? value : new Date(value)))
        .filter((date) => !Number.isNaN(date.getTime()));
      if (candidates.length === 0) return;
      const latestDate = candidates.reduce((latest, current) =>
        current.getTime() > latest.getTime() ? current : latest
      );
      latestMap.set(String(item._id), latestDate);
    });

    const filtered = latestDailyPointShops
      .map((shop) => {
        const shopId = String(shop._id);
        const latestPatrolDate = latestMap.get(shopId) ?? null;
        const baselineDate =
          latestPatrolDate ||
          toValidDate(shop.contractSignedDate) ||
          toValidDate(shop.entryDate);
        const daysUnpatrolled = calcDaysUnpatrolled(baselineDate);
        return { shop, daysUnpatrolled };
      })
      .filter((item) => (item.daysUnpatrolled ?? 0) >= minDays)
      .sort((a, b) => {
        const dayDiff = (b.daysUnpatrolled ?? 0) - (a.daysUnpatrolled ?? 0);
        if (dayDiff !== 0) return dayDiff;
        return (a.shop.shopName ?? "").localeCompare(b.shop.shopName ?? "", "zh-CN");
      });

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const data = filtered.slice(offset, offset + pageSize).map(({ shop }) => ({
      ...shop,
      _id: String(shop._id),
    }));

    const payload: PatrolShopsPayload = { data, total, page, pageSize };
    setCachedPatrolShops(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取巡店筛选店铺失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
