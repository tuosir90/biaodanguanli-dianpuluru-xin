export type SalesInvalidShopSummaryItem = {
  salesName: string;
  totalSignedShopCount: number;
  invalidShopCount: number;
  terminatedWithinDaysCount: number;
  finalShopCount: number;
};

export type SalesInvalidShopReasonType = "invalid" | "terminated_within_days";
export type SalesInvalidShopsView = "final" | "invalid" | "terminated";

export type SalesInvalidShopDetailItem = {
  shopId: string;
  shopName: string;
  merchantId: string;
  deliveryPlatform: string;
  city: string;
  salesName: string;
  operatorName: string;
  contractSignedDate: string;
  windowStartDate: string;
  windowEndDate: string;
  windowTotalAmount: number | null;
  matchStrategy: string;
  terminationDate: string;
  terminationCooperationDays: number | null;
  resultType: SalesInvalidShopsView;
  reasonTypes: SalesInvalidShopReasonType[];
  reasonText: string;
};

export type SalesInvalidShopsReportResult = {
  summary: SalesInvalidShopSummaryItem[];
  invalidDetails: SalesInvalidShopDetailItem[];
  terminatedWithinDaysDetails: SalesInvalidShopDetailItem[];
  finalDetails: SalesInvalidShopDetailItem[];
};

export type SalesInvalidShopsResponse = {
  month: string;
  view: SalesInvalidShopsView;
  windowDays: number;
  thresholdAmount: number;
  terminationWithinDays: number;
  counts: {
    invalid: number;
    terminatedWithinDays: number;
    final: number;
  };
  summary: SalesInvalidShopSummaryItem[];
  data: SalesInvalidShopDetailItem[];
  total: number;
  page: number;
  pageSize: number;
};
