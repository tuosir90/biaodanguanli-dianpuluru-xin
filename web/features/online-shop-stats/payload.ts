import { isDateKey } from "@/lib/date-key-utils";
import type { OnlineShopCountPlatform } from "./types";

const ONLINE_SHOP_COUNT_PLATFORMS = new Set<OnlineShopCountPlatform>([
  "meituan",
  "eleme",
]);

const DEFAULT_CAPTURE_SOURCE = "online-shop-crawler";

type OnlineShopCountUploadRecord = {
  platform: OnlineShopCountPlatform;
  count: number;
  summaryText: string;
  captureKey: string;
};

export type NormalizedOnlineShopCountUploadPayload = {
  statDateKey: string;
  capturedAt: Date;
  captureSource: string;
  records: OnlineShopCountUploadRecord[];
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function resolveShanghaiDateKey(dateValue: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(dateValue);
  const year = parts.find((item) => item.type === "year")?.value ?? "";
  const month = parts.find((item) => item.type === "month")?.value ?? "";
  const day = parts.find((item) => item.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function parseCapturedAt(value: unknown, fallbackNow: Date) {
  if (value === undefined || value === null || value === "") {
    return fallbackNow;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("capturedAt 参数无效");
  }
  return parsed;
}

function parsePlatform(value: unknown) {
  const normalized = normalizeText(value) as OnlineShopCountPlatform;
  if (!ONLINE_SHOP_COUNT_PLATFORMS.has(normalized)) {
    throw new Error("records.platform 参数无效");
  }
  return normalized;
}

function parseCount(value: unknown) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(normalizeText(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("records.count 必须为大于等于 0 的整数");
  }
  return parsed;
}

export function normalizeOnlineShopCountUploadPayload(
  input: unknown,
  now = new Date()
): NormalizedOnlineShopCountUploadPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("请求体必须为对象");
  }

  const payload = input as Record<string, unknown>;
  const capturedAt = parseCapturedAt(payload.capturedAt, now);
  const statDateInput = normalizeText(payload.statDate);
  const statDateKey = statDateInput || resolveShanghaiDateKey(capturedAt);
  if (!isDateKey(statDateKey)) {
    throw new Error("statDate 参数无效");
  }

  const captureSource = normalizeText(payload.source) || DEFAULT_CAPTURE_SOURCE;
  const rawRecords = payload.records;
  if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
    throw new Error("records 至少需要 1 条");
  }

  const records = rawRecords.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("records 项必须为对象");
    }

    const record = item as Record<string, unknown>;
    const platform = parsePlatform(record.platform);
    const count = parseCount(record.count);
    const summaryText = normalizeText(record.summaryText);
    const captureKey =
      normalizeText(record.captureKey) ||
      `${platform}:${statDateKey}:${capturedAt.toISOString()}:${count}`;

    return {
      platform,
      count,
      summaryText,
      captureKey,
    };
  });

  return {
    statDateKey,
    capturedAt,
    captureSource,
    records,
  };
}
