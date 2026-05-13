type TrendItem = {
  name?: string;
  count: number;
};

const SALES_CITY_ORDER = ["武汉", "宜昌"] as const;

export function buildSalesCityShopTrend(items: TrendItem[]) {
  const countMap = new Map<string, number>();

  items.forEach((item) => {
    const name = String(item.name ?? "").trim();
    if (!SALES_CITY_ORDER.includes(name as (typeof SALES_CITY_ORDER)[number])) {
      return;
    }

    countMap.set(name, Number(item.count ?? 0));
  });

  return SALES_CITY_ORDER.map((name) => ({
    name,
    count: countMap.get(name) ?? 0,
  }));
}
