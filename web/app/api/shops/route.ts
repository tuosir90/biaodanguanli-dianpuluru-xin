import { NextRequest, NextResponse } from "next/server";
import { buildShopDropdownOptionBulkOperations } from "@/lib/dropdown-option-sync";
import {
  buildShopFilter,
  isWithinNewShopCycle,
  parsePositiveInt,
} from "@/lib/shop-query";
import { connectMongo } from "@/lib/mongodb";
import { clearReportReadCaches } from "@/lib/report-read-cache";
import { resolveSalesCity } from "@/lib/sales-city";
import { clearWorkflowReadCaches } from "@/lib/workflow-read-cache";
import { buildShopEmploymentStatusPatch } from "@/features/shops/employee-status";
import { DropdownOption } from "@/models/dropdown-option";
import { Shop } from "@/models/shop";

export const maxDuration = 30;
const MAX_PAGE_SIZE = 100;

type ShopPayload = {
  entryDate?: string;
  shopName: string;
  merchantId: string;
  wechatGroupName: string;
  city: string;
  salesName: string;
  salesCity?: string;
  contractSignedDate: string;
  operationMode: string;
  operatorName: string;
  deliveryPlatform: string;
};

type ShopUpdatePayload = {
  shopId: string;
  shopName?: string;
  operationMode?: string;
};

function dayStart(dateInput: Date) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInt(searchParams.get("pageSize"), 15),
      MAX_PAGE_SIZE
    );
    const filter = buildShopFilter(searchParams);

    const [data, total] = await Promise.all([
      Shop.find(filter)
        .select({
          entryDate: 1, shopName: 1, merchantId: 1, wechatGroupName: 1,
          city: 1, salesName: 1, salesEmploymentStatus: 1, salesCity: 1,
          contractSignedDate: 1, operationMode: 1, operatorName: 1,
          operatorEmploymentStatus: 1, deliveryPlatform: 1, shopStatus: 1,
          terminationDate: 1, terminationCooperationDays: 1,
        })
        .sort({ entryDate: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Shop.countDocuments(filter),
    ]);

    const todayDateKey = formatShanghaiDate(new Date());
    const normalizedData = data.map((item) => {
      const normalizedSalesCity = resolveSalesCity(
        String(item.salesName ?? ""),
        String(item.salesCity ?? "")
      );
      if (item.shopStatus === "已解约") return { ...item, salesCity: normalizedSalesCity };
      if (isWithinNewShopCycle(item.contractSignedDate, todayDateKey)) {
        return { ...item, salesCity: normalizedSalesCity, shopStatus: "新店" };
      }
      return { ...item, salesCity: normalizedSalesCity };
    });

    return NextResponse.json({ data: normalizedData, total, page, pageSize });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取店铺列表失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as ShopPayload;
    const shopName = payload.shopName?.trim();
    const contractSignedDateInput = new Date(payload.contractSignedDate);

    if (!shopName) {
      return NextResponse.json({ message: "店铺名不能为空" }, { status: 400 });
    }

    if (Number.isNaN(contractSignedDateInput.getTime())) {
      return NextResponse.json(
        { message: "合同签订日期格式不正确" },
        { status: 400 }
      );
    }

    const entryDateInput = payload.entryDate
      ? new Date(payload.entryDate)
      : new Date();
    const entryDate = dayStart(entryDateInput);
    const contractSignedDate = dayStart(contractSignedDateInput);
    const salesName = payload.salesName?.trim() ?? "";
    const operatorName = payload.operatorName?.trim() ?? "";
    const salesCity = resolveSalesCity(salesName, payload.salesCity);
    const employmentStatusPatch = buildShopEmploymentStatusPatch(salesName, operatorName);

    const created = await Shop.create({
      entryDate,
      shopName,
      merchantId: payload.merchantId?.trim() ?? "",
      wechatGroupName: payload.wechatGroupName?.trim() ?? "",
      city: payload.city?.trim() ?? "",
      salesName,
      salesCity,
      ...employmentStatusPatch,
      contractSignedDate,
      operationMode: payload.operationMode?.trim() ?? "",
      operatorName,
      deliveryPlatform: payload.deliveryPlatform?.trim() ?? "",
      shopStatus: isWithinNewShopCycle(contractSignedDate, formatShanghaiDate(new Date()))
        ? "新店"
        : "正常",
    });

    const dropdownOperations = buildShopDropdownOptionBulkOperations({
      salesName: payload.salesName,
      operationMode: payload.operationMode,
      operatorName: payload.operatorName,
      deliveryPlatform: payload.deliveryPlatform,
    });

    if (dropdownOperations.length > 0) {
      await DropdownOption.bulkWrite(dropdownOperations, { ordered: false });
    }

    clearWorkflowReadCaches();
    clearReportReadCaches();

    return NextResponse.json(
      { success: true, id: String(created._id) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "新增店铺失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongo();

    const payload = (await request.json()) as ShopUpdatePayload;
    const shopId = (payload.shopId ?? "").trim();
    const shopName = typeof payload.shopName === "string"
      ? payload.shopName.trim()
      : null;
    const operationMode = typeof payload.operationMode === "string"
      ? payload.operationMode.trim()
      : null;

    if (!shopId) {
      return NextResponse.json({ message: "店铺ID不能为空" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};

    if (shopName !== null) {
      if (!shopName) {
        return NextResponse.json({ message: "店铺名不能为空" }, { status: 400 });
      }
      updateFields.shopName = shopName;
    }

    if (operationMode !== null) {
      if (!operationMode) {
        return NextResponse.json({ message: "运营模式不能为空" }, { status: 400 });
      }
      updateFields.operationMode = operationMode;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "至少提供一个可更新字段" },
        { status: 400 }
      );
    }

    const result = await Shop.updateOne({ _id: shopId }, { $set: updateFields });

    if (!result.matchedCount) {
      return NextResponse.json({ message: "店铺不存在" }, { status: 404 });
    }
    clearWorkflowReadCaches();
    clearReportReadCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "更新店铺信息失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
