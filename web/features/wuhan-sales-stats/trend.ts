import type { WuhanSalesDailyStatItem } from "./types";

type TrendPoint = {
  date: string;
  value: number;
};

type TrendSeries = {
  name: string;
  values: TrendPoint[];
};

export function buildWuhanSalesTrendSeries(dailyStats: WuhanSalesDailyStatItem[]) {
  const dailyPointShopSeries: TrendSeries[] = [
    {
      name: "每日抽点店铺数",
      values: dailyStats.map((item) => ({
        date: item.date,
        value: Number(item.dailyPointShopCount ?? 0),
      })),
    },
  ];

  const dailyPointAmountSeries: TrendSeries[] = [
    {
      name: "每日总回款金额",
      values: dailyStats.map((item) => ({
        date: item.date,
        value: Number(item.dailyPointAmountTotal ?? 0),
      })),
    },
  ];

  return {
    dailyPointShopSeries,
    dailyPointAmountSeries,
  };
}
