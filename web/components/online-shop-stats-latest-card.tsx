"use client";

import { Store } from "lucide-react";
import type { OnlineShopCountLatestCard } from "@/features/online-shop-stats/types";

export function formatOnlineShopCapturedAt(value: string) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function OnlineShopStatsLatestCard({
  title,
  accentClassName,
  card,
  loading,
}: {
  title: string;
  accentClassName: string;
  card: OnlineShopCountLatestCard | null;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-200">{title}</p>
          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-bg-200" />
          ) : (
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-100">
              {card?.count ?? "—"}
            </h2>
          )}
        </div>
        <div className={`rounded-xl p-3 ${accentClassName}`}>
          <Store className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-text-200">
        <p>统计日期：{card?.statDate ?? "—"}</p>
        <p>采集时间：{card ? formatOnlineShopCapturedAt(card.capturedAt) : "—"}</p>
      </div>
    </div>
  );
}
