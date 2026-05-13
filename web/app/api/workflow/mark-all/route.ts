import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { clearWorkflowToggleCaches } from "@/lib/workflow-read-cache";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

export const maxDuration = 30;

type ProgressItem = {
  key: string;
  label: string;
};

type MarkAllPayload = {
  progressDate?: string;
  items: Array<{
    shopId: string;
    operatorName: string;
  }>;
  progressItems: ProgressItem[];
};

function dayStart(dateValue?: string) {
  const raw = dateValue ? new Date(dateValue) : new Date();
  const date = Number.isNaN(raw.getTime()) ? new Date() : raw;
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as MarkAllPayload;
    const progressDate = dayStart(payload.progressDate);

    if (!payload.items?.length || !payload.progressItems?.length) {
      return NextResponse.json({ message: "参数不完整" }, { status: 400 });
    }

    const now = new Date();
    const operations = payload.items.flatMap((item) =>
      payload.progressItems.map((progress) => ({
        updateOne: {
          filter: {
            shopId: item.shopId,
            progressDate,
            progressKey: progress.key,
          },
          update: {
            $set: {
              operatorName: item.operatorName,
              progressLabel: progress.label,
              completed: true,
              completedAt: now,
            },
          },
          upsert: true,
        },
      }))
    );

    if (operations.length > 0) {
      await WorkflowProgressLog.bulkWrite(operations, { ordered: false });
    }
    clearWorkflowToggleCaches();

    return NextResponse.json({ success: true, updated: operations.length });
  } catch (error) {
    return NextResponse.json(
      {
        message: "批量标记完成失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
