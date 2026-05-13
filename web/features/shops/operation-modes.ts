export const SHOP_OPERATION_MODE_OPTIONS = [
  "按天付费8%/天",
  "饿了么8%",
] as const;

export function getShopOperationModeOptions() {
  return [...SHOP_OPERATION_MODE_OPTIONS];
}

export function isAllowedShopOperationMode(mode?: string | null) {
  const normalizedMode = mode?.trim() ?? "";
  return SHOP_OPERATION_MODE_OPTIONS.includes(
    normalizedMode as (typeof SHOP_OPERATION_MODE_OPTIONS)[number]
  );
}

export function resolveSubmittedOperationMode(
  selectedMode?: string | null,
  manualMode?: string | null
) {
  const normalizedManualMode = manualMode?.trim() ?? "";
  if (normalizedManualMode) {
    return normalizedManualMode;
  }
  return selectedMode?.trim() ?? "";
}
