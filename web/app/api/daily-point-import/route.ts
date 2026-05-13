import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { extractDailyPointAmount, normalizeDateKey } from "@/lib/daily-point-derived";
import {
  DAILY_POINT_DATE_FIELDS,
  DAILY_POINT_MERCHANT_ID_FIELDS,
  DAILY_POINT_SHOP_NAME_FIELDS,
  DAILY_POINT_STORE_ID_FIELDS,
  detectDailyPointHeaderRange,
  pickByKeyword,
  pickFirstValue,
  resolveDailyPointImportUniqueKey,
} from "@/lib/daily-point-import-key";
import { connectMongo } from "@/lib/mongodb";
import { syncInvalidShopStatusByDailyPoint } from "@/lib/daily-point-status-sync";
import { clearReportReadCaches } from "@/lib/report-read-cache";
import { clearWorkflowReadCaches } from "@/lib/workflow-read-cache";
import { emitWorkflowRefreshSignal } from "@/lib/workflow-refresh-signal";
import { DailyPointDetail } from "@/models/daily-point-detail";

type PlatformType = "meituan" | "eleme";
type ImportMode = "upsert" | "replace";

export const runtime = "nodejs";
export const maxDuration = 60;

function parsePlatform(value: FormDataEntryValue | null): PlatformType | null {
  if (value === "meituan" || value === "eleme") {
    return value;
  }
  return null;
}

function parseMode(value: FormDataEntryValue | null): ImportMode {
  return value === "replace" ? "replace" : "upsert";
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const formData = await request.formData();
    const platform = parsePlatform(formData.get("platform"));
    const mode = parseMode(formData.get("mode"));
    const file = formData.get("file");

    if (!platform) {
      return NextResponse.json({ message: "platform 参数无效" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "请上传 Excel 文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const headerRange = detectDailyPointHeaderRange(worksheet, platform);

    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
      range: headerRange,
    });

    if (rows.length === 0) {
      return NextResponse.json({ message: "Excel 无有效数据" }, { status: 400 });
    }

    if (mode === "replace") {
      await DailyPointDetail.deleteMany({ platform });
    }

    const now = new Date();
    const operations = rows
      .map((row) => {
        const rowData: Record<string, string> = {};
        for (const key of Object.keys(row)) {
          const normalizedKey = normalizeText(key);
          if (!normalizedKey) continue;
          rowData[normalizedKey] = normalizeText(row[key]);
        }

        if (Object.keys(rowData).length === 0) {
          return null;
        }

        const merchantId = pickFirstValue(rowData, DAILY_POINT_MERCHANT_ID_FIELDS);
        const storeId = pickFirstValue(rowData, DAILY_POINT_STORE_ID_FIELDS);
        const shopName = pickFirstValue(rowData, DAILY_POINT_SHOP_NAME_FIELDS);
        const recordDate =
          pickFirstValue(rowData, DAILY_POINT_DATE_FIELDS) ||
          pickByKeyword(rowData, ["日期", "时间", "账期"]);
        const recordDateKey = normalizeDateKey(recordDate);
        const amountValue = extractDailyPointAmount(rowData, platform);
        const uniqueKey = resolveDailyPointImportUniqueKey(platform, rowData);

        return {
          updateOne: {
            filter: { platform, uniqueKey },
            update: {
              $set: {
                platform,
                uniqueKey,
                sheetName,
                rowData,
                merchantId,
                storeId,
                shopName,
                recordDate,
                recordDateKey,
                amountValue,
                importedAt: now,
              },
            },
            upsert: true,
          },
        };
      })
      .filter((operation): operation is NonNullable<typeof operation> => operation !== null);

    if (operations.length === 0) {
      return NextResponse.json({ message: "Excel 解析后无可入库记录" }, { status: 400 });
    }

    const result = await DailyPointDetail.bulkWrite(operations, { ordered: false });
    const statusSync = await syncInvalidShopStatusByDailyPoint(platform);
    clearWorkflowReadCaches();
    clearReportReadCaches();
    emitWorkflowRefreshSignal(`daily-point-import:${platform}`);

    return NextResponse.json({
      success: true,
      platform,
      mode,
      total: operations.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      statusSync,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "导入每日抽点明细失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
