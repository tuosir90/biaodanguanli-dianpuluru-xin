import { describe, expect, it } from "vitest";
import { classifyShopTier } from "./shop-tier";

describe("classifyShopTier", () => {
  it("总回款为 0 判 C（即便日均很高）", () => {
    expect(classifyShopTier(0, 999)).toBe("C");
  });

  it("取较高档：金额与日均分属不同档时取较高者", () => {
    expect(classifyShopTier(600, 2)).toBe("A3"); // 金额 A3 / 日均 B
    expect(classifyShopTier(50, 12)).toBe("A3"); // 金额 B / 日均 A3
  });

  it("金额边界（上含下不含）", () => {
    expect(classifyShopTier(99.99, 0)).toBe("B");
    expect(classifyShopTier(100, 0)).toBe("A1");
    expect(classifyShopTier(199.99, 0)).toBe("A1");
    expect(classifyShopTier(200, 0)).toBe("A2");
    expect(classifyShopTier(500, 0)).toBe("A2");
    expect(classifyShopTier(500.01, 0)).toBe("A3");
  });

  it("日均边界（上含下不含）", () => {
    expect(classifyShopTier(1, 2.99)).toBe("B");
    expect(classifyShopTier(1, 3)).toBe("A1");
    expect(classifyShopTier(1, 4.99)).toBe("A1");
    expect(classifyShopTier(1, 5)).toBe("A2");
    expect(classifyShopTier(1, 10)).toBe("A2");
    expect(classifyShopTier(1, 10.01)).toBe("A3");
  });
});
