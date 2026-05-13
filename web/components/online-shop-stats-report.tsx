"use client";

import { Activity, Clock3 } from "lucide-react";
import { NiceLineChart } from "@/components/charts/line-chart";
import {
  formatOnlineShopCapturedAt,
  OnlineShopStatsLatestCard,
} from "@/components/online-shop-stats-latest-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnlineShopCountLatestCard, OnlineShopCountReport } from "@/features/online-shop-stats/types";

type OnlineShopStatsReportProps = {
  data: OnlineShopCountReport;
  loading?: boolean;
};

function findLatestCard(
  cards: OnlineShopCountLatestCard[],
  platform: OnlineShopCountLatestCard["platform"]
) {
  return cards.find((item) => item.platform === platform) ?? null;
}

export function OnlineShopStatsReport({
  data,
  loading = false,
}: OnlineShopStatsReportProps) {
  const meituanCard = findLatestCard(data.latestCards, "meituan");
  const elemeCard = findLatestCard(data.latestCards, "eleme");
  const hasTrendData = data.trendSeries.some((series) =>
    series.values.some((item) => item.value > 0)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OnlineShopStatsLatestCard
          title="美团最新在线店铺数"
          accentClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
          card={meituanCard}
          loading={loading}
        />
        <OnlineShopStatsLatestCard
          title="饿了么最新在线店铺数"
          accentClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
          card={elemeCard}
          loading={loading}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-100">在线店铺数趋势图</h3>
            <p className="mt-1 text-sm text-text-200">
              按自然日查看美团与饿了么在线店铺数的最新采集结果
            </p>
          </div>
        </div>

        {hasTrendData ? (
          <NiceLineChart series={data.trendSeries} valueType="count" height={320} />
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-100/50 text-sm text-text-200">
            当前月份暂无在线店铺数数据
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border bg-bg-100/50 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-100">
            <Clock3 className="h-5 w-5 text-accent-200" />
            每日采集明细
          </h3>
          <p className="mt-1 text-sm text-text-200">
            同一天若重复采集，表格仅展示该平台最后一次采集值
          </p>
        </div>

        <Table>
          <TableHeader className="bg-bg-200/40">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="px-6 py-4">日期</TableHead>
              <TableHead className="px-6 py-4">美团在线店铺数</TableHead>
              <TableHead className="px-6 py-4">美团采集时间</TableHead>
              <TableHead className="px-6 py-4">饿了么在线店铺数</TableHead>
              <TableHead className="px-6 py-4">饿了么采集时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell className="px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.rows.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="h-32 text-center text-sm text-text-200">
                  当前月份暂无在线店铺数数据
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => (
                <TableRow key={row.date} className="border-border">
                  <TableCell className="px-6 py-4 font-medium text-text-100">{row.date}</TableCell>
                  <TableCell className="px-6 py-4 text-text-100">
                    {row.meituanCount ?? "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-text-200">
                    {formatOnlineShopCapturedAt(row.meituanCapturedAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-text-100">
                    {row.elemeCount ?? "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-text-200">
                    {formatOnlineShopCapturedAt(row.elemeCapturedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
