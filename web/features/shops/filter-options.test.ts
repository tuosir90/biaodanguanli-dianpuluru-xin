import { describe, expect, it } from "vitest";
import {
  buildEmployeeStatusMap,
  filterActiveSalesNameOptions,
  filterSalesNameOptions,
} from "./filter-options";

describe("filterSalesNameOptions", () => {
  it("会排除指定的开单销售姓名", () => {
    expect(
      filterSalesNameOptions(["张三", "杨蓉", "赵永鸿", "孙文龙"])
    ).toEqual(["张三"]);
  });

  it("根据数据库记录生成员工状态映射", () => {
    expect(
      buildEmployeeStatusMap([
        { name: "郭文", status: "离职" },
        { name: "叶文静", status: "离职" },
        { name: "张三", status: "在职" },
        { name: "", status: "离职" },
        { name: "李四", status: "" },
      ])
    ).toEqual({
      郭文: "离职",
      叶文静: "离职",
      张三: "在职",
    });
  });

  it("销售下拉选项会排除数据库中已离职的销售", () => {
    expect(
      filterActiveSalesNameOptions(["张三", "郭文", "叶文静", "杨蓉"], {
        郭文: "离职",
        叶文静: "离职",
        张三: "在职",
      })
    ).toEqual(["张三"]);
  });
});
