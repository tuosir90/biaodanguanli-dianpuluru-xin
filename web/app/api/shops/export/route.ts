import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import * as xlsx from "xlsx";
import { connectMongo } from "@/lib/mongodb";
import { resolveSalesCity } from "@/lib/sales-city";
import { formatShanghaiDateKey } from "@/lib/shanghai-date";
import { Shop } from "@/models/shop";

export const runtime = "nodejs";
export const maxDuration = 120;

function formatDate(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return formatShanghaiDateKey(date);
}

function formatDateTime(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export async function GET() {
  const requestId = randomUUID();
  const startedAt = performance.now();
  let stage = "connect";
  let stageStartedAt = startedAt;
  const logStage = (phase: "start" | "complete", details: Record<string, number> = {}) => {
    console.info(JSON.stringify({
      event: "shop_export",
      requestId,
      stage,
      phase,
      elapsedMs: Math.round(performance.now() - startedAt),
      durationMs: Math.round(performance.now() - stageStartedAt),
      ...details,
    }));
  };
  const beginStage = (nextStage: string) => {
    stage = nextStage;
    stageStartedAt = performance.now();
    logStage("start");
  };

  try {
    logStage("start");
    await connectMongo();
    logStage("complete");

    beginStage("read");
    const rows = await Shop.find({})
      .select({
        entryDate: 1, shopName: 1, merchantId: 1, wechatGroupName: 1,
        city: 1, salesName: 1, salesCity: 1, contractSignedDate: 1,
        operationMode: 1, operatorName: 1, deliveryPlatform: 1,
        shopStatus: 1, terminationDate: 1, terminationCooperationDays: 1,
        createdAt: 1, updatedAt: 1,
      })
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();
    logStage("complete", { rowCount: rows.length });

    beginStage("format");
    const exportRows = rows.map((item) => ({
      "店铺ID": String(item._id),
      "录入日期": formatDate(item.entryDate),
      "店铺名": item.shopName ?? "",
      "商家ID": item.merchantId ?? "",
      "微信群名": item.wechatGroupName ?? "",
      "店铺城市": item.city ?? "",
      "开单销售": item.salesName ?? "",
      "销售所属城市": resolveSalesCity(item.salesName, item.salesCity),
      "合同签订日期": formatDate(item.contractSignedDate),
      "运营模式": item.operationMode ?? "",
      "负责运营": item.operatorName ?? "",
      "外卖平台": item.deliveryPlatform ?? "",
      "店铺状态": item.shopStatus ?? "",
      "解约日期": formatDate(item.terminationDate),
      "解约合作天数":
        typeof item.terminationCooperationDays === "number"
          ? String(item.terminationCooperationDays)
          : "",
      "创建时间": formatDateTime(item.createdAt),
      "更新时间": formatDateTime(item.updatedAt),
    }));
    logStage("complete", { rowCount: exportRows.length });

    beginStage("xlsx");
    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "店铺数据");

    const buffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    });
    logStage("complete", { bytes: buffer.length });
    const fileName = `shops-all-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "X-Shop-Export-Request-Id": requestId,
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "shop_export",
      requestId,
      stage,
      phase: "error",
      elapsedMs: Math.round(performance.now() - startedAt),
      errorType: error instanceof Error ? error.name : "unknown_error",
    }));
    return NextResponse.json(
      {
        message: "导出店铺数据失败",
        error: error instanceof Error ? error.name : "unknown_error",
        requestId,
      },
      { status: 500 }
    );
  }
}
