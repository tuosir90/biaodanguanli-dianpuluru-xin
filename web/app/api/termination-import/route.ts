import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { connectMongo } from "@/lib/mongodb";
import { clearReportReadCaches } from "@/lib/report-read-cache";
import { clearWorkflowReadCaches } from "@/lib/workflow-read-cache";
import { emitWorkflowRefreshSignal } from "@/lib/workflow-refresh-signal";
import { TerminationDetail } from "@/models/termination-detail";
import { Shop } from "@/models/shop";

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

function parseDateValue(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function normalizeToDayStart(dateValue: Date) {
  const normalized = new Date(dateValue);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function calculateOperationDays(contractSignedDate: unknown, terminationDate: unknown) {
  const signedDate = toValidDate(contractSignedDate);
  const terminatedDate = toValidDate(terminationDate);
  if (!signedDate || !terminatedDate) {
    return null;
  }
  const signedDayStart = normalizeToDayStart(signedDate);
  const terminatedDayStart = normalizeToDayStart(terminatedDate);
  const diffMs = terminatedDayStart.getTime() - signedDayStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0) + 1;
}

function resolveUniqueKey(platform: PlatformType, rowData: Record<string, string>) {
  if (platform === "meituan") {
    const merchantId = normalizeText(rowData["商家ID"]);
    const applyTerminationTime = normalizeText(rowData["申请解约时间"]);
    const shopName = normalizeText(rowData["商家名称"]);
    return `${merchantId}__${applyTerminationTime || shopName}`;
  }

  const storeId = normalizeText(rowData["门店ID"]);
  const taskSubmittedTime = normalizeText(rowData["任务提交时间"]);
  const shopName = normalizeText(rowData["门店名称"]);
  return `${storeId}__${taskSubmittedTime || shopName}`;
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

    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      return NextResponse.json({ message: "Excel 无有效数据" }, { status: 400 });
    }

    if (mode === "replace") {
      await TerminationDetail.deleteMany({ platform });
    }

    const now = new Date();
    const terminationSyncMap = new Map<string, Date | null>();

    const operations = rows
      .map((row) => {
        const rowData: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = normalizeText(key);
          if (!normalizedKey) return;
          rowData[normalizedKey] = normalizeText(row[key]);
        });

        const uniqueKey = resolveUniqueKey(platform, rowData);
        if (!uniqueKey || uniqueKey.startsWith("__")) {
          return null;
        }

        const merchantId = normalizeText(rowData["商家ID"] || rowData["门店ID"]);
        const terminationDate =
          platform === "meituan"
            ? parseDateValue(normalizeText(rowData["申请解约时间"]))
            : parseDateValue(normalizeText(rowData["任务提交时间"]));
        if (merchantId) {
          const existing = terminationSyncMap.get(merchantId);
          if (!existing) {
            terminationSyncMap.set(merchantId, terminationDate);
          } else {
            const existingTime = existing?.getTime() ?? 0;
            const nextTime = terminationDate?.getTime() ?? 0;
            if (nextTime >= existingTime) {
              terminationSyncMap.set(merchantId, terminationDate);
            }
          }
        }

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
                storeId: normalizeText(rowData["门店ID"]),
                shopName: normalizeText(rowData["商家名称"] || rowData["门店名称"]),
                applyTerminationTime: normalizeText(rowData["申请解约时间"]),
                taskSubmittedTime: normalizeText(rowData["任务提交时间"]),
                importedAt: now,
              },
            },
            upsert: true,
          },
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    if (operations.length === 0) {
      return NextResponse.json({ message: "Excel 解析后无可入库记录" }, { status: 400 });
    }

    const result = await TerminationDetail.bulkWrite(operations, { ordered: false });

    const shopSyncOperations = Array.from(terminationSyncMap.entries()).map(
      ([merchantId, terminationDate]) => ({
        updateMany: {
          filter: { merchantId },
          update: {
            $set: {
              shopStatus: "已解约" as const,
              terminationDate,
            },
          },
        },
      })
    );

    const shopStatusSyncResult =
      shopSyncOperations.length > 0
        ? await Shop.bulkWrite(shopSyncOperations, { ordered: false })
        : null;

    const merchantIds = Array.from(terminationSyncMap.keys());
    const matchedShops =
      merchantIds.length > 0
        ? await Shop.find({ merchantId: { $in: merchantIds } })
            .select({ _id: 1, contractSignedDate: 1, terminationDate: 1 })
            .lean()
        : [];

    const shopDurationOperations = matchedShops
      .map((shop) => {
        const terminationCooperationDays = calculateOperationDays(
          shop.contractSignedDate,
          shop.terminationDate
        );
        return {
          updateOne: {
            filter: { _id: shop._id },
            update: {
              $set: {
                terminationCooperationDays,
              },
            },
          },
        };
      })
      .filter((operation) => operation !== null);

    const shopDurationSyncResult =
      shopDurationOperations.length > 0
        ? await Shop.bulkWrite(shopDurationOperations, { ordered: false })
        : null;
    clearWorkflowReadCaches();
    clearReportReadCaches();
    emitWorkflowRefreshSignal(`termination-import:${platform}`);

    return NextResponse.json({
      success: true,
      platform,
      mode,
      total: operations.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      shopStatusUpdated: shopStatusSyncResult?.modifiedCount ?? 0,
      cooperationDaysUpdated: shopDurationSyncResult?.modifiedCount ?? 0,
      merchantIdMatched: shopSyncOperations.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "导入解约明细失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
