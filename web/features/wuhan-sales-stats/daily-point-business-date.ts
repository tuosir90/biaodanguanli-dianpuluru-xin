import { normalizeDateKey } from "@/lib/daily-point-derived";

type DailyPointBusinessDateSource = {
  platform?: unknown;
  recordDateKey?: unknown;
  recordDate?: unknown;
  rowData?: Record<string, unknown>;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractLastDateKey(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return "";

  const matches = Array.from(
    raw.matchAll(/\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}/g),
    (match) => normalizeDateKey(match[0])
  ).filter(Boolean);

  return matches.at(-1) ?? "";
}

function resolveMeituanSettlementDateKey(rowData?: Record<string, unknown>) {
  if (!rowData || typeof rowData !== "object") {
    return "";
  }

  for (const [key, value] of Object.entries(rowData)) {
    if (!normalizeText(key).includes("结算周期")) {
      continue;
    }

    const dateKey = extractLastDateKey(value);
    if (dateKey) {
      return dateKey;
    }
  }

  return "";
}

export function resolveWuhanSalesDailyPointDateKey(
  source: DailyPointBusinessDateSource
) {
  if (normalizeText(source.platform) === "meituan") {
    const settlementDateKey = resolveMeituanSettlementDateKey(source.rowData);
    if (settlementDateKey) {
      return settlementDateKey;
    }
  }

  return normalizeDateKey(source.recordDateKey || source.recordDate);
}
