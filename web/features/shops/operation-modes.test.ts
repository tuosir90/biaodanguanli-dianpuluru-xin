import { describe, expect, it } from "vitest";
import {
  getShopOperationModeOptions,
  isAllowedShopOperationMode,
  resolveSubmittedOperationMode,
} from "./operation-modes";

describe("店铺运营模式白名单", () => {
  it("只保留店铺录入允许选择的两个运营模式", () => {
    expect(getShopOperationModeOptions()).toEqual([
      "按天付费8%/天",
      "饿了么8%",
    ]);
  });

  it("可识别允许和不允许的运营模式", () => {
    expect(isAllowedShopOperationMode(" 按天付费8%/天 ")).toBe(true);
    expect(isAllowedShopOperationMode("饿了么8%")).toBe(true);
    expect(isAllowedShopOperationMode("美团75+8%")).toBe(false);
  });

  it("手动填写的临时运营模式优先用于提交", () => {
    expect(resolveSubmittedOperationMode("饿了么8%", " 按天付费6% ")).toBe(
      "按天付费6%"
    );
    expect(resolveSubmittedOperationMode("饿了么8%", " ")).toBe("饿了么8%");
  });
});
