export type WuhanSalesSignedShopItem = {
  shopId: string;
  shopName: string;
  merchantId: string;
  salesName: string;
  contractSignedDate: string;
};

export type WuhanSalesDailyStatItem = {
  date: string;
  dailyPointShopCount: number;
  dailyPointAmountTotal: number;
  meituanDailyPointShopCount: number;
  meituanDailyPointAmountTotal: number;
  elemeDailyPointShopCount: number;
  elemeDailyPointAmountTotal: number;
  signedShopCount: number;
  signedShops: WuhanSalesSignedShopItem[];
};

export type WuhanSalesStatsSummary = {
  totalSignedShopCount: number;
  totalDailyPointAmount: number;
  totalSalesPersonCount: number;
};

export type WuhanSalesStatsReportResult = {
  summary: WuhanSalesStatsSummary;
  dailyStats: WuhanSalesDailyStatItem[];
};

export type WuhanSalesStatsResponse = {
  month: string;
  summary: WuhanSalesStatsSummary;
  dailyStats: WuhanSalesDailyStatItem[];
};
