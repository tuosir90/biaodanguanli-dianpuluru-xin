import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ALL_OPERATORS } from "../constants";
import { WorkflowDetailControls } from "./workflow-detail-controls";

describe("WorkflowDetailControls", () => {
  it("使用 AntD 输入框前缀展示筛选放大镜，避免遮挡提示文字", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowDetailControls, {
        selectedOperator: ALL_OPERATORS,
        operators: ["王清月", "王郡江"],
        onSelectOperator: () => undefined,
        currentOperatorShopCount: 12,
        shopNameKeyword: "",
        onShopNameKeywordChange: () => undefined,
        merchantIdKeyword: "",
        onMerchantIdKeywordChange: () => undefined,
        statusKeyword: "",
        onStatusKeywordChange: () => undefined,
        onClearKeywords: () => undefined,
        detailFullScopeMode: false,
        isDailyActionPaginationMode: false,
        hasKeywordFilters: false,
        detailPage: 1,
        hasNextWindow: true,
        detailLoading: false,
        onPrevPage: () => undefined,
        onNextPage: () => undefined,
      })
    );

    expect(html).toContain("输入店铺名搜索");
    expect(html).toContain("输入商家ID搜索");
    expect(html.match(/ant-input-prefix/g)?.length).toBe(2);
    expect(html).not.toContain("absolute left-3");
  });
});
