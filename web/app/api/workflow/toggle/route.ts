import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { clearWorkflowToggleCaches } from "@/lib/workflow-read-cache";
import { Shop } from "@/models/shop";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

export const maxDuration = 30;

type TogglePayload = {
  shopId: string;
  operatorName: string;
  progressKey: string;
  progressLabel: string;
  completed: boolean;
};

function dayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as TogglePayload;

    if (!payload.shopId || !payload.progressKey || !payload.progressLabel) {
      return NextResponse.json({ message: "参数不完整" }, { status: 400 });
    }

    const shop = await Shop.findById(payload.shopId).select({ _id: 1 }).lean();

    if (!shop) {
      return NextResponse.json({ message: "店铺不存在" }, { status: 404 });
    }

    const now = new Date();
    const result = await WorkflowProgressLog.updateMany(
      {
        shopId: payload.shopId,
        progressKey: payload.progressKey,
      },
      {
        $set: {
          operatorName: payload.operatorName,
          progressLabel: payload.progressLabel,
          completed: payload.completed,
          completedAt: payload.completed ? now : null,
        },
      }
    );

    if ((result.matchedCount ?? 0) === 0) {
      await WorkflowProgressLog.updateOne(
        {
          shopId: payload.shopId,
          progressKey: payload.progressKey,
          progressDate: dayStart(),
        },
        {
          $set: {
            operatorName: payload.operatorName,
            progressLabel: payload.progressLabel,
            completed: payload.completed,
            completedAt: payload.completed ? now : null,
          },
        },
        { upsert: true }
      );
    }
    clearWorkflowToggleCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "更新工作进度失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
