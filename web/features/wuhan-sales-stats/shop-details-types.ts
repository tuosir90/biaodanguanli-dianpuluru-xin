export type WuhanSalesShopDetailItem = {
  shopId: string;
  contractSignedDate: string;
  merchantId: string;
  shopName: string;
  salesName: string;
  totalAmount: number;
};

export type WuhanSalesShopDetailsSummary = {
  totalShopCount: number;
  totalAmount: number;
};

export type WuhanSalesShopDetailsReportResult = {
  summary: WuhanSalesShopDetailsSummary;
  details: WuhanSalesShopDetailItem[];
};

export type WuhanSalesShopDetailsResponse = {
  month: string;
  summary: WuhanSalesShopDetailsSummary;
  data: WuhanSalesShopDetailItem[];
  total: number;
};
