import { isWithinNewShopCycle } from "@/lib/shop-query";

const SHANGHAI_TIMEZONE = "Asia/Shanghai";

export type WorkflowDailyActionStatus = "正常" | "已解约" | "无效店铺" | "新店";

export function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayRangeShanghai() {
  const today = formatShanghaiDate(new Date());
  return {
    todayDateKey: today,
    start: new Date(`${today}T00:00:00+08:00`),
    end: new Date(`${today}T23:59:59.999+08:00`),
  };
}

export function calcDaysUnpatrolled(baseDate: Date | null) {
  if (!baseDate) return null;

  const toDayNumber = (date: Date) => {
    const matched = formatShanghaiDate(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!matched) return null;
    return Math.floor(
      Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3])) / 86400000
    );
  };

  const todayNumber = toDayNumber(new Date());
  const baseNumber = toDayNumber(baseDate);
  if (todayNumber === null || baseNumber === null) return null;
  const diff = todayNumber - baseNumber;
  return diff <= 0 ? 0 : diff;
}

export function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildOperatorFilter(operatorName: string) {
  const normalized = operatorName.trim();
  if (!normalized) return {};
  if (normalized === "未分配") {
    return { $or: [{ operatorName: "" }, { operatorName: null }, { operatorName: { $exists: false } }] };
  }
  return { operatorName: normalized };
}

export function resolveEffectiveShopStatus(
  shopStatus: unknown,
  contractSignedDate: unknown,
  todayDateKey: string
): WorkflowDailyActionStatus {
  const currentStatus = normalizeText(shopStatus) as WorkflowDailyActionStatus | "";
  if (currentStatus === "已解约" || currentStatus === "无效店铺") {
    return currentStatus;
  }
  if (isWithinNewShopCycle(contractSignedDate, todayDateKey)) {
    return "新店";
  }
  return "正常";
}
