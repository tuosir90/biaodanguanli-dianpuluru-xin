export type DailyPointPlatform = "meituan" | "eleme";

const AMOUNT_KEYWORDS = [
  "抽点总金额",
  "抽点金额",
  "技术服务费",
  "平台服务费",
  "服务费",
  "佣金",
  "扣点金额",
  "金额",
];

const ELEME_SETTLEMENT_AMOUNT_KEY = "代运营结算金额";

export function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeKey(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

export function normalizeDateKey(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return "";

  const matched = raw.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
  if (matched) {
    const year = matched[1];
    const month = String(Number(matched[2])).padStart(2, "0");
    const day = String(Number(matched[3])).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeNumeric(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return 0;

  const cleaned = raw
    .replace(/[，,\s￥¥]/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
  const negativeByBracket = cleaned.startsWith("(") && cleaned.endsWith(")");
  const numericText = cleaned.replace(/[()]/g, "");
  const matched = numericText.match(/-?\d+(\.\d+)?/);

  if (!matched) return 0;
  const parsed = Number(matched[0]);
  if (!Number.isFinite(parsed)) return 0;
  return negativeByBracket ? -Math.abs(parsed) : parsed;
}

export function extractDailyPointAmount(
  rowData: Record<string, unknown>,
  platform: DailyPointPlatform
) {
  if (!rowData || typeof rowData !== "object") return 0;

  const entries = Object.entries(rowData).map(([key, value]) => ({
    key: normalizeText(key),
    value,
  }));

  if (platform === "eleme") {
    const targetKey = normalizeKey(ELEME_SETTLEMENT_AMOUNT_KEY);
    for (const entry of entries) {
      if (!entry.key) continue;
      const currentKey = normalizeKey(entry.key);
      if (!currentKey.includes(targetKey)) continue;
      return normalizeNumeric(entry.value);
    }
    return 0;
  }

  for (const keyword of AMOUNT_KEYWORDS) {
    for (const entry of entries) {
      if (!entry.key || !entry.key.includes(keyword)) continue;
      const amount = normalizeNumeric(entry.value);
      if (amount !== 0) return amount;
    }
  }

  return 0;
}
