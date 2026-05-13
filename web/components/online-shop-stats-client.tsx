"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OnlineShopStatsReport } from "@/components/online-shop-stats-report";
import type { OnlineShopCountReport } from "@/features/online-shop-stats/types";

function currentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function createEmptyReport(month: string): OnlineShopCountReport {
  return {
    month,
    latestCards: [],
    trendSeries: [
      { name: "美团", values: [] },
      { name: "饿了么", values: [] },
    ],
    rows: [],
  };
}

export function OnlineShopStatsClient() {
  const initialMonth = useMemo(() => currentMonth(), []);
  const [month, setMonth] = useState(initialMonth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<OnlineShopCountReport>(createEmptyReport(initialMonth));

  useEffect(() => {
    fetch(`/api/online-shop-counts?month=${month}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("fetch_failed");
        }
        return response.json();
      })
      .then((payload: OnlineShopCountReport) => {
        setData(payload);
        setError("");
      })
      .catch(() => {
        setData(createEmptyReport(month));
        setError("在线店铺数数据加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <section className="space-y-6 p-1 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-text-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-200 text-white shadow-lg shadow-accent-200/20">
              <Store className="h-5 w-5" />
            </div>
            在线店铺数统计
          </h1>
          <p className="mt-2 text-sm text-text-200 opacity-80">
            查看美团与饿了么在线店铺数的每日最新采集结果，数据来自自动采集后追加入库的云端快照。
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-1.5 shadow-sm">
          <div className="flex items-center justify-center rounded-lg bg-bg-200 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-text-200" />
          </div>
          <Input
            type="month"
            value={month}
            onChange={(event) => {
              setLoading(true);
              setMonth(event.target.value || initialMonth);
            }}
            className="h-9 w-auto border-0 bg-transparent p-0 text-sm font-medium text-text-100 focus-visible:ring-0 hover:bg-transparent"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <OnlineShopStatsReport data={data} loading={loading} />
    </section>
  );
}
