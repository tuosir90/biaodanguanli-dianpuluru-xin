const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function isDateKey(value: string) {
  return DATE_KEY_PATTERN.test(value);
}

export function isMonthKey(value: string) {
  return MONTH_KEY_PATTERN.test(value);
}

export function shanghaiDateKeyToDate(dateKey: string) {
  if (!isDateKey(dateKey)) return null;

  const date = new Date(`${dateKey}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShanghaiDateKey(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseShanghaiDateInputToDate(value: string) {
  if (isDateKey(value)) return shanghaiDateKeyToDate(value);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const dateKey = formatShanghaiDateKey(parsed);
  return dateKey ? shanghaiDateKeyToDate(dateKey) : null;
}

export function addDaysToDateKey(dateKey: string, dayOffset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";

  const dateValue = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  dateValue.setUTCDate(dateValue.getUTCDate() + dayOffset);

  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addMonthsToMonthKey(monthKey: string, monthOffset: number) {
  const matched = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return "";

  const dateValue = new Date(Date.UTC(Number(matched[1]), Number(matched[2]) - 1, 1));
  dateValue.setUTCMonth(dateValue.getUTCMonth() + monthOffset);

  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
