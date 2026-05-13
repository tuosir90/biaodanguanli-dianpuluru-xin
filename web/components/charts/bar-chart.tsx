"use client";

import ReactECharts from "echarts-for-react";
import { useTheme } from "../theme-provider";

type BarChartDatum = {
  label: string;
  value: number;
};

type TooltipItem = {
  name: string;
  value: number;
  color:
    | string
    | {
        colorStops?: Array<{ color: string }>;
      };
};

export function NiceBarChart({
  data,
  height = 320,
}: {
  data: BarChartDatum[];
  height?: number;
}) {
  const { theme } = useTheme();
  
  const isDark = theme === "dark";
  
  // Colors from palette - refined for better aesthetics
  const barColorStart = isDark ? "#60a5fa" : "#0ea5e9"; // Blue-400 : Sky-500
  const barColorEnd = isDark ? "#3b82f6" : "#0284c7";   // Blue-500 : Sky-600
  const textColor = isDark ? "#94a3b8" : "#64748b";     // Slate-400 : Slate-500
  const splitLineColor = isDark ? "#334155" : "#e2e8f0"; // Slate-700 : Slate-200
  const tooltipBg = isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  const option = {
    grid: {
      left: 20,
      right: 20,
      top: 40,
      bottom: 20,
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
        fontFamily: 'inherit'
      },
      axisPointer: { 
        type: "shadow",
        shadowStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
        }
      },
      padding: [12, 16],
      borderRadius: 8,
      extraCssText: "backdrop-filter: blur(8px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);",
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? (params as TooltipItem[]) : [];
        const item = items[0];
        if (!item) return "";
        const itemColor =
          typeof item.color === "string"
            ? item.color
            : item.color?.colorStops?.[0]?.color ?? barColorStart;
        return `
          <div class="font-medium mb-1">${item.name}</div>
          <div class="flex items-center gap-2 text-sm">
            <div class="w-2 h-2 rounded-full" style="background-color: ${itemColor}"></div>
            <span class="opacity-70">数量:</span>
            <span class="font-bold">${item.value}</span>
          </div>
        `;
      }
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        fontSize: 11,
        interval: 0,
        rotate: 30,
        color: textColor,
        margin: 14,
        fontFamily: 'inherit',
        width: 78,
        overflow: "truncate",
        lineOverflow: "truncate",
        formatter: (value: string) => {
          const normalized = String(value ?? "").trim();
          if (!normalized) return "-";
          return normalized.length > 8 ? `${normalized.slice(0, 8)}…` : normalized;
        },
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
      minInterval: 1,
      axisLabel: {
        fontSize: 11,
        color: textColor,
        fontFamily: 'inherit'
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: "dashed",
          opacity: 0.5
        },
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barMaxWidth: 32, // Slightly wider bars
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
                offset: 0, color: barColorStart // lighter at top
            }, {
                offset: 1, color: barColorEnd // darker at bottom
            }],
            global: false
          },
          borderRadius: [4, 4, 0, 0], // Subtle rounding
        },
        label: {
          show: true,
          position: "top",
          fontSize: 11,
          color: textColor,
          formatter: "{c}",
          distance: 6,
          fontFamily: 'inherit'
        },
        showBackground: true,
        backgroundStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
          borderRadius: [4, 4, 0, 0],
        },
        // Add subtle animation
        animationDelay: (idx: number) => idx * 50,
      },
    ],
    animationEasing: 'elasticOut',
    animationDelayUpdate: (idx: number) => idx * 5,
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
