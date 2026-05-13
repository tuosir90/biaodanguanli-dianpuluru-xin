export type ShopListSearchParamsOptions = {
  page?: number;
  pageSize?: number;
  operator: string[];
  operatorStatus?: string;
  platform: string[];
  sales: string[];
  salesStatus?: string;
  salesCity: string[];
  startDate: string;
  endDate: string;
  shopNameKeyword: string;
  merchantIdKeyword: string;
};

export function buildShopListSearchParams(
  options: ShopListSearchParamsOptions
) {
  const search = new URLSearchParams();

  if (options.page) {
    search.set("page", String(options.page));
  }
  if (options.pageSize) {
    search.set("pageSize", String(options.pageSize));
  }
  if (options.startDate) {
    search.set("startDate", options.startDate);
  }
  if (options.endDate) {
    search.set("endDate", options.endDate);
  }
  if (options.operator.length > 0) {
    search.set("operator", options.operator.join(","));
  }
  if (options.operatorStatus) {
    search.set("operatorStatus", options.operatorStatus);
  }
  if (options.platform.length > 0) {
    search.set("platform", options.platform.join(","));
  }
  if (options.sales.length > 0) {
    search.set("sales", options.sales.join(","));
  }
  if (options.salesStatus) {
    search.set("salesStatus", options.salesStatus);
  }
  if (options.salesCity.length > 0) {
    search.set("salesCity", options.salesCity.join(","));
  }
  if (options.shopNameKeyword) {
    search.set("shopName", options.shopNameKeyword);
  }
  if (options.merchantIdKeyword) {
    search.set("merchantId", options.merchantIdKeyword);
  }

  return search;
}
