"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { AlertCircle, CalendarDays, Filter, Search, Store, Users } from "lucide-react";
import { Button, DatePicker, Input, Select, Table } from "antd";
import dayjs from "dayjs";
import { NiceBarChart } from "@/components/charts/bar-chart";
import type {
  RecentSignedTerminationReport,
  RecentSignedTerminationShop,
} from "@/features/recent-signed-termination/report";
import { cn } from "@/lib/utils";

type ResponseWithMessage = RecentSignedTerminationReport & {
  message?: string;
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function emptyReport(month: string): RecentSignedTerminationReport {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const current = new Date(Date.UTC(year, monthIndex, 1));
  const previous = new Date(Date.UTC(year, monthIndex - 1, 1));
  const next = new Date(Date.UTC(year, monthIndex + 1, 1));
  const end = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), 0));
  const formatMonth = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const formatDate = (date: Date) =>
    `${formatMonth(date)}-${String(date.getUTCDate()).padStart(2, "0")}`;

  return {
    month,
    signedMonthRange: {
      startMonth: formatMonth(previous),
      endMonth: formatMonth(current),
      startDate: formatDate(previous),
      endDate: formatDate(end),
    },
    twoMonthSignedRange: {
      startMonth: formatMonth(previous),
      endMonth: formatMonth(current),
      startDate: formatDate(previous),
      endDate: formatDate(end),
    },
    totalTerminatedCount: 0,
    twoMonthSignedShopCount: 0,
    operatorCount: 0,
    operatorStats: [],
    shops: [],
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: ElementType;
  tone?: "default" | "danger" | "info";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-text-200">{title}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text-100">{value}</div>
          {description ? (
            <div className="mt-1 text-xs leading-5 text-text-200">{description}</div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tone === "danger"
              ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300"
              : tone === "info"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                : "bg-accent-200/10 text-accent-200"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function platformLabel(value: string) {
  return value || "未填写";
}

function formatTerminationRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function RecentSignedTerminationReportView() {
  const initialMonth = useMemo(() => currentMonth(), []);
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<RecentSignedTerminationReport>(() =>
    emptyReport(initialMonth)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [platform, setPlatform] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/termination/recent-signed-stats?month=${month}`)
      .then(async (response) => {
        const result = (await response.json()) as ResponseWithMessage;
        if (!response.ok) {
          throw new Error(result.message || "新签解约统计数据加载失败");
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
        setData(emptyReport(month));
        setError(
          requestError instanceof Error ? requestError.message : "新签解约统计数据加载失败"
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

  const operatorOptions = useMemo(
    () =>
      data.operatorStats.map((item) => ({
        value: item.operatorName,
        label: item.operatorName,
      })),
    [data.operatorStats]
  );

  const platformOptions = useMemo(() => {
    const platforms = Array.from(
      new Set(data.shops.map((shop) => platformLabel(shop.deliveryPlatform)))
    );
    return platforms
      .sort((left, right) => left.localeCompare(right, "zh-CN"))
      .map((item) => ({ value: item, label: item }));
  }, [data.shops]);

  const filteredShops = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return data.shops.filter((shop) => {
      const matchesOperator = operatorName ? shop.operatorName === operatorName : true;
      const matchesPlatform = platform ? platformLabel(shop.deliveryPlatform) === platform : true;
      const matchesKeyword = normalizedKeyword
        ? shop.shopName.toLowerCase().includes(normalizedKeyword) ||
          shop.merchantId.toLowerCase().includes(normalizedKeyword)
        : true;
      return matchesOperator && matchesPlatform && matchesKeyword;
    });
  }, [data.shops, keyword, operatorName, platform]);

  const chartData = data.operatorStats.map((item) => ({
    label: item.operatorName,
    value: item.count,
  }));

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-100">新签解约统计</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-text-200">
                按运营统计当月解约店铺中，仅属于上月和本月签约的店铺数量。
              </p>
              <div className="mt-2 text-xs text-text-200">
                统计月份：{data.month} ｜ 签约范围：{data.signedMonthRange.startMonth} ~{" "}
                {data.signedMonthRange.endMonth} ｜ 两个月总数范围：
                {data.twoMonthSignedRange.startMonth} ~ {data.twoMonthSignedRange.endMonth} ｜
                解约范围：{data.month}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-100 p-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card">
              <CalendarDays className="h-4 w-4 text-text-200" />
            </div>
            <DatePicker
              picker="month"
              allowClear={false}
              format="YYYY-MM"
              value={dayjs(`${month}-01`)}
              className="h-9 w-[150px]"
              onChange={(value) => {
                if (!value) return;
                setLoading(true);
                setMonth(value.format("YYYY-MM"));
                setOperatorName("");
                setPlatform("");
                setKeyword("");
              }}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="新签解约总数"
          value={`${data.totalTerminatedCount} 家`}
          description="上月或本月签约，且本月解约"
          icon={AlertCircle}
          tone="danger"
        />
        <StatCard
          title="涉及运营人数"
          value={`${data.operatorCount} 人`}
          description="按负责运营去重"
          icon={Users}
          tone="info"
        />
        <StatCard
          title="两个月店铺总数"
          value={`${data.twoMonthSignedShopCount} 家`}
          description={`${data.twoMonthSignedRange.startMonth} ~ ${data.twoMonthSignedRange.endMonth} 签约`}
          icon={Store}
          tone="info"
        />
        <StatCard
          title="签约月份范围"
          value={`${data.signedMonthRange.startMonth} ~ ${data.signedMonthRange.endMonth}`}
          description={`${data.signedMonthRange.startDate} 至 ${data.signedMonthRange.endDate}`}
          icon={CalendarDays}
        />
        <StatCard
          title="当前明细"
          value={`${filteredShops.length} 家`}
          description="受运营、平台、关键词筛选影响"
          icon={Search}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-100">运营新签解约数量</h2>
              <p className="mt-1 text-sm text-text-200">
                图表只展示满足“上月或本月签约、本月解约”口径的店铺。
              </p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <NiceBarChart data={chartData} height={330} />
          ) : (
            <div className="flex h-[330px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-100 text-sm text-text-200">
              暂无新签解约数据
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-bg-100/60 px-5 py-4">
            <h2 className="text-base font-semibold text-text-100">运营汇总</h2>
            <p className="mt-1 text-xs text-text-200">
              按解约数量从高到低排序，同时展示两个月签约店铺总数
            </p>
          </div>
          <Table
            rowKey="operatorName"
            loading={loading}
            pagination={false}
            dataSource={data.operatorStats}
            columns={[
              {
                title: "运营人员",
                dataIndex: "operatorName",
                render: (value: string) => (
                  <button
                    type="button"
                    onClick={() => setOperatorName(value === operatorName ? "" : value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-colors",
                      value === operatorName
                        ? "bg-accent-200/10 font-semibold text-accent-200"
                        : "text-text-100 hover:bg-bg-200"
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-200/10 text-xs font-bold text-accent-200">
                      {value.charAt(0)}
                    </span>
                    {value}
                  </button>
                ),
              },
              {
                title: "解约数量",
                dataIndex: "count",
                align: "right",
                render: (value: number) => (
                  <span className="font-mono font-semibold text-red-600 dark:text-red-300">
                    {value}
                  </span>
                ),
              },
              {
                title: "两个月总数",
                dataIndex: "twoMonthSignedShopCount",
                align: "right",
                render: (value: number) => (
                  <span className="font-mono font-semibold text-text-100">{value}</span>
                ),
              },
              {
                title: "解约率",
                dataIndex: "terminationRate",
                align: "right",
                render: (value: number) => (
                  <span className="font-mono font-semibold text-text-100">
                    {formatTerminationRate(value)}
                  </span>
                ),
              },
            ]}
            locale={{ emptyText: "暂无运营汇总数据" }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-bg-100/60 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-100">店铺明细</h2>
              <p className="mt-1 text-xs text-text-200">
                可逐条核对运营汇总数量来源，共 {filteredShops.length} 条
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_180px_260px_auto]">
              <Select
                allowClear
                value={operatorName || undefined}
                placeholder="筛选运营"
                options={operatorOptions}
                onChange={(value) => setOperatorName(value || "")}
              />
              <Select
                allowClear
                value={platform || undefined}
                placeholder="筛选平台"
                options={platformOptions}
                onChange={(value) => setPlatform(value || "")}
              />
              <Input
                allowClear
                prefix={<Search className="h-4 w-4 text-text-200" />}
                value={keyword}
                placeholder="搜索店铺名或商家ID"
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Button
                icon={<Filter className="h-4 w-4" />}
                onClick={() => {
                  setOperatorName("");
                  setPlatform("");
                  setKeyword("");
                }}
              >
                清空
              </Button>
            </div>
          </div>
        </div>

        <Table<RecentSignedTerminationShop>
          rowKey={(record) => record.id || record.merchantId || record.shopName}
          loading={loading}
          dataSource={filteredShops}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "店铺名",
              dataIndex: "shopName",
              width: 260,
              fixed: "left",
              render: (value: string) => (
                <span className="font-medium text-text-100">{value || "-"}</span>
              ),
            },
            {
              title: "商家ID",
              dataIndex: "merchantId",
              width: 150,
              render: (value: string) => (
                <span className="font-mono text-xs text-text-200">{value || "-"}</span>
              ),
            },
            {
              title: "外卖平台",
              dataIndex: "deliveryPlatform",
              width: 150,
              render: (value: string) => (
                <span className="text-sm text-text-100">{platformLabel(value)}</span>
              ),
            },
            {
              title: "负责运营",
              dataIndex: "operatorName",
              width: 140,
            },
            {
              title: "合同签订日期",
              dataIndex: "contractSignedDate",
              width: 150,
              render: (value: string) => (
                <span className="font-mono text-xs text-text-200">{value}</span>
              ),
            },
            {
              title: "解约日期",
              dataIndex: "terminationDate",
              width: 150,
              render: (value: string) => (
                <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-300">
                  {value}
                </span>
              ),
            },
            {
              title: "运营天数",
              dataIndex: "terminationCooperationDays",
              align: "right" as const,
              width: 120,
              render: (value: number | null) => (
                <span className="font-mono text-xs text-text-200">
                  {typeof value === "number" ? `${value} 天` : "-"}
                </span>
              ),
            },
          ]}
          locale={{ emptyText: "暂无符合当前口径的解约店铺" }}
        />
      </div>
    </section>
  );
}
