import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildShopFilter } from "@/lib/shop-query";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const filter = buildShopFilter(request.nextUrl.searchParams);
    const rows = await Shop.find(filter)
      .select({ merchantId: 1 })
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

    const merchantIds = rows
      .map((item) => (item.merchantId ?? "").trim())
      .filter(Boolean)
      .join("\n");

    return new NextResponse(merchantIds, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "\u83b7\u53d6\u5546\u5bb6ID\u5217\u8868\u5931\u8d25",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
