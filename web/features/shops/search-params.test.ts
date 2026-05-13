import { describe, expect, it } from "vitest";
import { buildShopListSearchParams } from "./search-params";

describe("buildShopListSearchParams", () => {
  it("包含销售所属城市筛选参数", () => {
    const search = buildShopListSearchParams({
      page: 1,
      pageSize: 15,
      operator: [],
      operatorStatus: "",
      platform: [],
      sales: [],
      salesStatus: "",
      salesCity: ["武汉"],
      startDate: "",
      endDate: "",
      shopNameKeyword: "",
      merchantIdKeyword: "",
    });

    expect(search.get("salesCity")).toBe("武汉");
  });

  it("包含员工在离职状态筛选参数", () => {
    const search = buildShopListSearchParams({
      page: 1,
      pageSize: 15,
      operator: [],
      operatorStatus: "在职",
      platform: [],
      sales: [],
      salesStatus: "离职",
      salesCity: [],
      startDate: "",
      endDate: "",
      shopNameKeyword: "",
      merchantIdKeyword: "",
    });

    expect(search.get("operatorStatus")).toBe("在职");
    expect(search.get("salesStatus")).toBe("离职");
  });
});
