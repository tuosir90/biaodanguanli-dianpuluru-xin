"use client";

import { useEffect, useMemo, useState } from "react";
import { NiceBarChart } from "@/components/charts/bar-chart";
import { NiceLineChart } from "@/components/charts/line-chart";
import { BarChart3, Store, TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TrendItem = {
  date?: string;
  name?: string;
  count: number;
};

type DailyPointTrendPoint = {
  date: string;
  value: number;
};

type DailyPointTrendSeries = {
  name: string;
  values: DailyPointTrendPoint[];
};

type StatsResponse = {
  month: string;
  monthlyShopCount: number;
  dailyOrderShopTrend: TrendItem[];
  operatorShopTrend: TrendItem[];
  salesShopTrend: TrendItem[];
  salesCityShopTrend: TrendItem[];
  operatorTerminationTrend: TrendItem[];
  meituanDailyTerminationShopTrend: DailyPointTrendSeries[];
  elemeDailyTerminationShopTrend: DailyPointTrendSeries[];
  meituanDailyPointShopTrend: DailyPointTrendSeries[];
  meituanDailyPointAmountTrend: DailyPointTrendSeries[];
  elemeDailyPointShopTrend: DailyPointTrendSeries[];
  elemeDailyPointAmountTrend: DailyPointTrendSeries[];
};

function formatMonthDayLabel(value: string) {
  const normalized = String(value ?? "").trim();
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return normalized || "未知";
  return `${matched[2]}-${matched[3]}`;
}

function currentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function LineChartSection({
  title,
  subtitle,
  data,
  valueType,
  icon: Icon,
  className,
}: {
  title: string;
  subtitle?: string;
  data: DailyPointTrendSeries[];
  valueType: "count" | "amount";
  icon?: React.ElementType;
  className?: string;
}) {
  const hasData = data.length > 0 && data.some((series) => series.values.length > 0);

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-100">
            {Icon && <Icon className="h-5 w-5 text-accent-200" />}
            {title}
          </h3>
          {subtitle && <p className="mt-1 text-sm text-text-200 opacity-70">{subtitle}</p>}
        </div>
      </div>

      {hasData ? (
        <div className="relative z-10">
          <NiceLineChart series={data} valueType={valueType} height={320} />
        </div>
      ) : (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-200/30">
          <div className="rounded-full bg-bg-200 p-3">
            <BarChart3 className="h-6 w-6 text-text-200 opacity-50" />
          </div>
          <p className="mt-3 text-sm font-medium text-text-200 opacity-70">暂无数据</p>
        </div>
      )}
    </div>
  );
}

function ChartSection({
  title,
  subtitle,
  data,
  xKey,
  icon: Icon,
  className,
}: {
  title: string;
  subtitle?: string;
  data: TrendItem[];
  xKey: "date" | "name";
  icon?: React.ElementType;
  className?: string;
}) {
  const chartData = data.map((item) => ({
    label:
      xKey === "date"
        ? formatMonthDayLabel(String(item.date ?? ""))
        : String(item.name ?? "未知"),
    value: Number(item.count ?? 0),
  }));

  const hasData = chartData.length > 0 && chartData.some(d => d.value > 0);

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-100">
            {Icon && <Icon className="h-5 w-5 text-accent-200" />}
            {title}
          </h3>
          {subtitle && <p className="mt-1 text-sm text-text-200 opacity-70">{subtitle}</p>}
        </div>
      </div>
      
      {hasData ? (
        <div className="relative z-10">
          <NiceBarChart data={chartData} height={320} />
        </div>
      ) : (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-200/30">
          <div className="rounded-full bg-bg-200 p-3">
            <BarChart3 className="h-6 w-6 text-text-200 opacity-50" />
          </div>
          <p className="mt-3 text-sm font-medium text-text-200 opacity-70">暂无数据</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  loading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  loading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-200 opacity-80">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-bg-200"></div>
          ) : (
            <h4 className="mt-2 text-3xl font-bold text-text-100 tracking-tight">{value}</h4>
          )}
        </div>
        <div className="rounded-xl bg-accent-200/10 p-3 text-accent-200">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          <span>{trend}</span>
        </div>
      )}
      
      {/* Decorative gradient background */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-200/5 blur-2xl transition-all group-hover:bg-accent-200/10"></div>
    </div>
  );
}

