export const FRONTEND_AUTH_KEY = "frontend_auth";
export const FRONTEND_LOGIN_PASSWORD = "csch903";
export const SALES_INVALID_SHOPS_AUTH_KEY = "sales_invalid_shops_auth";
export const SALES_INVALID_SHOPS_LOGIN_PASSWORD = "yjkj903";
export const WUHAN_SALES_AUTH_KEY = "wuhan_sales_auth";
export const WUHAN_SALES_LOGIN_PASSWORD = "hbcsch904";
export const SHOP_EXPORT_AUTH_KEY = "shop_export_auth";
export const SHOP_EXPORT_LOGIN_PASSWORD = "csch901";

function getLocalStorageFlag(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(key) === "1";
}

function setLocalStorageFlag(key: string, isAuthed: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (isAuthed) {
    window.localStorage.setItem(key, "1");
    return;
  }

  window.localStorage.removeItem(key);
}

export function getFrontendAuthStatus() {
  return getLocalStorageFlag(FRONTEND_AUTH_KEY);
}

export function setFrontendAuthStatus(isAuthed: boolean) {
  setLocalStorageFlag(FRONTEND_AUTH_KEY, isAuthed);
}

export function getSalesInvalidShopsAuthStatus() {
  return getLocalStorageFlag(SALES_INVALID_SHOPS_AUTH_KEY);
}

export function setSalesInvalidShopsAuthStatus(isAuthed: boolean) {
  setLocalStorageFlag(SALES_INVALID_SHOPS_AUTH_KEY, isAuthed);
}

export function validateWuhanSalesPassword(password?: string | null) {
  return String(password ?? "").trim() === WUHAN_SALES_LOGIN_PASSWORD;
}

export function getWuhanSalesAuthStatus() {
  return getLocalStorageFlag(WUHAN_SALES_AUTH_KEY);
}

export function setWuhanSalesAuthStatus(isAuthed: boolean) {
  setLocalStorageFlag(WUHAN_SALES_AUTH_KEY, isAuthed);
}

export function validateShopExportPassword(password?: string | null) {
  return String(password ?? "").trim() === SHOP_EXPORT_LOGIN_PASSWORD;
}

export function getShopExportAuthStatus() {
  return getLocalStorageFlag(SHOP_EXPORT_AUTH_KEY);
}

export function setShopExportAuthStatus(isAuthed: boolean) {
  setLocalStorageFlag(SHOP_EXPORT_AUTH_KEY, isAuthed);
}
