import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { TerminationDetail } from "@/models/termination-detail";

type PlatformType = "meituan" | "eleme";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_PAGE_SIZE = 200;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parsePlatform(value: string | null): PlatformType | null {
  if (value === "meituan" || value === "eleme") {
    return value;
  }
  return null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const platform = parsePlatform(searchParams.get("platform"));
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get("pageSize"), 50),
      MAX_PAGE_SIZE
    );
    const keyword = (searchParams.get("keyword") ?? "").trim();

    if (!platform) {
      return NextResponse.json({ message: "platform 参数无效" }, { status: 400 });
    }

    const filter: Record<string, unknown> = { platform };

    if (keyword) {
      const escapedKeyword = escapeRegex(keyword);
      const regexFilter = { $regex: escapedKeyword, $options: "i" };

      filter.$or = [
        { merchantId: regexFilter },
        { storeId: regexFilter },
        { shopName: regexFilter },
        { sheetName: regexFilter },
      ];
    }
    const sort: Array<[string, 1 | -1]> =
      platform === "meituan"
        ? [["applyTerminationTime", -1], ["importedAt", -1], ["updatedAt", -1]]
        : [["taskSubmittedTime", -1], ["importedAt", -1], ["updatedAt", -1]];

    const [docs, total] = await Promise.all([
      TerminationDetail.find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select({ _id: 0, rowData: 1, sheetName: 1 })
        .lean(),
      TerminationDetail.countDocuments(filter),
    ]);

    const columns =
      docs.length > 0 && docs[0].rowData
        ? Object.keys((docs[0].rowData ?? {}) as Record<string, string>).filter(Boolean)
        : [];

    const data = docs.map((doc) => (doc.rowData ?? {}) as Record<string, string>);
    const sheetName = docs.length > 0 ? (docs[0].sheetName ?? "") : "";

    return NextResponse.json({
      platform,
      sheetName,
      columns,
      total,
      page,
      pageSize,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "读取解约明细失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