export default function StatsPage() {
  const initialMonth = useMemo(() => currentMonth(), []);
  const [month, setMonth] = useState(initialMonth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<StatsResponse>({
    month: initialMonth,
    monthlyShopCount: 0,
    dailyOrderShopTrend: [],
    operatorShopTrend: [],
    salesShopTrend: [],
    salesCityShopTrend: [],
    operatorTerminationTrend: [],
    meituanDailyTerminationShopTrend: [],
    elemeDailyTerminationShopTrend: [],
    meituanDailyPointShopTrend: [],
    meituanDailyPointAmountTrend: [],
    elemeDailyPointShopTrend: [],
    elemeDailyPointAmountTrend: [],
  });

  useEffect(() => {
    fetch(`/api/stats/monthly?month=${month}`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data: StatsResponse) => {
        setStats(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("统计数据加载失败，请稍后重试");
      })
      .finally(() => setLoading(false));
  }, [month]);

  function handleMonthChange(value: string) {
    if (!value) return;
    setLoading(true);
    setMonth(value);
  }

  return (
    <section className="space-y-8 p-1 pb-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-100 tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-200 text-white shadow-lg shadow-accent-200/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            数据统计中心
          </h1>
          <p className="mt-2 text-sm text-text-200 opacity-70 max-w-md">
            查看店铺运营核心指标，包括每日开单、人员绩效及解约情况分析。
          </p>
        </div>
        
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-1.5 shadow-sm">
          <div className="flex items-center justify-center rounded-lg bg-bg-200 px-3 py-2">
            <Calendar className="h-4 w-4 text-text-200" />
          </div>
          <Input
            type="month"
            className="h-9 w-auto border-0 bg-transparent p-0 text-sm font-medium text-text-100 focus-visible:ring-0 hover:bg-transparent"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={`${month.split('-')[1]}月总店铺数`}
          value={stats.monthlyShopCount}
          icon={Store}
          loading={loading}
          trend="较上月数据"
        />
        {/* Placeholders for future stats */}
        <StatCard 
          title="活跃运营人数"
          value={stats.operatorShopTrend.length}
          icon={Users}
          loading={loading}
        />
        <StatCard 
          title="活跃销售人数"
          value={stats.salesShopTrend.length}
          icon={Users}
          loading={loading}
        />
        <StatCard 
          title="本月解约数"
          value={stats.operatorTerminationTrend.reduce((acc, curr) => acc + curr.count, 0)}
          icon={AlertCircle}
          loading={loading}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ChartSection
            title="每日开单店铺趋势"
            subtitle="展示本月每天有开单记录的店铺数量变化趋势"
            data={stats.dailyOrderShopTrend}
            xKey="date"
            icon={TrendingUp}
            className="bg-gradient-to-br from-card to-bg-100/50"
          />
        </div>
        <ChartSection
          title="运营店铺分布"
          subtitle="各运营人员负责的店铺数量统计"
          data={stats.operatorShopTrend}
          xKey="name"
          icon={Users}
        />
        <ChartSection
          title="销售业绩分布"
          subtitle="各销售人员开发的店铺数量统计"
          data={stats.salesShopTrend}
          xKey="name"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartSection
          title="销售城市开单分布"
          subtitle="武汉与宜昌销售团队当月开单店铺数量对比"
          data={stats.salesCityShopTrend}
          xKey="name"
          icon={Users}
          className="bg-gradient-to-br from-card to-bg-100/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChartSection
          title="美团每日解约店铺数趋势图"
          subtitle="按日期查看美团每日解约店铺数变化"
          data={stats.meituanDailyTerminationShopTrend}
          valueType="count"
          icon={AlertCircle}
        />
        <LineChartSection
          title="饿了么每日解约店铺数趋势图"
          subtitle="按日期查看饿了么每日解约店铺数变化"
          data={stats.elemeDailyTerminationShopTrend}
          valueType="count"
          icon={AlertCircle}
        />
        <LineChartSection
          title="美团每日抽点店铺数趋势图"
          subtitle="按运营查看美团每日抽点去重店铺数变化"
          data={stats.meituanDailyPointShopTrend}
          valueType="count"
          icon={TrendingUp}
        />
        <LineChartSection
          title="美团每日抽点总金额趋势图"
          subtitle="按运营查看美团每日抽点总金额变化"
          data={stats.meituanDailyPointAmountTrend}
          valueType="amount"
          icon={TrendingUp}
        />
        <LineChartSection
          title="饿了么每日抽点店铺数趋势图"
          subtitle="按运营查看饿了么每日抽点去重店铺数变化"
          data={stats.elemeDailyPointShopTrend}
          valueType="count"
          icon={TrendingUp}
        />
        <LineChartSection
          title="饿了么每日抽点总金额趋势图"
          subtitle="按运营查看饿了么每日抽点总金额变化"
          data={stats.elemeDailyPointAmountTrend}
          valueType="amount"
          icon={TrendingUp}
        />
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-bg-100/50 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-text-100">
            <AlertCircle className="h-5 w-5 text-accent-200" />
            运营解约数据明细
          </h3>
          <p className="mt-1 text-sm text-text-200 opacity-70">
            {month} 月各运营人员负责店铺的解约情况统计
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-bg-200/40">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[200px] px-6 py-4 text-left font-semibold text-text-200">月份</TableHead>
                <TableHead className="px-6 py-4 text-left font-semibold text-text-200">运营人员</TableHead>
                <TableHead className="px-6 py-4 text-right font-semibold text-text-200">解约数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-bg-200"></div></TableCell>
                    <TableCell className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-bg-200"></div></TableCell>
                    <TableCell className="px-6 py-4 text-right"><div className="ml-auto h-4 w-8 animate-pulse rounded bg-bg-200"></div></TableCell>
                  </TableRow>
                ))
              ) : stats.operatorTerminationTrend.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-text-200 opacity-60">
                      <AlertCircle className="mb-2 h-8 w-8 opacity-20" />
                      <p className="text-sm">本月暂无解约数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stats.operatorTerminationTrend.map((item, index) => (
                  <TableRow key={`${stats.month}-${item.name || index}`} className="border-border hover:bg-bg-100/50 transition-colors">
                    <TableCell className="px-6 py-4 text-sm font-medium text-text-200">{stats.month}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-text-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100/20 text-xs font-bold text-accent-200">
                          {(item.name || "未").charAt(0)}
                        </div>
                        {item.name || "未分配"}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-sm font-bold text-accent-200">
                      {item.count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
