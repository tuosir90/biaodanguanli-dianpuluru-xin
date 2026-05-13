import { DailyPointDetail } from "@/models/daily-point-detail";
import { isWithinNewShopCycle } from "@/lib/shop-query";
import { Shop } from "@/models/shop";
import { buildConsecutiveDateKeys, isDateKey } from "@/lib/date-key-utils";

type PlatformType = "meituan" | "eleme";
type ShopStatus = "正常" | "已解约" | "无效店铺" | "新店";

const REQUIRED_CONSECUTIVE_DAYS = 5;

type ShopLite = {
  _id: unknown;
  merchantId?: string;
  shopName?: string;
  contractSignedDate?: Date | string;
  shopStatus?: ShopStatus | string;
};

export type DailyPointStatusSyncResult = {
  platform: PlatformType;
  skipped: boolean;
  reason?: string;
  latestDate: string | null;
  targetDates: string[];
  totalShops: number;
  eligibleShops: number;
  matchedShops: number;
  invalidShops: number;
  normalShops: number;
  updatedShops: number;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function currentShanghaiDateKey() {
  return formatShanghaiDate(new Date());
}

export { buildConsecutiveDateKeys };

function buildPlatformShopFilter(platform: PlatformType) {
  if (platform === "eleme") {
    return { deliveryPlatform: { $regex: "饿了么" } };
  }
  return { deliveryPlatform: { $not: /饿了么/ } };
}

export async function syncInvalidShopStatusByDailyPoint(
  platform: PlatformType
): Promise<DailyPointStatusSyncResult> {
  const todayDateKey = currentShanghaiDateKey();
  const distinctDateValues = await DailyPointDetail.distinct("recordDate", {
    platform,
    recordDate: { $ne: "" },
  });

  const distinctDates = Array.from(
    new Set(
      distinctDateValues
        .map((item) => normalizeText(item))
        .filter((dateKey) => isDateKey(dateKey))
    )
  ).sort((a, b) => b.localeCompare(a));

  const latestDate = distinctDates[0] ?? null;
  if (!latestDate) {
    return {
      platform,
      skipped: true,
      reason: "当前平台没有可用的抽点日期数据",
      latestDate: null,
      targetDates: [],
      totalShops: 0,
      eligibleShops: 0,
      matchedShops: 0,
      invalidShops: 0,
      normalShops: 0,
      updatedShops: 0,
    };
  }

  const targetDates = buildConsecutiveDateKeys(latestDate, REQUIRED_CONSECUTIVE_DAYS);
  const dateSet = new Set(distinctDates);
  const hasConsecutiveDates =
    targetDates.length === REQUIRED_CONSECUTIVE_DAYS &&
    targetDates.every((dateKey) => dateSet.has(dateKey));

  if (!hasConsecutiveDates) {
    return {
      platform,
      skipped: true,
      reason: "最近5个自然日数据不完整，跳过自动状态同步",
      latestDate,
      targetDates,
      totalShops: 0,
      eligibleShops: 0,
      matchedShops: 0,
      invalidShops: 0,
      normalShops: 0,
      updatedShops: 0,
    };
  }

  const shops = (await Shop.find({
    ...buildPlatformShopFilter(platform),
    shopStatus: { $ne: "已解约" },
  })
    .select({ _id: 1, merchantId: 1, shopName: 1, contractSignedDate: 1, shopStatus: 1 })
    .lean()) as ShopLite[];

  if (shops.length === 0) {
    return {
      platform,
      skipped: false,
      latestDate,
      targetDates,
      totalShops: 0,
      eligibleShops: 0,
      matchedShops: 0,
      invalidShops: 0,
      normalShops: 0,
      updatedShops: 0,
    };
  }

  const eligibleShops = shops.filter((shop) => {
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    return Boolean(merchantId || shopName);
  });

  const merchantIds = Array.from(
    new Set(eligibleShops.map((shop) => normalizeText(shop.merchantId)).filter(Boolean))
  );
  const shopNames = Array.from(
    new Set(eligibleShops.map((shop) => normalizeText(shop.shopName)).filter(Boolean))
  );

  const [matchedStoreIds, matchedShopNames] = await Promise.all([
    merchantIds.length > 0
      ? DailyPointDetail.distinct("storeId", {
          platform,
          recordDate: { $in: targetDates },
          storeId: { $in: merchantIds },
        })
      : Promise.resolve([] as string[]),
    shopNames.length > 0
      ? DailyPointDetail.distinct("shopName", {
          platform,
          recordDate: { $in: targetDates },
          shopName: { $in: shopNames },
        })
      : Promise.resolve([] as string[]),
  ]);

  const matchedStoreIdSet = new Set(matchedStoreIds.map((item) => normalizeText(item)).filter(Boolean));
  const matchedShopNameSet = new Set(matchedShopNames.map((item) => normalizeText(item)).filter(Boolean));

  let matchedShops = 0;
  let invalidShops = 0;
  let normalShops = 0;
  const operations: Array<{
    updateOne: {
      filter: { _id: unknown; shopStatus: { $ne: "已解约" } };
      update: { $set: { shopStatus: "正常" | "无效店铺" | "新店" } };
    };
  }> = [];

  eligibleShops.forEach((shop) => {
    const merchantId = normalizeText(shop.merchantId);
    const shopName = normalizeText(shop.shopName);
    const currentStatus = normalizeText(shop.shopStatus || "正常");
    const matched = (merchantId && matchedStoreIdSet.has(merchantId)) || (shopName && matchedShopNameSet.has(shopName));
    const inNewShopCycle = isWithinNewShopCycle(shop.contractSignedDate, todayDateKey);
    const nextStatus: "正常" | "无效店铺" | "新店" =
      inNewShopCycle ? "新店" : matched ? "正常" : "无效店铺";

    if (inNewShopCycle) {
      normalShops += 1;
    } else if (matched) {
      matchedShops += 1;
      normalShops += 1;
    } else {
      invalidShops += 1;
    }

    if (currentStatus === nextStatus) {
      return;
    }

    operations.push({
      updateOne: {
        filter: { _id: shop._id, shopStatus: { $ne: "已解约" } },
        update: { $set: { shopStatus: nextStatus } },
      },
    });
  });

  if (operations.length > 0) {
    await Shop.bulkWrite(operations, { ordered: false });
  }

  return {
    platform,
    skipped: false,
    latestDate,
    targetDates,
    totalShops: shops.length,
    eligibleShops: eligibleShops.length,
    matchedShops,
    invalidShops,
    normalShops,
    updatedShops: operations.length,
  };
}
