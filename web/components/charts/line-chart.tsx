"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useTheme } from "../theme-provider";

type LinePoint = {
  date: string;
  value: number;
};

type LineSeries = {
  name: string;
  values: LinePoint[];
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function NiceLineChart({
  series,
  valueType,
  height = 320,
}: {
  series: LineSeries[];
  valueType: "count" | "amount" | "percent";
  height?: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const xAxisDates = useMemo(() => {
    const dateSet = new Set<string>();
    series.forEach((item) => {
      item.values.forEach((point) => {
        if (point.date) dateSet.add(point.date);
      });
    });
    return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
  }, [series]);

  const textColor = isDark ? "#a8bbb6" : "#596b67";
  const splitLineColor = isDark ? "#22312e" : "#dce7e3";
  const tooltipBg = isDark ? "rgba(18, 28, 26, 0.94)" : "rgba(255, 255, 255, 0.96)";
  const tooltipBorder = isDark ? "#22312e" : "#dce7e3";
  const tooltipText = isDark ? "#edf7f4" : "#17211f";
  const palette = isDark
    ? ["#5eead4", "#60a5fa", "#4ade80", "#fbbf24", "#f87171", "#c084fc"]
    : ["#0f766e", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

  const option = {
    color: palette,
    grid: {
      left: 24,
      right: 24,
      top: 48,
      bottom: 24,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
        fontSize: 12,
        fontFamily: "inherit",
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 116, 139, 0.35)",
        },
      },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? (params as Array<{ seriesName: string; value: number; marker: string; axisValue: string }>) : [];
        const date = items[0]?.axisValue ?? "";
        const lines = items
          .map((item) => {
            const valueText =
              valueType === "amount"
                ? `¥${formatAmount(Number(item.value ?? 0))}`
                : valueType === "percent"
                  ? `${formatAmount(Number(item.value ?? 0))}%`
                  : String(Number(item.value ?? 0));
            return `<div style=\"display:flex;align-items:center;gap:6px;margin-top:4px;\">${item.marker}<span>${item.seriesName}：</span><b>${valueText}</b></div>`;
          })
          .join("");
        return `<div><div style=\"font-weight:600;\">${date}</div>${lines}</div>`;
      },
    },
    legend: {
      top: 8,
      textStyle: {
        color: textColor,
      },
      type: "scroll",
    },
    xAxis: {
      type: "category",
      data: xAxisDates,
      axisLabel: {
        fontSize: 11,
        color: textColor,
        rotate: 30,
        margin: 12,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: {
        fontSize: 11,
        color: textColor,
        formatter: (value: number) =>
          valueType === "amount"
            ? `¥${formatAmount(value)}`
            : valueType === "percent"
              ? `${formatAmount(value)}%`
              : String(value),
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: "dashed",
          opacity: 0.5,
        },
      },
    },
    series: series.map((item) => {
      const valueByDate = new Map(item.values.map((point) => [point.date, point.value]));
      return {
        name: item.name || "未分配",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        emphasis: {
          focus: "series",
        },
        lineStyle: {
          width: 2.5,
        },
        data: xAxisDates.map((date) => Number(valueByDate.get(date) ?? 0)),
      };
    }),
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ width: "100%", height }}
    />
  );
}
