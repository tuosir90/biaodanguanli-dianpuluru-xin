import { NextRequest, NextResponse } from "next/server";
import { parsePositiveInt } from "@/lib/shop-query";
import { connectMongo } from "@/lib/mongodb";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";
import {
  SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS,
  SALES_INVALID_SHOPS_THRESHOLD_AMOUNT,
  SALES_INVALID_SHOPS_WINDOW_DAYS,
} from "@/features/sales-invalid-shops/constants";
import { buildSalesInvalidShopsMonthRange } from "@/features/sales-invalid-shops/month";
import {
  buildSalesInvalidShopsReport,
  filterSalesInvalidShopsBySignedMonth,
} from "@/features/sales-invalid-shops/report";
import {
  normalizeText,
} from "@/features/sales-invalid-shops/shared";
import type {
  SalesInvalidShopDetailItem,
  SalesInvalidShopsResponse,
  SalesInvalidShopsView,
} from "@/features/sales-invalid-shops/types";

export const maxDuration = 30;

const MAX_PAGE_SIZE = 100;
const SALES_INVALID_SHOPS_REPORT_CACHE_NAMESPACE = "sales-invalid";

type SalesInvalidShopsReportResult = ReturnType<typeof buildSalesInvalidShopsReport>;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseView(value: string | null): SalesInvalidShopsView {
  if (value === "invalid" || value === "terminated" || value === "final") {
    return value;
  }
  return "final";
}

async function findLatestDailyPointDateKeysByPlatform() {
  const rows = await DailyPointDetail.aggregate<{
    _id: "meituan" | "eleme";
    latestDateKey: string;
  }>([
    { $match: { recordDateKey: { $exists: true, $ne: "" } } },
    { $group: { _id: "$platform", latestDateKey: { $max: "$recordDateKey" } } },
  ]);

  return rows.reduce<Record<"meituan" | "eleme", string>>(
    (accumulator, row) => {
      accumulator[row._id] = normalizeText(row.latestDateKey);
      return accumulator;
    },
    { meituan: "", eleme: "" }
  );
}

async function loadSalesInvalidShopsReport(
  month: string,
  monthRange: NonNullable<ReturnType<typeof buildSalesInvalidShopsMonthRange>>
) {
  const [shops, latestAvailableDateKeys] = await Promise.all([
    Shop.find({
      contractSignedDate: { $gte: monthRange.queryStart, $lt: monthRange.end },
    })
      .select({
        _id: 1,
        shopName: 1,
        merchantId: 1,
        deliveryPlatform: 1,
        city: 1,
        salesName: 1,
        operatorName: 1,
        contractSignedDate: 1,
        shopStatus: 1,
        terminationDate: 1,
        terminationCooperationDays: 1,
      })
      .lean(),
    findLatestDailyPointDateKeysByPlatform(),
  ]);

  const normalizedShops = shops.map((shop) => ({
    _id: String(shop._id),
    shopName: shop.shopName,
    merchantId: shop.merchantId,
    deliveryPlatform: shop.deliveryPlatform,
    city: shop.city,
    salesName: shop.salesName,
    operatorName: shop.operatorName,
    contractSignedDate: shop.contractSignedDate,
    shopStatus: shop.shopStatus,
    terminationDate: shop.terminationDate,
    terminationCooperationDays: shop.terminationCooperationDays,
  }));

  const monthlyShops = filterSalesInvalidShopsBySignedMonth(
    month,
    normalizedShops
  );
  const merchantIds = Array.from(
    new Set(monthlyShops.map((shop) => normalizeText(shop.merchantId)).filter(Boolean))
  );
  const shopNames = Array.from(
    new Set(monthlyShops.map((shop) => normalizeText(shop.shopName)).filter(Boolean))
  );

  const detailFilters: Array<Record<string, unknown>> = [];
  if (merchantIds.length > 0) {
    detailFilters.push({ merchantId: { $in: merchantIds } });
    detailFilters.push({ storeId: { $in: merchantIds } });
  }
  if (shopNames.length > 0) {
    detailFilters.push({ shopName: { $in: shopNames } });
  }

  const dailyDetails =
    detailFilters.length > 0
      ? await DailyPointDetail.find({
          recordDateKey: {
            $gte: monthRange.startDateKey,
            $lte: monthRange.windowEndDateKey,
          },
          $or: detailFilters,
        })
          .select({
            _id: 0,
            platform: 1,
            merchantId: 1,
            storeId: 1,
            shopName: 1,
            recordDateKey: 1,
            amountValue: 1,
          })
          .lean()
      : [];

  return buildSalesInvalidShopsReport({
    month,
    shops: monthlyShops,
    dailyDetails,
    latestAvailableDateKeys,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = (searchParams.get("month") ?? currentMonth()).trim();
    const view = parseView(searchParams.get("view"));
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), 20), MAX_PAGE_SIZE);
    const salesName = (searchParams.get("salesName") ?? "").trim();
    const keyword = (searchParams.get("keyword") ?? "").trim().toLowerCase();

    const monthRange = buildSalesInvalidShopsMonthRange(month);
    if (!monthRange) {
      return NextResponse.json({ message: "month 参数无效" }, { status: 400 });
    }

    const cachedReport = getCachedReportPayload<SalesInvalidShopsReportResult>(
      SALES_INVALID_SHOPS_REPORT_CACHE_NAMESPACE,
      month
    );

    let report = cachedReport;
    if (!report) {
      await connectMongo();
      report = await loadSalesInvalidShopsReport(month, monthRange);
      setCachedReportPayload(
        SALES_INVALID_SHOPS_REPORT_CACHE_NAMESPACE,
        month,
        report
      );
    }

    const detailsByView: Record<SalesInvalidShopsView, SalesInvalidShopDetailItem[]> = {
      final: report.finalDetails,
      invalid: report.invalidDetails,
      terminated: report.terminatedWithinDaysDetails,
    };

    const filteredDetails = detailsByView[view].filter((item) => {
      const matchesSales = salesName ? item.salesName === salesName : true;
      const matchesKeyword = keyword
        ? item.shopName.toLowerCase().includes(keyword) ||
          item.merchantId.toLowerCase().includes(keyword)
        : true;
      return matchesSales && matchesKeyword;
    });

    const total = filteredDetails.length;
    const offset = (page - 1) * pageSize;
    const data = filteredDetails.slice(offset, offset + pageSize);

    const payload: SalesInvalidShopsResponse = {
      month,
      view,
      windowDays: SALES_INVALID_SHOPS_WINDOW_DAYS,
      thresholdAmount: SALES_INVALID_SHOPS_THRESHOLD_AMOUNT,
      terminationWithinDays: SALES_INVALID_SHOPS_TERMINATION_WITHIN_DAYS,
      counts: {
        invalid: report.invalidDetails.length,
        terminatedWithinDays: report.terminatedWithinDaysDetails.length,
        final: report.finalDetails.length,
      },
      summary: report.summary,
      data,
      total,
      page,
      pageSize,
    };

    return NextResponse.json(payload, { headers: REPORT_READ_RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        message: "销售无效店铺统计数据加载失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
