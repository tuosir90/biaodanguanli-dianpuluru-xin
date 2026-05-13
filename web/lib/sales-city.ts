const WUHAN_SALES_NAMES = new Set(["屈维涛", "李帅", "向文强"]);

type SalesCityMapItem = {
  salesName?: string | null;
  salesCity?: string | null;
};

export function normalizeSalesCity(salesCity?: string | null) {
  const normalizedSalesCity = String(salesCity ?? "").trim();
  if (normalizedSalesCity === "武汉" || normalizedSalesCity === "宜昌") {
    return normalizedSalesCity;
  }
  return "";
}

export function resolveSalesCity(
  salesName?: string | null,
  preferredSalesCity?: string | null
) {
  const normalizedPreferredSalesCity = normalizeSalesCity(preferredSalesCity);
  if (normalizedPreferredSalesCity) {
    return normalizedPreferredSalesCity;
  }

  const normalizedSalesName = String(salesName ?? "").trim();

  if (!normalizedSalesName) {
    return "";
  }

  return WUHAN_SALES_NAMES.has(normalizedSalesName) ? "武汉" : "宜昌";
}

export function buildSalesCityMap(items: SalesCityMapItem[]) {
  const map: Record<string, string> = {};

  items.forEach((item) => {
    const normalizedSalesName = String(item.salesName ?? "").trim();
    if (!normalizedSalesName) {
      return;
    }

    if (WUHAN_SALES_NAMES.has(normalizedSalesName)) {
      map[normalizedSalesName] = "武汉";
      return;
    }

    map[normalizedSalesName] = resolveSalesCity(normalizedSalesName, item.salesCity);
  });

  return map;
}
