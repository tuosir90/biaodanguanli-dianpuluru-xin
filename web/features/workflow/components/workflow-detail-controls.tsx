"use client";

import { Search } from "lucide-react";
import { Button, Input, Select } from "antd";
import { ALL_OPERATORS, DETAIL_PAGE_SIZE } from "../constants";

type WorkflowDetailControlsProps = {
  selectedOperator: string;
  operators: string[];
  onSelectOperator: (operator: string) => void;
  currentOperatorShopCount: number;
  shopNameKeyword: string;
  onShopNameKeywordChange: (value: string) => void;
  merchantIdKeyword: string;
  onMerchantIdKeywordChange: (value: string) => void;
  statusKeyword: string;
  onStatusKeywordChange: (value: string) => void;
  onClearKeywords: () => void;
  detailFullScopeMode: boolean;
  isDailyActionPaginationMode: boolean;
  hasKeywordFilters: boolean;
  detailPage: number;
  hasNextWindow: boolean;
  detailLoading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function WorkflowDetailControls({
  selectedOperator,
  operators,
  onSelectOperator,
  currentOperatorShopCount,
  shopNameKeyword,
  onShopNameKeywordChange,
  merchantIdKeyword,
  onMerchantIdKeywordChange,
  statusKeyword,
  onStatusKeywordChange,
  onClearKeywords,
  detailFullScopeMode,
  isDailyActionPaginationMode,
  hasKeywordFilters,
  detailPage,
  hasNextWindow,
  detailLoading,
  onPrevPage,
  onNextPage,
}: WorkflowDetailControlsProps) {
  const visibleOperators = operators.filter((name) => name !== "王郡江");

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-100">运营工作进度明细</h3>
          <p className="mt-1 text-xs text-text-200 opacity-80">
            默认按分页加载店铺数据；每页仅展示{DETAIL_PAGE_SIZE}家店铺
          </p>
        </div>
        <div className="space-y-1 rounded-xl border border-border bg-bg-200/60 px-3 py-1.5 text-xs font-medium text-text-100">
          <div>当前运营：{selectedOperator === ALL_OPERATORS ? "全部" : selectedOperator}</div>
          <div className="text-text-200">店铺总数：{currentOperatorShopCount}</div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          key={ALL_OPERATORS}
          htmlType="button"
          type={selectedOperator === ALL_OPERATORS ? "primary" : "default"}
          onClick={() => onSelectOperator(ALL_OPERATORS)}
          className={`h-auto rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-base ease-apple active-press ${
            selectedOperator === ALL_OPERATORS
              ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 hover:bg-primary hover:text-primary-foreground"
              : "border-border bg-card text-text-200 hover:border-text-200 hover:bg-bg-200 hover:text-text-100"
          }`}
        >
          全部
        </Button>
        {visibleOperators.map((name) => (
          <Button
            key={name}
            htmlType="button"
            type={selectedOperator === name ? "primary" : "default"}
            onClick={() => onSelectOperator(name)}
            className={`h-auto rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-base ease-apple active-press ${
              selectedOperator === name
                ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 hover:bg-primary hover:text-primary-foreground"
                : "border-border bg-card text-text-200 hover:border-text-200 hover:bg-bg-200 hover:text-text-100"
            }`}
          >
            {name}
          </Button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-bg-200/30 p-4 md:grid-cols-3">
        <Input
          variant="filled"
          prefix={<Search className="h-4 w-4 text-text-200" />}
          type="text"
          value={shopNameKeyword}
          onChange={(event) => onShopNameKeywordChange(event.target.value)}
          placeholder="输入店铺名搜索"
          className="w-full text-sm"
        />
        <Input
          variant="filled"
          prefix={<Search className="h-4 w-4 text-text-200" />}
          type="text"
          value={merchantIdKeyword}
          onChange={(event) => onMerchantIdKeywordChange(event.target.value)}
          placeholder="输入商家ID搜索"
          className="w-full text-sm"
        />
        <div className="flex gap-2">
          <Select
            value={statusKeyword || "ALL"}
            onChange={(val) => onStatusKeywordChange(val === "ALL" ? "" : val)}
            options={[
              { value: "ALL", label: "全部状态" },
              { value: "正常", label: "正常" },
              { value: "新店", label: "新店" },
              { value: "已解约", label: "已解约" },
              { value: "无效店铺", label: "无效店铺" },
            ]}
            className="flex-1"
          />
          <Button
            htmlType="button"
            type="default"
            className="h-auto rounded-lg bg-bg-200 px-3 py-2 text-sm font-medium text-text-200 transition-colors duration-fast ease-apple active-press hover:bg-bg-300"
            onClick={onClearKeywords}
          >
            清除
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-200/30 p-3">
        <div className="text-xs text-text-200">
          {detailFullScopeMode
            ? isDailyActionPaginationMode
              ? `当前为今日待处理分页模式（每页${DETAIL_PAGE_SIZE}家，当前第 ${detailPage} 页）`
              : hasKeywordFilters
              ? "当前为筛选全量模式（筛选时不分页）"
              : "当前为全量明细模式（监控联动筛选）"
            : `当前第 ${detailPage} 页（每页 ${DETAIL_PAGE_SIZE} 家）`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            htmlType="button"
            type="default"
            className="h-auto rounded-lg bg-bg-200 px-3 py-1.5 text-sm font-medium text-text-200 hover:bg-bg-300"
            disabled={
              detailLoading ||
              detailPage <= 1 ||
              (detailFullScopeMode && !isDailyActionPaginationMode)
            }
            onClick={onPrevPage}
          >
            上一页
          </Button>
          <Button
            htmlType="button"
            type="default"
            className="h-auto rounded-lg bg-bg-200 px-3 py-1.5 text-sm font-medium text-text-200 hover:bg-bg-300"
            disabled={
              detailLoading ||
              !hasNextWindow ||
              (detailFullScopeMode && !isDailyActionPaginationMode)
            }
            onClick={onNextPage}
          >
            下一页
          </Button>
        </div>
      </div>
    </>
  );
}
