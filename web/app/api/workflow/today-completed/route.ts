import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

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

function getTodayRangeShanghai() {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const start = new Date(`${dateKey}T00:00:00+08:00`);
  const end = new Date(`${dateKey}T23:59:59.999+08:00`);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const shopIds = parseMultiValue(request.nextUrl.searchParams.get("shopIds"));
    const objectIds = parseObjectIdList(shopIds);
    if (objectIds.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const { start, end } = getTodayRangeShanghai();
    const logs = await WorkflowProgressLog.find({
      shopId: { $in: objectIds },
      completed: true,
      completedAt: { $gte: start, $lte: end },
    })
      .select({ _id: 0, shopId: 1, progressKey: 1 })
      .lean();

    return NextResponse.json({
      logs: logs.map((item) => ({
        shopId: String(item.shopId),
        progressKey: item.progressKey,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取今日已完成流程记录失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
