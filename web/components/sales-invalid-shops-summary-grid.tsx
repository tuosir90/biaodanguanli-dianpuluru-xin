"use client";

import { Button } from "antd";
import type {
  SalesInvalidShopSummaryItem,
  SalesInvalidShopsView,
} from "@/features/sales-invalid-shops/types";

type SalesInvalidShopsSummaryGridProps = {
  summary: SalesInvalidShopSummaryItem[];
  activeView: SalesInvalidShopsView;
  selectedSalesName: string;
  onToggleSalesName: (salesName: string) => void;
};

function resolvePrimaryCount(
  item: SalesInvalidShopSummaryItem,
  activeView: SalesInvalidShopsView
) {
  if (activeView === "invalid") return item.invalidShopCount;
  if (activeView === "terminated") return item.terminatedWithinDaysCount;
  return item.finalShopCount;
}

function resolvePrimaryLabel(activeView: SalesInvalidShopsView) {
  if (activeView === "invalid") return "原始无效";
  if (activeView === "terminated") return "3天内解约";
  return "最终汇总";
}

export function SalesInvalidShopsSummaryGrid({
  summary,
  activeView,
  selectedSalesName,
  onToggleSalesName,
}: SalesInvalidShopsSummaryGridProps) {
  const primaryLabel = resolvePrimaryLabel(activeView);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-text-100">销售月度异常店铺汇总</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => {
          const primaryCount = resolvePrimaryCount(item, activeView);

          return (
            <button
              key={item.salesName}
              type="button"
              onClick={() => onToggleSalesName(item.salesName)}
              className={`rounded-xl border px-4 py-4 text-left transition-all ${
                selectedSalesName === item.salesName
                  ? "border-accent-200 bg-accent-100/10 shadow-sm"
                  : "border-border bg-bg-100 hover:border-accent-200/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text-100">{item.salesName}</div>
                <div className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  {primaryCount} 家{primaryLabel}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-text-200">
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <div>当月总开单数</div>
                  <div className="mt-1 text-sm font-semibold text-text-100">
                    {item.totalSignedShopCount} 家
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <div>最终汇总数</div>
                  <div className="mt-1 text-sm font-semibold text-text-100">
                    {item.finalShopCount} 家
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <div>原始无效数</div>
                  <div className="mt-1 text-sm font-semibold text-text-100">
                    {item.invalidShopCount} 家
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <div>3天内解约数</div>
                  <div className="mt-1 text-sm font-semibold text-text-100">
                    {item.terminatedWithinDaysCount} 家
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {summary.length === 0 ? (
        <div className="mt-4">
          <Button htmlType="button" disabled>
            当前月份暂无异常店铺
          </Button>
        </div>
      ) : null}
    </div>
  );
}
