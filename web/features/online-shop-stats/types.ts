export type OnlineShopCountPlatform = "meituan" | "eleme";

export type OnlineShopCountSnapshotItem = {
  platform: OnlineShopCountPlatform;
  statDateKey: string;
  count: number;
  capturedAt: Date | string;
  summaryText?: string;
};

export type OnlineShopCountLatestCard = {
  platform: OnlineShopCountPlatform;
  statDate: string;
  count: number;
  capturedAt: string;
};

export type OnlineShopCountTableRow = {
  date: string;
  meituanCount: number | null;
  meituanCapturedAt: string;
  elemeCount: number | null;
  elemeCapturedAt: string;
};

export type OnlineShopCountTrendSeries = {
  name: string;
  values: Array<{ date: string; value: number }>;
};

export type OnlineShopCountReport = {
  month: string;
  latestCards: OnlineShopCountLatestCard[];
  trendSeries: OnlineShopCountTrendSeries[];
  rows: OnlineShopCountTableRow[];
};
