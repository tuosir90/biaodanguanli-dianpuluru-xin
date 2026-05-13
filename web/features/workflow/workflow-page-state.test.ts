import { describe, expect, it } from "vitest";
import {
  buildWorkflowListResetKey,
  collectWorkflowOperators,
  hasWorkflowActiveDetailFilters,
} from "@/features/workflow/workflow-page-state";

describe("collectWorkflowOperators", () => {
  it("合并 overview 和明细里的运营并去重", () => {
    expect(
      collectWorkflowOperators({
        overviewOperators: ["王涛", "王清月"],
        detailShops: [
          { operatorName: "王涛" },
          { operatorName: "张玉莲" },
          { operatorName: "" },
        ],
      })
    ).toEqual(["王涛", "王清月", "张玉莲"]);
  });
});

describe("hasWorkflowActiveDetailFilters", () => {
  it("任一关键词、签约提醒筛选或今日待处理筛选存在时返回 true", () => {
    expect(
      hasWorkflowActiveDetailFilters({
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
        recentSignedFilterOperator: "",
        dailyActionFilterOperator: "",
      })
    ).toBe(false);

    expect(
      hasWorkflowActiveDetailFilters({
        shopNameKeyword: "测试店铺",
        merchantIdKeyword: "",
        statusKeyword: "",
        recentSignedFilterOperator: "",
        dailyActionFilterOperator: "",
      })
    ).toBe(true);

    expect(
      hasWorkflowActiveDetailFilters({
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
        recentSignedFilterOperator: "王涛",
        dailyActionFilterOperator: "",
      })
    ).toBe(true);

    expect(
      hasWorkflowActiveDetailFilters({
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
        recentSignedFilterOperator: "",
        dailyActionFilterOperator: "王清月",
      })
    ).toBe(true);
  });
});

describe("buildWorkflowListResetKey", () => {
  it("稳定拼接当前明细上下文", () => {
    expect(
      buildWorkflowListResetKey({
        selectedOperator: "__ALL__",
        detailPage: 2,
        shopNameKeyword: "店铺",
        merchantIdKeyword: "123",
        statusKeyword: "新店",
        recentSignedFilterOperator: "王涛",
        dailyActionFilterOperator: "王清月",
      })
    ).toBe("__ALL__|2|店铺|123|新店|王涛|王清月");
  });
});
