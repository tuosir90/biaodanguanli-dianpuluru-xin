"use client";

import { KanbanSquare } from "lucide-react";
import dayjs from "dayjs";
import { DatePicker, Select } from "antd";
import { NiceLineChart } from "@/components/charts/line-chart";
import type { WorkflowSummary } from "../types";

type WorkflowOverviewSectionProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  summary: WorkflowSummary;
  operators: string[];
  chartOperator: string;
  onChartOperatorChange: (value: string) => void;
};

export function WorkflowOverviewSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  summary,
  operators,
  chartOperator,
  onChartOperatorChange,
}: WorkflowOverviewSectionProps) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text-100">
              <KanbanSquare className="h-6 w-6 text-accent-200" />
              运营工作进度
            </h2>
            <p className="mt-1 text-sm text-text-200 opacity-80">
              默认展示所有运营统计面板；下方可切换到运营明细打标
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <label className="absolute -top-2 left-2 z-10 bg-card px-1 text-[10px] font-medium text-text-200">
                开始日期
              </label>
              <DatePicker
                variant="filled"
                format="YYYY-MM-DD"
                allowClear={false}
                value={startDate ? dayjs(startDate) : null}
                onChange={(date) => {
                  if (date) {
                    onStartDateChange(date.format("YYYY-MM-DD"));
                  }
                }}
                className="h-9 w-[150px] text-sm"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-2 z-10 bg-card px-1 text-[10px] font-medium text-text-200">
                结束日期
              </label>
              <DatePicker
                variant="filled"
                format="YYYY-MM-DD"
                allowClear={false}
                value={endDate ? dayjs(endDate) : null}
                onChange={(date) => {
                  if (date) {
                    onEndDateChange(date.format("YYYY-MM-DD"));
                  }
                }}
                className="h-9 w-[150px] text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft hover-lift">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-100">
            <div className="h-4 w-1 rounded-full bg-accent-200"></div>
            所有运营接手店铺统计面板
          </h3>
          <div className="grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {summary.shopCountByOperator.map((item) => (
              <div
                key={item.operatorName}
                className="flex items-center justify-between rounded-lg bg-bg-200/50 px-4 py-3 text-sm transition-colors duration-fast ease-apple hover:bg-bg-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100/20 text-xs font-bold text-accent-200">
                    {item.operatorName.slice(0, 1)}
                  </div>
                  <span className="font-medium text-text-100">{item.operatorName || "未分配"}</span>
                </div>
                <span className="text-lg font-bold text-accent-200">{item.shopCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft hover-lift">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-text-100">
              <div className="h-4 w-1 rounded-full bg-accent-200"></div>
              每个运营每日的解约店铺数趋势图
            </h3>
            <Select
              value={chartOperator || "ALL"}
              onChange={(val) => onChartOperatorChange(val === "ALL" ? "" : val)}
              options={[
                { value: "ALL", label: "全部运营" },
                ...operators.map((name) => ({ value: name, label: name })),
              ]}
              style={{ width: 140 }}
            />
          </div>
          <div className="mb-4 inline-block rounded-lg bg-bg-200/50 p-2 text-xs text-text-200">
            统计区间：{startDate} ~ {endDate}
          </div>
          <div className="h-64 w-full">
            <NiceLineChart
              series={summary.operatorTerminationTrend}
              valueType="count"
              height={256}
            />
          </div>
        </div>
      </div>
    </>
  );
}
