"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { PremiumShopsReport } from "@/components/premium-shops-report";
import type { PremiumShopReport } from "@/features/premium-shops/types";

export function PremiumShopsClient() {
  const [data, setData] = useState<PremiumShopReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/premium-shops")
      .then((response) => {
        if (!response.ok) {
          throw new Error("fetch_failed");
        }
        return response.json();
      })
      .then((payload: PremiumShopReport) => {
        setData(payload);
        setError("");
      })
      .catch(() => {
        setData(null);
        setError("优质店铺列表加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6 p-1 pb-10 animate-in fade-in duration-500">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-text-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Crown className="h-5 w-5" />
          </div>
          优质店铺列表
        </h1>
        <p className="mt-2 text-sm text-text-200 opacity-80">
          每天自动按美团与饿了么在线未解约店铺的累计总回款排序。
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <PremiumShopsReport data={data} loading={loading} />
    </section>
  );
}
