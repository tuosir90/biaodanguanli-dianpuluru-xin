import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { clearWorkflowReadCaches } from "@/lib/workflow-read-cache";
import { WORKFLOW_ALL_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

type PatrolPayload = {
  shopId: string;
  operatorName: string;
  patrolDate: string;
  completed: boolean;
};

type PatrolBatchPayload = {
  shopIds?: string[];
};

const SHANGHAI_TIMEZONE = "Asia/Shanghai";
const DAILY_PATROL_LABEL = "增加每日巡店（包含商家的要求和新的评价解释和发券）";
const PATROL_STATUS_CACHE_TTL_MS = 30_000;
const PATROL_STATUS_CACHE_MAX_ENTRIES = 200;

type PatrolStatusRow = {
  shopId: string;
  latestPatrolDate: string | null;
  latestUpdatedDate: string | null;
  daysUnpatrolled: number | null;
};

const patrolStatusCache = new Map<
  string,
  { expiresAt: number; data: PatrolStatusRow[] }
>();

function parseMultiValue(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseShanghaiDateStart(dateValue?: string) {
  const normalized = (dateValue ?? "").trim();
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    const today = formatShanghaiDate(new Date());
    return new Date(`${today}T00:00:00+08:00`);
  }
  return new Date(`${matched[1]}-${matched[2]}-${matched[3]}T00:00:00+08:00`);
}

function parseObjectIdList(values: string[]) {
  return values
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
}

function buildPatrolCacheKey(objectIds: mongoose.Types.ObjectId[]) {
  return objectIds
    .map((item) => String(item))
    .sort()
    .join(",");
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

async function buildPatrolStatusByObjectIds(objectIds: mongoose.Types.ObjectId[]) {
  if (objectIds.length === 0) {
    return [];
  }

  const cacheKey = buildPatrolCacheKey(objectIds);
  const cached = patrolStatusCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  if (cached && cached.expiresAt <= now) {
    patrolStatusCache.delete(cacheKey);
  }

  const latestLogs = await WorkflowProgressLog.aggregate([
    {
      $match: {
        shopId: { $in: objectIds },
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
  ]);

  const shops = await Shop.find({ _id: { $in: objectIds } })
    .select({ _id: 1, contractSignedDate: 1, entryDate: 1 })
    .lean();

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

  const result: PatrolStatusRow[] = shops.map((shop) => {
    const shopId = String(shop._id);
    const latestPatrolDate = latestMap.get(shopId) ?? null;
    const contractSignedDate =
      shop.contractSignedDate instanceof Date
        ? shop.contractSignedDate
        : shop.contractSignedDate
          ? new Date(shop.contractSignedDate)
          : null;
    const entryDate =
      shop.entryDate instanceof Date
        ? shop.entryDate
        : shop.entryDate
          ? new Date(shop.entryDate)
          : null;

    const baselineDate = latestPatrolDate ?? contractSignedDate ?? entryDate;

    return {
      shopId,
      latestPatrolDate: latestPatrolDate ? formatShanghaiDate(latestPatrolDate) : null,
      latestUpdatedDate: latestPatrolDate ? formatShanghaiDate(latestPatrolDate) : null,
      daysUnpatrolled: calcDaysUnpatrolled(baselineDate),
    };
  });

  patrolStatusCache.set(cacheKey, {
    expiresAt: now + PATROL_STATUS_CACHE_TTL_MS,
    data: result,
  });
  if (patrolStatusCache.size > PATROL_STATUS_CACHE_MAX_ENTRIES) {
    const oldestKey = patrolStatusCache.keys().next().value;
    if (oldestKey) {
      patrolStatusCache.delete(oldestKey);
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const shopIds = parseMultiValue(searchParams.get("shopIds"));
    const objectIds = parseObjectIdList(shopIds);

    if (objectIds.length === 0) {
      return NextResponse.json({ patrolStatus: [] });
    }

    const patrolStatus = await buildPatrolStatusByObjectIds(objectIds);

    return NextResponse.json({ patrolStatus });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取每日巡店状态失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as PatrolPayload | PatrolBatchPayload;

    if (Array.isArray((payload as PatrolBatchPayload).shopIds)) {
      const shopIds = (payload as PatrolBatchPayload).shopIds
        ?.map((item) => String(item).trim())
        .filter(Boolean) ?? [];
      const objectIds = parseObjectIdList(shopIds);
      const patrolStatus = await buildPatrolStatusByObjectIds(objectIds);
      return NextResponse.json({ patrolStatus });
    }

    const markPayload = payload as PatrolPayload;
    if (!markPayload.shopId || !markPayload.operatorName || !markPayload.patrolDate) {
      return NextResponse.json({ message: "参数不完整" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(markPayload.shopId)) {
      return NextResponse.json({ message: "shopId 非法" }, { status: 400 });
    }

    const progressDate = parseShanghaiDateStart(markPayload.patrolDate);
    if (Number.isNaN(progressDate.getTime())) {
      return NextResponse.json({ message: "patrolDate 非法" }, { status: 400 });
    }
    const objectId = new mongoose.Types.ObjectId(markPayload.shopId);

    await WorkflowProgressLog.updateOne(
      {
          shopId: objectId,
        progressKey: "daily_patrol",
        progressDate,
      },
      {
        $set: {
          operatorName: markPayload.operatorName,
          progressLabel: DAILY_PATROL_LABEL,
          completed: markPayload.completed,
          completedAt: markPayload.completed ? new Date() : null,
        },
      },
      { upsert: true }
    );
    patrolStatusCache.clear();
    clearWorkflowReadCaches();

    return NextResponse.json({
      success: true,
      patrolDate: formatShanghaiDate(progressDate),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "更新每日巡店失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
