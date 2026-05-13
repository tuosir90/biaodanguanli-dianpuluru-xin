import { describe, expect, it } from "vitest";
import { buildSalesCityMap, normalizeSalesCity, resolveSalesCity } from "@/lib/sales-city";

describe("resolveSalesCity", () => {
  it("将武汉销售映射为武汉", () => {
    expect(resolveSalesCity("屈维涛")).toBe("武汉");
    expect(resolveSalesCity("李帅")).toBe("武汉");
    expect(resolveSalesCity("向文强")).toBe("武汉");
  });

  it("手动指定销售城市时优先使用指定值", () => {
    expect(resolveSalesCity("王五", "武汉")).toBe("武汉");
    expect(resolveSalesCity("屈维涛", "宜昌")).toBe("宜昌");
  });

  it("将其他非空销售映射为宜昌", () => {
    expect(resolveSalesCity("赵春燕")).toBe("宜昌");
    expect(resolveSalesCity("王五")).toBe("宜昌");
  });

  it("空销售返回空字符串", () => {
    expect(resolveSalesCity("")).toBe("");
    expect(resolveSalesCity("  ")).toBe("");
    expect(resolveSalesCity(undefined)).toBe("");
  });
});

describe("normalizeSalesCity", () => {
  it("只接受武汉和宜昌两个值", () => {
    expect(normalizeSalesCity("武汉")).toBe("武汉");
    expect(normalizeSalesCity("宜昌")).toBe("宜昌");
    expect(normalizeSalesCity("  武汉  ")).toBe("武汉");
    expect(normalizeSalesCity("上海")).toBe("");
    expect(normalizeSalesCity("")).toBe("");
  });
});

describe("buildSalesCityMap", () => {
  it("优先使用店铺已存的销售所属城市，缺失时回退默认规则", () => {
    expect(
      buildSalesCityMap([
        { salesName: "王五", salesCity: "武汉" },
        { salesName: "屈维涛", salesCity: "" },
        { salesName: "李帅" },
      ])
    ).toEqual({
      王五: "武汉",
      屈维涛: "武汉",
      李帅: "武汉",
    });
  });

  it("当前已切换到武汉的销售，不应再被历史宜昌记录覆盖默认归属", () => {
    expect(
      buildSalesCityMap([
        { salesName: "向文强", salesCity: "宜昌" },
      ])
    ).toEqual({
      向文强: "武汉",
    });
  });
});
