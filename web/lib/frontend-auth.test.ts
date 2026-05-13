import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as frontendAuth from "@/lib/frontend-auth";

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

type FrontendAuthModule = typeof frontendAuth & {
  SALES_INVALID_SHOPS_AUTH_KEY?: string;
  SALES_INVALID_SHOPS_LOGIN_PASSWORD?: string;
  getSalesInvalidShopsAuthStatus?: () => boolean;
  setSalesInvalidShopsAuthStatus?: (isAuthed: boolean) => void;
  WUHAN_SALES_AUTH_KEY?: string;
  WUHAN_SALES_LOGIN_PASSWORD?: string;
  getWuhanSalesAuthStatus?: () => boolean;
  setWuhanSalesAuthStatus?: (isAuthed: boolean) => void;
  validateWuhanSalesPassword?: (password?: string | null) => boolean;
  SHOP_EXPORT_AUTH_KEY?: string;
  SHOP_EXPORT_LOGIN_PASSWORD?: string;
  getShopExportAuthStatus?: () => boolean;
  setShopExportAuthStatus?: (isAuthed: boolean) => void;
  validateShopExportPassword?: (password?: string | null) => boolean;
};

const authModule = frontendAuth as FrontendAuthModule;

describe("sales invalid shops auth", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: new LocalStorageMock(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("uses the configured password for the protected sales page", () => {
    expect(authModule.SALES_INVALID_SHOPS_LOGIN_PASSWORD).toBe("yjkj903");
  });

  it("stores auth state independently from the main site login", () => {
    expect(authModule.SALES_INVALID_SHOPS_AUTH_KEY).toBe("sales_invalid_shops_auth");
    expect(authModule.getSalesInvalidShopsAuthStatus).toBeTypeOf("function");
    expect(authModule.setSalesInvalidShopsAuthStatus).toBeTypeOf("function");

    authModule.setSalesInvalidShopsAuthStatus?.(true);

    expect(authModule.getSalesInvalidShopsAuthStatus?.()).toBe(true);
    expect(frontendAuth.getFrontendAuthStatus()).toBe(false);

    authModule.setSalesInvalidShopsAuthStatus?.(false);

    expect(authModule.getSalesInvalidShopsAuthStatus?.()).toBe(false);
  });
});

describe("shop export auth", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: new LocalStorageMock(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("uses the configured password for export all excel", () => {
    expect(authModule.SHOP_EXPORT_LOGIN_PASSWORD).toBe("csch901");
    expect(authModule.validateShopExportPassword?.("csch901")).toBe(true);
    expect(authModule.validateShopExportPassword?.("csch903")).toBe(false);
  });

  it("stores export auth state independently", () => {
    expect(authModule.SHOP_EXPORT_AUTH_KEY).toBe("shop_export_auth");
    expect(authModule.getShopExportAuthStatus).toBeTypeOf("function");
    expect(authModule.setShopExportAuthStatus).toBeTypeOf("function");

    authModule.setShopExportAuthStatus?.(true);

    expect(authModule.getShopExportAuthStatus?.()).toBe(true);
    expect(frontendAuth.getFrontendAuthStatus()).toBe(false);
    expect(authModule.getSalesInvalidShopsAuthStatus?.()).toBe(false);

    authModule.setShopExportAuthStatus?.(false);

    expect(authModule.getShopExportAuthStatus?.()).toBe(false);
  });
});

describe("wuhan sales auth", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: new LocalStorageMock(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("uses the configured password for the wuhan sales category", () => {
    expect(authModule.WUHAN_SALES_LOGIN_PASSWORD).toBe("hbcsch904");
    expect(authModule.validateWuhanSalesPassword?.("hbcsch904")).toBe(true);
    expect(authModule.validateWuhanSalesPassword?.("yjkj903")).toBe(false);
  });

  it("stores wuhan sales auth state independently", () => {
    expect(authModule.WUHAN_SALES_AUTH_KEY).toBe("wuhan_sales_auth");
    expect(authModule.getWuhanSalesAuthStatus).toBeTypeOf("function");
    expect(authModule.setWuhanSalesAuthStatus).toBeTypeOf("function");

    authModule.setWuhanSalesAuthStatus?.(true);

    expect(authModule.getWuhanSalesAuthStatus?.()).toBe(true);
    expect(frontendAuth.getFrontendAuthStatus()).toBe(false);
    expect(authModule.getSalesInvalidShopsAuthStatus?.()).toBe(false);
    expect(authModule.getShopExportAuthStatus?.()).toBe(false);

    authModule.setWuhanSalesAuthStatus?.(false);

    expect(authModule.getWuhanSalesAuthStatus?.()).toBe(false);
  });
});
