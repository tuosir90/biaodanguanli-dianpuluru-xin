import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { connectMongo } from "@/lib/mongodb";
import { resolveSalesCity } from "@/lib/sales-city";
import { Shop } from "@/models/shop";

export const runtime = "nodejs";
export const maxDuration = 30;

function formatDate(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export async function GET() {
  try {
    await connectMongo();

    const rows = await Shop.find({})
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

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

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "店铺数据");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `shops-all-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "导出店铺数据失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
