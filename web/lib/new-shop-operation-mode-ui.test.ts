import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("店铺录入运营模式", () => {
  const pageSource = readFileSync(
    path.resolve(__dirname, "../app/shops/new/page.tsx"),
    "utf8"
  );
  const dropdownRouteSource = readFileSync(
    path.resolve(__dirname, "../app/api/dropdowns/route.ts"),
    "utf8"
  );

  it("页面保留固定运营模式下拉框，并提供临时手动输入框", () => {
    expect(pageSource).toContain("SHOP_OPERATION_MODE_OPTIONS.map");
    expect(pageSource).toContain("manualOperationMode");
    expect(pageSource).toContain("手动填写临时运营模式");
    expect(pageSource).toContain("resolveSubmittedOperationMode");
    expect(pageSource).not.toContain("dropdowns.operationMode.map");
  });

  it("下拉接口不返回数据库中的其它运营模式", () => {
    expect(dropdownRouteSource).toContain("getShopOperationModeOptions()");
    expect(dropdownRouteSource).not.toContain("ensureOperationModes");
    expect(dropdownRouteSource).not.toContain("美团75+8%");
    expect(dropdownRouteSource).not.toContain("饿了么75+8%");
  });
});
