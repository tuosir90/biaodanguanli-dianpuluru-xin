import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Shop } from "@/models/shop";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

export const maxDuration = 30;

const SHANGHAI_TIMEZONE = "Asia/Shanghai";
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseRange(value: string | null): "today" | "7d" {
  return value === "7d" ? "7d" : "today";
}

function parseMode(value: string | null): "patrol" | "completion" {
  return value === "completion" ? "completion" : "patrol";
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatShanghaiDateTime(date: Date) {
  const datePart = formatShanghaiDate(date);
  const timePart = new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
  return `${datePart} ${timePart}`;
}

function resolveRange(range: "today" | "7d") {
  const today = formatShanghaiDate(new Date());
  const todayStart = new Date(`${today}T00:00:00+08:00`);
  const end = new Date(todayStart);
  end.setDate(end.getDate() + 1);

  if (range === "today") {
    return { start: todayStart, end };
  }

  const start = new Date(todayStart);
  start.setDate(start.getDate() - 6);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get("pageSize"), 10),
      MAX_PAGE_SIZE
    );
    const range = parseRange(searchParams.get("range"));
    const mode = parseMode(searchParams.get("mode"));
    const operatorName = (searchParams.get("operatorName") ?? "").trim();
    const { start, end } = resolveRange(range);

    const filter: Record<string, unknown> = {
      completed: true,
      ...(mode === "patrol"
        ? {
            progressKey: "daily_patrol",
            progressDate: { $gte: start, $lt: end },
          }
        : {
            progressKey: { $ne: "daily_patrol" },
            completedAt: { $gte: start, $lt: end },
          }),
    };
    if (operatorName) {
      filter.operatorName = operatorName;
    }

    const [logs, total] = await Promise.all([
      WorkflowProgressLog.find(filter)
        .sort({ completedAt: -1, updatedAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select({ _id: 0, shopId: 1, operatorName: 1, progressDate: 1, progressLabel: 1, completedAt: 1 })
        .lean(),
      WorkflowProgressLog.countDocuments(filter),
    ]);

    const shopIds = Array.from(new Set(logs.map((log) => String(log.shopId)).filter(Boolean)));
    const shops =
      shopIds.length > 0
        ? await Shop.find({ _id: { $in: shopIds } })
            .select({ _id: 1, merchantId: 1, shopName: 1 })
            .lean()
        : [];

    const shopMap = new Map(
      shops.map((shop) => [String(shop._id), { merchantId: shop.merchantId ?? "", shopName: shop.shopName ?? "" }])
    );

    const items = logs.map((log) => {
      const shopId = String(log.shopId);
      const shop = shopMap.get(shopId);
      const progressDate =
        log.progressDate instanceof Date ? log.progressDate : new Date(String(log.progressDate ?? ""));
      const completedAt =
        log.completedAt instanceof Date ? log.completedAt : new Date(String(log.completedAt ?? ""));

      return {
        shopId,
        merchantId: shop?.merchantId ?? "",
        shopName: shop?.shopName ?? "",
        operatorName: (log.operatorName ?? "").trim() || "未分配",
        patrolDate: Number.isNaN(progressDate.getTime()) ? "-" : formatShanghaiDate(progressDate),
        markedAt: Number.isNaN(completedAt.getTime()) ? "-" : formatShanghaiDateTime(completedAt),
        progressLabel: (log.progressLabel ?? "").trim(),
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      range,
      mode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取历史已标记明细失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
