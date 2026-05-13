"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { WuhanSalesDailyStatItem } from "@/features/wuhan-sales-stats/types";
import { WUHAN_SALES_STATS_ALL_VALUE } from "@/features/wuhan-sales-stats/month";

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

type WuhanSalesDailyStatsTableProps = {
  month: string;
  dailyStats: WuhanSalesDailyStatItem[];
};

export function WuhanSalesDailyStatsTable({
  month,
  dailyStats,
}: WuhanSalesDailyStatsTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-100">每日回款明细</h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-text-200">共 {dailyStats.length} 天</div>
          {month === WUHAN_SALES_STATS_ALL_VALUE ? null : (
            <Button type="button" variant="outline" asChild>
              <Link href={`/daily-point/wuhan-sales-stats/shop-details?month=${encodeURIComponent(month)}`}>
                店铺明细
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead className="text-right">每日抽点店铺数</TableHead>
            <TableHead className="text-right">每日总回款金额</TableHead>
            <TableHead className="text-right">美团抽点店铺数</TableHead>
            <TableHead className="text-right">美团总回款金额</TableHead>
            <TableHead className="text-right">饿了么抽点店铺数</TableHead>
            <TableHead className="text-right">饿了么总回款金额</TableHead>
            <TableHead className="text-right">每日开单店铺数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dailyStats.map((item) => (
            <TableRow key={item.date}>
              <TableCell className="font-mono">{item.date}</TableCell>
              <TableCell className="text-right font-medium">
                {item.dailyPointShopCount}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.dailyPointAmountTotal)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.meituanDailyPointShopCount}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.meituanDailyPointAmountTotal)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.elemeDailyPointShopCount}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.elemeDailyPointAmountTotal)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.signedShopCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
