import type { DailyPointTotalAmountRow } from "@/lib/latest-daily-point-shops";

export type PremiumShopPlatform = "meituan" | "eleme";

export type PremiumShopSource = {
  _id?: unknown;
  shopName?: string | null;
  merchantId?: string | null;
  wechatGroupName?: string | null;
  deliveryPlatform?: string | null;
  shopStatus?: string | null;
  contractSignedDate?: Date | string | null;
};

export type PremiumShopDailyDetail = DailyPointTotalAmountRow;

export type PremiumShopListItem = {
  rank: number;
  shopId: string;
  shopName: string;
  merchantId: string;
  wechatGroupName: string;
  totalAmount: number;
  cooperationDays: number;
  averageDailyAmount: number;
  updatedDateKey: string;
  platform: PremiumShopPlatform;
  platformLabel: string;
};

export type PremiumShopPlatformReport = {
  platform: PremiumShopPlatform;
  platformLabel: string;
  latestDateKey: string;
  items: PremiumShopListItem[];
};

export type PremiumShopReport = {
  generatedAt: string;
  meituan: PremiumShopPlatformReport;
  eleme: PremiumShopPlatformReport;
};
