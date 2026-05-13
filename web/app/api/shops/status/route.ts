import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { clearReportReadCaches } from "@/lib/report-read-cache";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

type Payload = {
  shopId: string;
  shopStatus: "正常" | "已解约" | "无效店铺" | "新店";
};

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as Payload;
    if (!payload.shopId || !payload.shopStatus) {
      return NextResponse.json({ message: "参数不完整" }, { status: 400 });
    }

    if (!["正常", "已解约", "无效店铺", "新店"].includes(payload.shopStatus)) {
      return NextResponse.json({ message: "状态值非法" }, { status: 400 });
    }

    await Shop.updateOne(
      { _id: payload.shopId },
      { $set: { shopStatus: payload.shopStatus } }
    );
    clearReportReadCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "更新店铺状态失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
