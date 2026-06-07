"use client";

import { useMemo } from "react";
import { RecentSignedReminderCopyBox } from "./recent-signed-reminder-copy-box";
import { RECENT_SIGNED_WINDOW_LABEL } from "../constants";
import { groupRecentSignedMonitorRows } from "../recent-signed-monitor-layout";
import type { RecentSignedMonitorItem, ShopItem } from "../types";

type WorkflowRecentSignedSectionProps = {
  recentSignedMonitor: RecentSignedMonitorItem[];
  recentSignedTotalShops: number;
  recentSignedExpandedOperator: string;
  recentSignedDetailItemsMap: Record<string, ShopItem[]>;
  recentSignedDetailTotalMap: Record<string, number>;
  recentSignedDetailLoadingOperator: string;
  recentSignedDetailErrorMap: Record<string, string>;
  onToggleRecentSignedDetails: (operatorName: string) => void;
};

export function WorkflowRecentSignedSection({
  recentSignedMonitor,
  recentSignedTotalShops,
  recentSignedExpandedOperator,
  recentSignedDetailItemsMap,
  recentSignedDetailTotalMap,
  recentSignedDetailLoadingOperator,
  recentSignedDetailErrorMap,
  onToggleRecentSignedDetails,
}: WorkflowRecentSignedSectionProps) {
  const rows = useMemo(
    () =>
      groupRecentSignedMonitorRows(
        recentSignedMonitor.filter((item) => Number(item.recentSignedShopCount ?? 0) > 0)
      ),
    [recentSignedMonitor]
  );

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-200 text-text-100">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h4 className="text-base font-bold text-text-100">{RECENT_SIGNED_WINDOW_LABEL}店铺提醒统计</h4>
          <p className="text-xs text-text-200">用于运营休息前一天筛出需群发通知的商家，点击按钮可查看对应店铺明细</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-bg-200/60 px-3 py-2">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-200">
          当前{RECENT_SIGNED_WINDOW_LABEL}店铺：{recentSignedTotalShops}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-100/50 px-4 py-8 text-center text-sm text-text-200">
          当前暂无{RECENT_SIGNED_WINDOW_LABEL}且符合提醒条件的店铺
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={`recent-signed-row-${rowIndex}`} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {row.map((item) => {
                const normalizedOperatorName = (item.operatorName || "").trim() || "未分配";
                const isExpanded = recentSignedExpandedOperator === normalizedOperatorName;
                const detailItems = recentSignedDetailItemsMap[normalizedOperatorName] ?? [];
                const detailTotal = recentSignedDetailTotalMap[normalizedOperatorName] ?? 0;
                const detailError = recentSignedDetailErrorMap[normalizedOperatorName] ?? "";
                const detailLoading = recentSignedDetailLoadingOperator === normalizedOperatorName;

                return (
                  <div key={`recent-signed-${item.operatorName}`} className="rounded-xl border border-border bg-bg-200/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                          {normalizedOperatorName.slice(0, 1)}
                        </span>
                        <span className="text-sm font-semibold text-text-100">{normalizedOperatorName}</span>
                      </div>
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-200">
                        {RECENT_SIGNED_WINDOW_LABEL}店铺：{item.recentSignedShopCount}家
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleRecentSignedDetails(item.operatorName)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        isExpanded
                          ? "border-primary bg-primary text-primary-foreground shadow ring-2 ring-primary/30"
                          : "border-border bg-card text-text-100 hover:border-text-200 hover:bg-bg-200"
                      }`}
                    >
                      {isExpanded ? "收起店铺明细" : `查看 ${item.recentSignedShopCount} 家提醒店铺`}
                    </button>

                    {isExpanded ? (
                      <div className="mt-4 rounded-xl border border-border bg-card p-4">
                        <RecentSignedReminderCopyBox />
                        <div className="mb-3 text-xs text-text-200">
                          共 {detailTotal} 家，当前展示 {detailItems.length} 家
                        </div>

                        {detailLoading ? (
                          <div className="rounded-lg border border-dashed border-border bg-bg-100/50 px-4 py-6 text-sm text-text-200">加载中...</div>
                        ) : detailError ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
                            {detailError}
                          </div>
                        ) : detailItems.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border bg-bg-100/50 px-4 py-6 text-sm text-text-200">暂无可提醒的店铺</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-xs">
                              <thead>
                                <tr className="border-b border-border text-text-200">
                                  <th className="px-2 py-2 font-medium">店铺名</th>
                                  <th className="px-2 py-2 font-medium">商家ID</th>
                                  <th className="px-2 py-2 font-medium">微信群名称</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailItems.map((shop) => (
                                  <tr key={`recent-signed-shop-${shop._id}`} className="border-b border-border/60 text-text-100">
                                    <td className="px-2 py-2">{shop.shopName || "-"}</td>
                                    <td className="px-2 py-2 font-mono">{shop.merchantId || "-"}</td>
                                    <td className="px-2 py-2">{shop.wechatGroupName || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
