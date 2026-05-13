export const WUHAN_SALES_STATS_MIN_MONTH = "2026-03";
export const WUHAN_SALES_STATS_MIN_DATE_KEY = "2026-03-01";
export const WUHAN_SALES_STATS_ALL_VALUE = "all";

type WuhanSalesStatsMonthRange = {
  start: Date;
  end: Date;
  startDateKey: string;
  endDateKey: string;
};

function isYearMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export function isWuhanSalesStatsAllValue(value?: string | null) {
  return String(value ?? "").trim() === WUHAN_SALES_STATS_ALL_VALUE;
}

export function normalizeWuhanSalesStatsMonth(value?: string | null) {
  if (isWuhanSalesStatsAllValue(value)) {
    return WUHAN_SALES_STATS_ALL_VALUE;
  }

  const normalizedValue = String(value ?? "").trim();
  if (!isYearMonth(normalizedValue)) {
    return WUHAN_SALES_STATS_MIN_MONTH;
  }

  return normalizedValue < WUHAN_SALES_STATS_MIN_MONTH
    ? WUHAN_SALES_STATS_MIN_MONTH
    : normalizedValue;
}

export function getWuhanSalesStatsMinStartDate() {
  return new Date("2026-03-01T00:00:00+08:00");
}

export function shiftWuhanSalesStatsDateKey(dateKey: string, days: number) {
  const matched = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    return "";
  }

  const cursor = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]), 0, 0, 0)
  );
  cursor.setUTCDate(cursor.getUTCDate() + days);

  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
}

export function buildWuhanSalesStatsDateKeys(
  startDateKey: string,
  endDateKey: string
) {
  const keys: string[] = [];
  let cursor = startDateKey;

  while (cursor && cursor <= endDateKey) {
    keys.push(cursor);
    cursor = shiftWuhanSalesStatsDateKey(cursor, 1);
  }

  return keys;
}

export function buildWuhanSalesStatsMonthRange(
  month: string
): WuhanSalesStatsMonthRange | null {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0));

  return {
    start,
    end,
    startDateKey: `${matched[1]}-${matched[2]}-01`,
    endDateKey: `${matched[1]}-${matched[2]}-${String(lastDay.getUTCDate()).padStart(2, "0")}`,
  };
}
