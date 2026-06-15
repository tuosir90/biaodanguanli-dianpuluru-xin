export type ShopTier = "C" | "B" | "A1" | "A2" | "A3";

const SHOP_TIER_ORDER: Record<ShopTier, number> = { C: 0, B: 1, A1: 2, A2: 3, A3: 4 };

function tierFromAmount(amount: number): ShopTier {
  if (amount > 500) return "A3";
  if (amount >= 200) return "A2"; // [200, 500]
  if (amount >= 100) return "A1"; // [100, 200)
  return "B"; // (0, 100)；amount==0 在上层判 C
}

function tierFromDaily(daily: number): ShopTier {
  if (daily > 10) return "A3";
  if (daily >= 5) return "A2"; // [5, 10]
  if (daily >= 3) return "A1"; // [3, 5)
  return "B"; // < 3
}

// 分别按总回款金额、日均额各算一档，取较高档（"或"的字面语义）。与呈尚云端 classifyShopTier 同口径。
export function classifyShopTier(totalAmount: number, averageDailyAmount: number): ShopTier {
  const amount = Number(totalAmount) || 0;
  const daily = Number(averageDailyAmount) || 0;
  if (amount === 0) return "C";
  const byAmount = tierFromAmount(amount);
  const byDaily = tierFromDaily(daily);
  return SHOP_TIER_ORDER[byAmount] >= SHOP_TIER_ORDER[byDaily] ? byAmount : byDaily;
}

// 档位徽标 Tailwind 样式：A3 最优(绿) → C 最弱(红)。
export const SHOP_TIER_TAG_CLASS: Record<ShopTier, string> = {
  A3: "border border-green-300 !bg-green-100 !text-green-800 dark:border-green-900/50 dark:!bg-green-900/20 dark:!text-green-200",
  A2: "border border-emerald-300 !bg-emerald-100 !text-emerald-800 dark:border-emerald-900/50 dark:!bg-emerald-900/20 dark:!text-emerald-200",
  A1: "border border-lime-300 !bg-lime-100 !text-lime-800 dark:border-lime-900/50 dark:!bg-lime-900/20 dark:!text-lime-200",
  B: "border border-amber-300 !bg-amber-100 !text-amber-800 dark:border-amber-900/50 dark:!bg-amber-900/20 dark:!text-amber-200",
  C: "border border-rose-300 !bg-rose-100 !text-rose-800 dark:border-rose-900/50 dark:!bg-rose-900/20 dark:!text-rose-200",
};
