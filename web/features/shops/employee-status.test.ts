import { describe, expect, it } from "vitest";
import {
  buildShopEmploymentStatusPatch,
  formatEmployeeNameWithStatus,
  resolveOperatorEmploymentStatus,
  resolveSalesEmploymentStatus,
} from "./employee-status";

describe("employee status", () => {
  it("识别离职销售和在职运营", () => {
    expect(resolveSalesEmploymentStatus("李帅")).toBe("离职");
    expect(resolveSalesEmploymentStatus("张三")).toBe("在职");
    expect(resolveOperatorEmploymentStatus("运营A")).toBe("在职");
  });

  it("给员工名称附加状态标签", () => {
    expect(formatEmployeeNameWithStatus("sales", "陈韵涵")).toBe("陈韵涵（离职）");
    expect(formatEmployeeNameWithStatus("operator", "运营A")).toBe("运营A（在职）");
    expect(formatEmployeeNameWithStatus("sales", "")).toBe("");
  });

  it("页面标签优先使用数据库中的员工状态", () => {
    expect(formatEmployeeNameWithStatus("sales", "郭文", "离职")).toBe("郭文（离职）");
  });

  it("根据销售和运营姓名生成数据库状态字段", () => {
    expect(buildShopEmploymentStatusPatch("李帅", "运营A")).toEqual({
      salesEmploymentStatus: "离职",
      operatorEmploymentStatus: "在职",
    });
    expect(buildShopEmploymentStatusPatch("", "")).toEqual({
      salesEmploymentStatus: "",
      operatorEmploymentStatus: "",
    });
  });
});
