"use client";

import type { SalesInvalidShopsView } from "@/features/sales-invalid-shops/types";

type SalesInvalidShopsViewTabsProps = {
  activeView: SalesInvalidShopsView;
  counts: {
    invalid: number;
    terminatedWithinDays: number;
    final: number;
  };
  onChangeView: (view: SalesInvalidShopsView) => void;
};

const tabs: Array<{
  value: SalesInvalidShopsView;
  label: string;
  countKey: "final" | "invalid" | "terminatedWithinDays";
}> = [
  { value: "final", label: "最终汇总", countKey: "final" },
  { value: "invalid", label: "原始无效", countKey: "invalid" },
  { value: "terminated", label: "3天内解约", countKey: "terminatedWithinDays" },
];

export function SalesInvalidShopsViewTabs({
  activeView,
  counts,
  onChangeView,
}: SalesInvalidShopsViewTabsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count = counts[tab.countKey];

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChangeView(tab.value)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                activeView === tab.value
                  ? "border-accent-200 bg-accent-100/10 shadow-sm"
                  : "border-border bg-background hover:border-accent-200/40"
              }`}
            >
              <div className="text-sm font-semibold text-text-100">{tab.label}</div>
              <div className="mt-1 text-xs text-text-200">{count} 家店铺</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
