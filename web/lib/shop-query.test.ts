import { describe, expect, it } from "vitest";
import { buildShopFilter, isWithinNewShopCycle } from "@/lib/shop-query";

describe("buildShopFilter", () => {
  it("builds filters from selectors and keywords", () => {
    const searchParams = new URLSearchParams({
      operator: "op-a,op-b",
      operatorStatus: "在职",
      platform: "meituan",
      sales: "sales-a",
      salesStatus: "在职",
      salesCity: "武汉",
      shopName: "test-shop",
      merchantId: "12+3",
      status: "\u6b63\u5e38",
    });

    const filter = buildShopFilter(searchParams);

    expect(filter.operatorName).toEqual({ $in: ["op-a", "op-b"] });
    expect(filter.deliveryPlatform).toEqual({ $in: ["meituan"] });
    expect(filter.salesName).toEqual({ $in: ["sales-a"] });
    expect(filter.salesCity).toEqual({ $in: ["武汉"] });
    expect(filter.shopName).toEqual({ $regex: "test-shop", $options: "i" });
    expect(filter.merchantId).toEqual({ $regex: "12\\+3", $options: "i" });
    expect(filter.shopStatus).toBe("\u6b63\u5e38");
  });

  it("supports employee employment status filtering", () => {
    const searchParams = new URLSearchParams({
      salesStatus: "在职",
      operatorStatus: "离职",
    });

    const filter = buildShopFilter(searchParams);

    expect(filter.salesEmploymentStatus).toBe("在职");
    expect(filter.operatorEmploymentStatus).toBe("离职");
  });

  it("supports selected employee names together with status filter", () => {
    const searchParams = new URLSearchParams({
      sales: "李帅,张三",
      salesStatus: "在职",
    });

    const filter = buildShopFilter(searchParams);

    expect(filter.salesName).toEqual({ $in: ["李帅", "张三"] });
    expect(filter.salesEmploymentStatus).toBe("在职");
  });

  it("supports excluding terminated shops when status is absent", () => {
    const searchParams = new URLSearchParams({ excludeTerminated: "1" });

    const filter = buildShopFilter(searchParams);

    expect(filter.shopStatus).toEqual({ $ne: "\u5df2\u89e3\u7ea6" });
  });

  it("supports excluding invalid shops when status is absent", () => {
    const searchParams = new URLSearchParams({ excludeInvalid: "1" });

    const filter = buildShopFilter(searchParams);

    expect(filter.shopStatus).toEqual({ $ne: "无效店铺" });
  });

  it("supports excluding terminated and invalid shops together", () => {
    const searchParams = new URLSearchParams({
      excludeTerminated: "1",
      excludeInvalid: "1",
    });

    const filter = buildShopFilter(searchParams);

    expect(filter.shopStatus).toEqual({ $nin: ["已解约", "无效店铺"] });
  });

  it("builds contractSignedDate range for start and end dates", () => {
    const searchParams = new URLSearchParams({
      startDate: "2026-03-01",
      endDate: "2026-03-05",
    });

    const filter = buildShopFilter(searchParams);
    const contractSignedDate = filter.contractSignedDate as { $gte?: Date; $lte?: Date };

    expect(filter.entryDate).toBeUndefined();
    expect(contractSignedDate.$gte).toBeInstanceOf(Date);
    expect(contractSignedDate.$lte).toBeInstanceOf(Date);
  });
});

describe("isWithinNewShopCycle", () => {
  it("treats the first ten days as new-shop cycle", () => {
    expect(isWithinNewShopCycle("2026-03-01", "2026-03-10")).toBe(true);
    expect(isWithinNewShopCycle("2026-03-01", "2026-03-11")).toBe(false);
  });
});
