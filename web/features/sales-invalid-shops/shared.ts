import { SALES_INVALID_SHOPS_WINDOW_DAYS } from "./constants";

export function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(dateKey: string, offset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";

  const value = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  value.setUTCDate(value.getUTCDate() + offset);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
    value.getUTCDate()
  ).padStart(2, "0")}`;
}

export function buildSignedWindow(dateKey: string) {
  return Array.from({ length: SALES_INVALID_SHOPS_WINDOW_DAYS }, (_, index) =>
    addDays(dateKey, index)
  ).filter(Boolean);
}

export function normalizePlatform(deliveryPlatform: unknown) {
  return normalizeText(deliveryPlatform).includes("饿了么") ? "eleme" : "meituan";
}

export function buildShopDetailKey(shopId: string, merchantId: string, shopName: string) {
  return merchantId || shopName || shopId;
}
