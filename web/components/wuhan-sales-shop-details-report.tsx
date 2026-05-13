"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Store } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WuhanSalesShopDetailsTable } from "@/components/wuhan-sales-shop-details-table";
import {
  WUHAN_SALES_STATS_MIN_MONTH,
  normalizeWuhanSalesStatsMonth,
} from "@/features/wuhan-sales-stats/month";
import type { WuhanSalesShopDetailsResponse } from "@/features/wuhan-sales-stats/shop-details-types";

function defaultResponse(month: string): WuhanSalesShopDetailsResponse {
  return {
    month,
    summary: {
      totalShopCount: 0,
      totalAmount: 0,
    },
    data: [],
    total: 0,
  };
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

type WuhanSalesShopDetailsReportProps = {
  initialMonth: string;
};

export function WuhanSalesShopDetailsReport({
  initialMonth,
}: WuhanSalesShopDetailsReportProps) {
  const [month, setMonth] = useState(normalizeWuhanSalesStatsMonth(initialMonth));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<WuhanSalesShopDetailsResponse>(
    defaultResponse(normalizeWuhanSalesStatsMonth(initialMonth))
  );

  useEffect(() => {
    let active = true;

    fetch(`/api/daily-point/wuhan-sales-stats/shop-details?month=${encodeURIComponent(month)}`)
      .then(async (response) => {
        const result = (await response.json()) as WuhanSalesShopDetailsResponse & {
          message?: string;
        };
        if (!response.ok) {
          throw new Error(result.message || "武汉销售店铺明细加载失败");
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
          requestError instanceof Error ? requestError.message : "武汉销售店铺明细加载失败"
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [month]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-100 tracking-tight">武汉销售店铺明细</h2>
              <p className="mt-1 text-sm text-text-200 opacity-80">
                查看当月每个店铺的合同签订日期、商家ID、店铺名、开单销售和总回款金额。
              </p>
            </div>
          </div>

          <Button type="button" variant="outline" asChild>
            <Link href={`/daily-point/wuhan-sales-stats?month=${encodeURIComponent(month)}`}>
              <ArrowLeft className="h-4 w-4" />
              返回武汉销售统计
            </Link>
          </Button>
        </div>

        <div className="mt-4">
          <Input
            type="month"
            value={month}
            min={WUHAN_SALES_STATS_MIN_MONTH}
            onChange={(event) => {
              setLoading(true);
              setMonth(normalizeWuhanSalesStatsMonth(event.target.value));
            }}
            className="w-[180px]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">当月店铺数</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {data.summary.totalShopCount} 家
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">当月总回款金额</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {formatCurrency(data.summary.totalAmount)}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-text-200">统计月份：{data.month}</div>
        {loading ? <div className="mt-4 text-sm text-text-200">加载中...</div> : null}
        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        ) : null}
      </div>

      <WuhanSalesShopDetailsTable details={data.data} />
    </section>
  );
}
