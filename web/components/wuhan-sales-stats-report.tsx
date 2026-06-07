"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button, Input } from "antd";
import { WuhanSalesDailyStatsTable } from "@/components/wuhan-sales-daily-stats-table";
import { WuhanSalesTrendCharts } from "@/components/wuhan-sales-trend-charts";
import {
  WUHAN_SALES_STATS_ALL_VALUE,
  WUHAN_SALES_STATS_MIN_MONTH,
  normalizeWuhanSalesStatsMonth,
} from "@/features/wuhan-sales-stats/month";
import type { WuhanSalesStatsResponse } from "@/features/wuhan-sales-stats/types";

function defaultMonth() {
  const now = new Date();
  return normalizeWuhanSalesStatsMonth(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
}

function defaultResponse(month: string): WuhanSalesStatsResponse {
  return {
    month,
    summary: {
      totalSignedShopCount: 0,
      totalDailyPointAmount: 0,
      totalSalesPersonCount: 0,
    },
    dailyStats: [],
  };
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

export function WuhanSalesStatsReport() {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth());
  const [showAllDates, setShowAllDates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestScope = showAllDates ? WUHAN_SALES_STATS_ALL_VALUE : selectedMonth;
  const [data, setData] = useState<WuhanSalesStatsResponse>(defaultResponse(requestScope));

  useEffect(() => {
    let active = true;

    fetch(`/api/daily-point/wuhan-sales-stats?month=${encodeURIComponent(requestScope)}`)
      .then(async (response) => {
        const result = (await response.json()) as WuhanSalesStatsResponse & { message?: string };
        if (!response.ok) {
          throw new Error(result.message || "武汉销售数据统计加载失败");
        }
        return result;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error ? requestError.message : "武汉销售数据统计加载失败"
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestScope]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-100 tracking-tight">武汉销售数据统计</h2>
            <p className="mt-1 text-sm text-text-200 opacity-80">
              按日查看武汉销售团队的抽点店铺数、总回款金额以及开单店铺明细。
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Input
            type="month"
            value={selectedMonth}
            min={WUHAN_SALES_STATS_MIN_MONTH}
            onChange={(event) => {
              setLoading(true);
              setShowAllDates(false);
              setSelectedMonth(normalizeWuhanSalesStatsMonth(event.target.value));
            }}
            className="w-[180px]"
          />
          <Button
            htmlType="button"
            type={showAllDates ? "primary" : "default"}
            onClick={() => {
              setLoading(true);
              setShowAllDates((previous) => !previous);
            }}
          >
            {showAllDates ? "按月查看" : "全部日期"}
          </Button>
          <div className="text-xs text-text-200">
            武汉销售回款统计从 {WUHAN_SALES_STATS_MIN_MONTH} 开始
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">{showAllDates ? "累计回款金额" : "月累计回款金额"}</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {formatCurrency(data.summary.totalDailyPointAmount)}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">{showAllDates ? "累计开单店铺数" : "月累计开单店铺数"}</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {data.summary.totalSignedShopCount} 家
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">{showAllDates ? "累计开单销售人数" : "月开单销售人数"}</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {data.summary.totalSalesPersonCount} 人
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-text-200">
          {showAllDates ? "统计范围：全部日期" : `统计月份：${data.month}`}
        </div>
        {loading ? <div className="mt-4 text-sm text-text-200">加载中...</div> : null}
        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        ) : null}
      </div>

      <WuhanSalesTrendCharts dailyStats={data.dailyStats} />

      <WuhanSalesDailyStatsTable month={requestScope} dailyStats={data.dailyStats} />
    </section>
  );
}
