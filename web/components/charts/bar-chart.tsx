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

  // 中性近黑配色，呼应 Ant Design + shadcn 风格
  const barColorStart = isDark ? "#fafafa" : "#3f3f46"; // 近白 : zinc-700
  const barColorEnd = isDark ? "#a1a1aa" : "#18181b";   // zinc-400 : 近黑
  const textColor = isDark ? "#a1a1aa" : "#71717a";     // zinc-400 : zinc-500
  const splitLineColor = isDark ? "#262626" : "#e7e7e4"; // 边框中性灰
  const tooltipBg = isDark ? "rgba(10, 10, 10, 0.92)" : "rgba(255, 255, 255, 0.95)";
  const tooltipBorder = isDark ? "#262626" : "#e7e7e4";
  const tooltipText = isDark ? "#fafafa" : "#18181b";

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
