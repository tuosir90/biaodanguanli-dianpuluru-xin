import { describe, expect, it } from "vitest";
import {
  buildWorkflowDefaultShopsQuery,
  resolveWorkflowDetailSource,
} from "@/features/workflow/workflow-detail-source";

describe("resolveWorkflowDetailSource", () => {
  it("签约提醒筛选优先级最高", () => {
    expect(
      resolveWorkflowDetailSource({
        detailPage: 1,
        selectedOperator: "__ALL__",
        recentSignedFilterOperator: "王涛",
        dailyActionFilterOperator: "王清月",
        shopNameKeyword: "店铺",
        merchantIdKeyword: "123",
        statusKeyword: "新店",
      })
    ).toEqual({
      type: "recent-signed",
      page: 1,
      operatorName: "王涛",
      query:
        "page=1&pageSize=15&windowDays=10&operatorName=%E7%8E%8B%E6%B6%9B",
    });
  });

  it("没有签约提醒筛选时，今日待处理筛选优先于默认列表", () => {
    expect(
      resolveWorkflowDetailSource({
        detailPage: 3,
        selectedOperator: "__ALL__",
        recentSignedFilterOperator: "",
        dailyActionFilterOperator: "王清月",
        shopNameKeyword: "店铺",
        merchantIdKeyword: "123",
        statusKeyword: "新店",
      })
    ).toMatchObject({
      type: "daily-action",
      page: 3,
      operatorName: "王清月",
      shopNameKeyword: "店铺",
    });
  });

  it("都没有时回退到默认店铺列表", () => {
    expect(
      resolveWorkflowDetailSource({
        detailPage: 2,
        selectedOperator: "王涛",
        recentSignedFilterOperator: "",
        dailyActionFilterOperator: "",
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
      })
    ).toEqual({
      type: "default",
      query: buildWorkflowDefaultShopsQuery({
        detailPage: 2,
        selectedOperator: "王涛",
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
      }),
    });
  });

  it("默认店铺列表会请求累计总回款金额", () => {
    expect(
      buildWorkflowDefaultShopsQuery({
        detailPage: 1,
        selectedOperator: "__ALL__",
        shopNameKeyword: "",
        merchantIdKeyword: "",
        statusKeyword: "",
      })
    ).toContain("includeDailyPointTotal=1");
  });
});
