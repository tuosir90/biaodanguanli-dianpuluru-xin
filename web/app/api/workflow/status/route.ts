import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import {
  buildWorkflowStatusCacheKey,
  getCachedWorkflowStatus,
  setCachedWorkflowStatus,
} from "@/lib/workflow-read-cache";
import { getWorkflowEffectiveCompletedKeys } from "@/lib/workflow-flow-metrics";
import { WORKFLOW_ALL_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { fetchWorkflowStatusSnapshotByShopIds } from "@/lib/workflow-status-snapshot";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

function parseMultiValue(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseObjectIdList(values: string[]) {
  return values
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
}

type StatusBatchPayload = {
  operatorName?: string;
  shopIds?: string[];
};

type WorkflowStatusLog = {
  shopId: string;
  progressKey: string;
  completed: boolean;
};

async function queryStatusLogs(operatorName: string, shopIds: string[]) {
  const shopQuery: Record<string, unknown> = {
    shopStatus: { $ne: "已解约" },
  };

  if (operatorName) {
    shopQuery.operatorName = operatorName;
  }

  let targetShops: Array<{
    _id: unknown;
    shopStatus?: string;
    deliveryPlatform?: string;
  }> = [];

  if (shopIds.length > 0) {
    const objectIds = parseObjectIdList(shopIds);
    if (objectIds.length === 0) {
      return [];
    }
    shopQuery._id = { $in: objectIds };
  }

  targetShops = await Shop.find(shopQuery)
    .select({ _id: 1, shopStatus: 1, deliveryPlatform: 1 })
    .lean();

  if (targetShops.length === 0) {
    return [];
  }

  const targetShopIds = targetShops.map((shop) => shop._id);
  const statusSnapshotMap = await fetchWorkflowStatusSnapshotByShopIds(
    targetShopIds,
    WORKFLOW_ALL_PROGRESS_KEYS
  );

  const normalizedLogs: WorkflowStatusLog[] = [];

  targetShops.forEach((shop) => {
    const shopId = String(shop._id);
    const snapshot = statusSnapshotMap.get(shopId);
    const completedKeys = getWorkflowEffectiveCompletedKeys({
      deliveryPlatform: shop.deliveryPlatform,
      shopStatus: shop.shopStatus,
      completedKeys: snapshot?.completedKeys,
      loggedKeys: snapshot?.loggedKeys,
    });

    completedKeys.forEach((progressKey) => {
      normalizedLogs.push({ shopId, progressKey, completed: true });
    });
  });

  return normalizedLogs;
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const operatorName = (searchParams.get("operatorName") ?? "").trim();
    const shopIds = parseMultiValue(searchParams.get("shopIds"));
    const cacheKey = buildWorkflowStatusCacheKey(operatorName, shopIds);
    const cached = getCachedWorkflowStatus<WorkflowStatusLog[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ logs: cached });
    }

    const logs = await queryStatusLogs(operatorName, shopIds);
    setCachedWorkflowStatus(cacheKey, logs);

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取工作进度状态失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as StatusBatchPayload;
    const operatorName = (payload.operatorName ?? "").trim();
    const shopIds = Array.isArray(payload.shopIds)
      ? payload.shopIds.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const cacheKey = buildWorkflowStatusCacheKey(operatorName, shopIds);
    const cached = getCachedWorkflowStatus<WorkflowStatusLog[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ logs: cached });
    }

    const logs = await queryStatusLogs(operatorName, shopIds);
    setCachedWorkflowStatus(cacheKey, logs);

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      {
        message: "批量获取工作进度状态失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
