import type {
  SalesInvalidShopsResponse,
  SalesInvalidShopsView,
} from "@/features/sales-invalid-shops/types";

export function defaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function resolveView(value: string | null): SalesInvalidShopsView {
  if (value === "invalid" || value === "terminated" || value === "final") {
    return value;
  }
  return "final";
}

export function resolveViewDescription(
  view: SalesInvalidShopsView,
  windowDays: number,
  terminationWithinDays: number
) {
  if (view === "invalid") {
    return `原始无效口径：店铺自签约日起连续 ${windowDays} 天回款总额为 0。`;
  }
  if (view === "terminated") {
    return `${terminationWithinDays}天内解约口径：店铺从签约到解约的合作天数小于等于 ${terminationWithinDays} 天。`;
  }
  return `最终汇总口径：原始无效店铺与 ${terminationWithinDays} 天内解约店铺合并后去重，得到销售当月最终异常店铺数和明细。`;
}

export function defaultResponse(month: string): SalesInvalidShopsResponse {
  return {
    month,
    view: "final",
    windowDays: 15,
    thresholdAmount: 0,
    terminationWithinDays: 3,
    counts: {
      invalid: 0,
      terminatedWithinDays: 0,
      final: 0,
    },
    summary: [],
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
  };
}
