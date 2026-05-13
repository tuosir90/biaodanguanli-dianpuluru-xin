import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { ensureMonthlyDailyPointDerivedPrepared } from "@/lib/daily-point-derived-prep";
import {
  getCachedReportPayload,
  REPORT_READ_RESPONSE_HEADERS,
  setCachedReportPayload,
} from "@/lib/report-read-cache";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";
import {
  buildWuhanSalesDetailFilterSets,
  buildWuhanSalesSignedShopCohort,
} from "@/features/wuhan-sales-stats/cohort";
import {
  buildWuhanSalesStatsMonthRange,
  getWuhanSalesStatsMinStartDate,
  normalizeWuhanSalesStatsMonth,
  shiftWuhanSalesStatsDateKey,
} from "@/features/wuhan-sales-stats/month";
import { buildWuhanSalesShopDetailsReport } from "@/features/wuhan-sales-stats/shop-details-report";
import type { WuhanSalesShopDetailsResponse } from "@/features/wuhan-sales-stats/shop-details-types";

export const maxDuration = 30;
const WUHAN_SALES_SHOP_DETAILS_CACHE_NAMESPACE = "wuhan-sales-shop-details";

function currentMonth() {
  const now = new Date();
  return normalizeWuhanSalesStatsMonth(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatYearMonth(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const month = normalizeWuhanSalesStatsMonth(
      request.nextUrl.searchParams.get("month") ?? currentMonth()
    );
    const cachedPayload = getCachedReportPayload<WuhanSalesShopDetailsResponse>(
      WUHAN_SALES_SHOP_DETAILS_CACHE_NAMESPACE,
      month
    );
    if (cachedPayload) {
      return NextResponse.json(cachedPayload, {
        headers: REPORT_READ_RESPONSE_HEADERS,
      });
    }

    await connectMongo();
    const monthRange = buildWuhanSalesStatsMonthRange(month);
    if (!monthRange) {
      return NextResponse.json({ message: "month 参数无效" }, { status: 400 });
    }
    const nextMonth = formatYearMonth(monthRange.end);
    const detailFetchEndDateKey = shiftWuhanSalesStatsDateKey(
      monthRange.endDateKey,
      1
    );

    await Promise.all([
      ensureMonthlyDailyPointDerivedPrepared("meituan", month),
      ensureMonthlyDailyPointDerivedPrepared("eleme", month),
      ensureMonthlyDailyPointDerivedPrepared("meituan", nextMonth),
      ensureMonthlyDailyPointDerivedPrepared("eleme", nextMonth),
    ]);

    const shops = await Shop.find({
      $and: [
        {
          $or: [
            {
              entryDate: {
                $gte: getWuhanSalesStatsMinStartDate(),
                $lt: monthRange.end,
              },
            },
            {
              contractSignedDate: {
                $gte: getWuhanSalesStatsMinStartDate(),
                $lt: monthRange.end,
              },
            },
          ],
        },
        {
          $or: [{ salesName: { $ne: "" } }, { salesCity: { $ne: "" } }],
        },
      ],
    })
      .select({
        _id: 1,
        shopName: 1,
        merchantId: 1,
        deliveryPlatform: 1,
        salesName: 1,
        salesCity: 1,
        entryDate: 1,
        contractSignedDate: 1,
      })
      .lean();

    const reportShops = buildWuhanSalesSignedShopCohort({
      month,
      shops: shops.map((shop) => ({
        _id: String(shop._id),
        shopName: shop.shopName,
        merchantId: shop.merchantId,
        deliveryPlatform: shop.deliveryPlatform,
        salesName: shop.salesName,
        salesCity: shop.salesCity,
        entryDate: shop.entryDate,
        contractSignedDate: shop.contractSignedDate,
      })),
    });
    const { detailFilters } = buildWuhanSalesDetailFilterSets(reportShops);

    const dailyDetails =
      detailFilters.length > 0
        ? await DailyPointDetail.find({
            recordDateKey: {
              $gte: monthRange.startDateKey,
              $lte: detailFetchEndDateKey,
            },
            $or: detailFilters,
          })
            .select({
              _id: 0,
              platform: 1,
              merchantId: 1,
              storeId: 1,
              shopName: 1,
              recordDate: 1,
              recordDateKey: 1,
              amountValue: 1,
              rowData: 1,
            })
            .lean()
        : [];

    const report = buildWuhanSalesShopDetailsReport({
      month,
      shops: reportShops,
      dailyDetails,
    });

    const payload: WuhanSalesShopDetailsResponse = {
      month,
      summary: report.summary,
      data: report.details,
      total: report.details.length,
    };

    setCachedReportPayload(WUHAN_SALES_SHOP_DETAILS_CACHE_NAMESPACE, month, payload);

    return NextResponse.json(payload, { headers: REPORT_READ_RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        message: "武汉销售店铺明细加载失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
