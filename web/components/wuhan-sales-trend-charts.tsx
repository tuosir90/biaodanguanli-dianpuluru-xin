"use client";

import { BarChart3, Wallet } from "lucide-react";
import { NiceLineChart } from "@/components/charts/line-chart";
import { buildWuhanSalesTrendSeries } from "@/features/wuhan-sales-stats/trend";
import type { WuhanSalesDailyStatItem } from "@/features/wuhan-sales-stats/types";

type WuhanSalesTrendChartsProps = {
  dailyStats: WuhanSalesDailyStatItem[];
};

function TrendChartCard({
  title,
  subtitle,
  valueType,
  icon: Icon,
  series,
}: {
  title: string;
  subtitle: string;
  valueType: "count" | "amount";
  icon: React.ElementType;
  series: Array<{ name: string; values: Array<{ date: string; value: number }> }>;
}) {
  const hasData = series.some((item) => item.values.some((point) => point.value > 0));

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-100">{title}</h3>
          <p className="mt-1 text-sm text-text-200">{subtitle}</p>
        </div>
      </div>

      {hasData ? (
        <NiceLineChart series={series} valueType={valueType} height={300} />
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-100/50 text-sm text-text-200">
          当前月份暂无趋势数据
        </div>
      )}
    </div>
  );
}

export function WuhanSalesTrendCharts({
  dailyStats,
}: WuhanSalesTrendChartsProps) {
  const { dailyPointShopSeries, dailyPointAmountSeries } =
    buildWuhanSalesTrendSeries(dailyStats);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <TrendChartCard
        title="每日抽点店铺数趋势图"
        subtitle="查看武汉销售团队每天有抽点记录的店铺数量变化"
        valueType="count"
        icon={BarChart3}
        series={dailyPointShopSeries}
      />
      <TrendChartCard
        title="每日总回款金额趋势图"
        subtitle="查看武汉销售团队每天抽点回款总金额变化"
        valueType="amount"
        icon={Wallet}
        series={dailyPointAmountSeries}
      />
    </div>
  );
}
