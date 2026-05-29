import {
  buildDailyPointTotalAmountLookup,
  getDailyPointTotalAmountInfo,
  type DailyPointTotalAmountLookup,
} from "@/lib/latest-daily-point-shops";
import { normalizeDateKey, normalizeText } from "@/lib/daily-point-derived";
import type {
  PremiumShopDailyDetail,
  PremiumShopPlatform,
  PremiumShopPlatformReport,
  PremiumShopReport,
  PremiumShopSource,
} from "./types";

const PLATFORM_LABELS: Record<PremiumShopPlatform, string> = {
  meituan: "美团",
  eleme: "饿了么",
};

const EMPTY_LATEST_DATE_BY_PLATFORM: Record<PremiumShopPlatform, string> = {
  meituan: "",
  eleme: "",
};

function normalizePremiumShopPlatform(value: unknown): PremiumShopPlatform {
  return normalizeText(value).includes("饿了么") ? "eleme" : "meituan";
}

function isActiveShop(shop: PremiumShopSource) {
  const status = normalizeText(shop.shopStatus);
  return status !== "已解约" && status !== "无效店铺";
}

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildLatestDateByPlatform(dailyDetails: PremiumShopDailyDetail[]) {
  const latestDateByPlatform = { ...EMPTY_LATEST_DATE_BY_PLATFORM };

  dailyDetails.forEach((detail) => {
    const platform = normalizeText(detail.platform) as PremiumShopPlatform;
    if (platform !== "meituan" && platform !== "eleme") return;

    const dateKey = normalizeDateKey(detail.recordDateKey);
    if (dateKey && dateKey > latestDateByPlatform[platform]) {
      latestDateByPlatform[platform] = dateKey;
    }
  });

  return latestDateByPlatform;
}

function createEmptyPlatformReport(
  platform: PremiumShopPlatform,
  latestDateKey: string
): PremiumShopPlatformReport {
  return {
    platform,
    platformLabel: PLATFORM_LABELS[platform],
    latestDateKey,
    items: [],
  };
}

export function buildPremiumShopReportFromLookup(params: {
  shops: PremiumShopSource[];
  amountLookup: DailyPointTotalAmountLookup;
  latestDateByPlatform?: Partial<Record<PremiumShopPlatform, string>>;
  generatedAt?: string;
}): PremiumShopReport {
  const latestDateByPlatform = {
    ...EMPTY_LATEST_DATE_BY_PLATFORM,
    ...params.latestDateByPlatform,
  };
  const platformReports = {
    meituan: createEmptyPlatformReport("meituan", latestDateByPlatform.meituan),
    eleme: createEmptyPlatformReport("eleme", latestDateByPlatform.eleme),
  };

  params.shops
    .filter(isActiveShop)
    .forEach((shop) => {
      const platform = normalizePremiumShopPlatform(shop.deliveryPlatform);
      const amountInfo = getDailyPointTotalAmountInfo(params.amountLookup, shop);
      const totalAmount = roundToTwo(amountInfo?.totalAmount ?? 0);

      platformReports[platform].items.push({
        rank: 0,
        shopId: normalizeText(shop._id),
        shopName: normalizeText(shop.shopName) || "-",
        merchantId: normalizeText(shop.merchantId),
        wechatGroupName: normalizeText(shop.wechatGroupName),
        totalAmount,
        updatedDateKey: amountInfo?.updatedDateKey || latestDateByPlatform[platform],
        platform,
        platformLabel: PLATFORM_LABELS[platform],
      });
    });

  (["meituan", "eleme"] as const).forEach((platform) => {
    platformReports[platform].items = platformReports[platform].items
      .sort((left, right) => {
        const amountDiff = right.totalAmount - left.totalAmount;
        if (amountDiff !== 0) return amountDiff;
        return left.shopName.localeCompare(right.shopName, "zh-CN");
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  });

  return {
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    meituan: platformReports.meituan,
    eleme: platformReports.eleme,
  };
}

export function buildPremiumShopReport(params: {
  shops: PremiumShopSource[];
  dailyDetails: PremiumShopDailyDetail[];
  latestDateByPlatform?: Partial<Record<PremiumShopPlatform, string>>;
  generatedAt?: string;
}) {
  const activeShops = params.shops.filter(isActiveShop);
  const latestDateByPlatform =
    params.latestDateByPlatform ?? buildLatestDateByPlatform(params.dailyDetails);
  const amountLookup = buildDailyPointTotalAmountLookup({
    shops: activeShops,
    dailyDetails: params.dailyDetails,
  });

  return buildPremiumShopReportFromLookup({
    shops: activeShops,
    amountLookup,
    latestDateByPlatform,
    generatedAt: params.generatedAt,
  });
}
