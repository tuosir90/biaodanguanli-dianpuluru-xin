import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { DailyPointDetail } from "@/models/daily-point-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildMongoDebugMeta() {
  const uri = process.env.MONGODB_URI ?? "";
  const matched = uri.match(/^mongodb:\/\/[^@]+@([^:/?#]+)(?::(\d+))?/i);
  const host = matched?.[1] ?? "";
  const port = matched?.[2] ?? "";
  const fingerprint = uri
    ? createHash("sha256").update(uri).digest("hex").slice(0, 12)
    : "";

  return {
    host,
    port,
    fingerprint,
  };
}

export async function GET() {
  try {
    await connectMongo();

    const latestByPlatform = await DailyPointDetail.aggregate([
      { $match: { recordDateKey: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$platform",
          latestDateKey: { $max: "$recordDateKey" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const latestRows = await DailyPointDetail.find({
      recordDateKey: { $in: ["2026-03-29", "2026-03-30", "2026-03-31"] },
    })
      .select({
        _id: 0,
        platform: 1,
        recordDateKey: 1,
        amountValue: 1,
        merchantId: 1,
        storeId: 1,
        shopName: 1,
      })
      .sort({ recordDateKey: 1, platform: 1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      commitSha:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.GIT_COMMIT_SHA ??
        "unknown",
      mongo: buildMongoDebugMeta(),
      latestByPlatform: latestByPlatform.map((item) => ({
        platform: normalizeText(item._id),
        latestDateKey: normalizeText(item.latestDateKey),
        count: Number(item.count ?? 0),
      })),
      latestRows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "武汉销售诊断信息加载失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
