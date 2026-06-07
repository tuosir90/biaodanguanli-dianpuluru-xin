"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          type="button"
          variant="ghost"
          onClick={() => onSelectOperator(ALL_OPERATORS)}
          className={`h-auto rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-base ease-apple active-press ${
            selectedOperator === ALL_OPERATORS
              ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 hover:bg-primary hover:text-primary-foreground"
              : "border-border bg-card text-text-200 hover:border-text-200 hover:bg-bg-200 hover:text-text-100"
          }`}
        >
          全部
        </Button>
        {operators.map((name) => (
          <Button
            key={name}
            type="button"
            variant="ghost"
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-200" />
          <Input
            type="text"
            value={shopNameKeyword}
            onChange={(event) => onShopNameKeywordChange(event.target.value)}
            placeholder="输入店铺名搜索"
            className="w-full rounded-lg border-border bg-card py-2 pl-9 pr-3 text-sm text-text-100 focus-visible:ring-accent-200/20 transition-all duration-fast ease-apple"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-200" />
          <Input
            type="text"
            value={merchantIdKeyword}
            onChange={(event) => onMerchantIdKeywordChange(event.target.value)}
            placeholder="输入商家ID搜索"
            className="w-full rounded-lg border-border bg-card py-2 pl-9 pr-3 text-sm text-text-100 focus-visible:ring-accent-200/20 transition-all duration-fast ease-apple"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusKeyword || "ALL"} onValueChange={(val) => onStatusKeywordChange(val === "ALL" ? "" : val)}>
            <SelectTrigger className="flex-1 rounded-lg border-border bg-card px-3 py-2 text-sm text-text-100 focus-visible:ring-accent-200/20 transition-all duration-fast ease-apple">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="正常">正常</SelectItem>
              <SelectItem value="新店">新店</SelectItem>
              <SelectItem value="已解约">已解约</SelectItem>
              <SelectItem value="无效店铺">无效店铺</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
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
            type="button"
            variant="ghost"
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
            type="button"
            variant="ghost"
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
