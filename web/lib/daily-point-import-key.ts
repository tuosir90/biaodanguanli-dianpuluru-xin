import { createHash } from "crypto";
import * as xlsx from "xlsx";
import {
  normalizeDateKey,
  normalizeText,
  type DailyPointPlatform,
} from "@/lib/daily-point-derived";

export const DAILY_POINT_MERCHANT_ID_FIELDS = ["商家ID", "商户ID", "商家编号"];
export const DAILY_POINT_STORE_ID_FIELDS = ["门店ID", "店铺ID", "门店编号"];
export const DAILY_POINT_SHOP_NAME_FIELDS = ["商家名称", "门店名称", "店铺名称", "门店"];
export const DAILY_POINT_DATE_FIELDS = [
  "日期",
  "账期",
  "统计日期",
  "数据日期",
  "结算日期",
  "交易日期",
  "时间",
  "入账日期",
  "账单日期",
];
const ELEME_VOLATILE_FIELDS = new Set(["入账状态", "合同状态"]);

function normalizeKey(value: string) {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

export function pickFirstValue(rowData: Record<string, string>, fieldNames: string[]) {
  const fieldSet = new Set(fieldNames.map((fieldName) => normalizeKey(fieldName)));
  for (const [key, rawValue] of Object.entries(rowData)) {
    if (!fieldSet.has(normalizeKey(key))) continue;
    const value = normalizeText(rawValue);
    if (value) return value;
  }
  return "";
}

export function pickByKeyword(rowData: Record<string, string>, keywords: string[]) {
  for (const [key, value] of Object.entries(rowData)) {
    if (!keywords.some((keyword) => key.includes(keyword))) {
      continue;
    }
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return "";
}

function stableRowHash(rowData: Record<string, string>) {
  const orderedPairs = Object.keys(rowData)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => [key, rowData[key] ?? ""]);
  return createHash("sha1").update(JSON.stringify(orderedPairs)).digest("hex").slice(0, 16);
}

function buildHashSource(
  platform: DailyPointPlatform,
  rowData: Record<string, string>
) {
  return Object.fromEntries(
    Object.entries(rowData)
      .map(([key, value]) => [normalizeText(key), normalizeText(value)] as const)
      .filter(([key]) => key)
      .filter(
        ([key]) => !(platform === "eleme" && ELEME_VOLATILE_FIELDS.has(key))
      )
  );
}

export function detectDailyPointHeaderRange(
  worksheet: xlsx.WorkSheet,
  platform: DailyPointPlatform
) {
  const previewRows = xlsx.utils.sheet_to_json<(string | number | Date)[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    range: 0,
  });
  const maxScan = Math.min(10, previewRows.length);

  for (let rowIndex = 0; rowIndex < maxScan; rowIndex += 1) {
    const row = Array.isArray(previewRows[rowIndex])
      ? previewRows[rowIndex].map((cell) => normalizeText(cell))
      : [];
    if (row.length === 0) continue;

    if (platform === "meituan") {
      const hasDate = row.includes("日期");
      const hasShopName = row.includes("商家名称") || row.includes("门店名称");
      const hasStoreId =
        row.includes("门店ID") || row.includes("门店id") || row.includes("门店Id");
      if (hasDate && hasShopName && hasStoreId) {
        return rowIndex;
      }
      continue;
    }

    const hasStoreId =
      row.includes("门店ID") || row.includes("门店id") || row.includes("门店Id");
    const hasShopName = row.includes("门店名称") || row.includes("商家名称");
    if (hasStoreId && hasShopName) {
      return rowIndex;
    }
  }

  return 0;
}

export function resolveDailyPointImportUniqueKey(
  platform: DailyPointPlatform,
  rowData: Record<string, string>
) {
  const merchantId = pickFirstValue(rowData, DAILY_POINT_MERCHANT_ID_FIELDS);
  const storeId = pickFirstValue(rowData, DAILY_POINT_STORE_ID_FIELDS);
  const shopName = pickFirstValue(rowData, DAILY_POINT_SHOP_NAME_FIELDS);
  const recordDate =
    pickFirstValue(rowData, DAILY_POINT_DATE_FIELDS) ||
    pickByKeyword(rowData, ["日期", "时间", "账期"]);
  const recordDateKey = normalizeDateKey(recordDate);
  const identity = merchantId || storeId;
  const hash = stableRowHash(buildHashSource(platform, rowData));
  const stableParts = [platform, identity || shopName || "unknown", recordDateKey || "no_date"];
  return `${stableParts.join("__")}__${hash}`;
}
