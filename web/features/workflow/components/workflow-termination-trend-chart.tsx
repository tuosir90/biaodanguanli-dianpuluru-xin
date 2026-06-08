"use client";

import { Line } from "@ant-design/charts";
import { Empty, Space, Tag, Typography } from "antd";
import { useMemo } from "react";
import type { WorkflowTrendSeries } from "../types";
import {
  buildWorkflowTerminationTrendChartData,
  hasWorkflowTerminationTrendData,
} from "../termination-trend-chart";

type WorkflowTerminationTrendChartProps = {
  series: WorkflowTrendSeries[];
  height?: number;
};

export function WorkflowTerminationTrendChart({
  series,
  height = 280,
}: WorkflowTerminationTrendChartProps) {
  const chartData = useMemo(
    () => buildWorkflowTerminationTrendChartData(series),
    [series]
  );
  const hasData = hasWorkflowTerminationTrendData(chartData);
  const operatorCount = new Set(chartData.map((item) => item.operatorName)).size;
  const totalTerminated = chartData.reduce(
    (sum, item) => sum + item.terminatedShopCount,
    0
  );

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-100/40">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无解约趋势数据"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-100/40 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Space size={8} wrap>
          <Tag color="blue">运营 {operatorCount} 人</Tag>
          <Tag color="volcano">解约 {totalTerminated} 家</Tag>
        </Space>
        <Typography.Text type="secondary" className="text-xs">
          按解约日期统计
        </Typography.Text>
      </div>
      <Line
        data={chartData}
        xField="date"
        yField="terminatedShopCount"
        colorField="operatorName"
        height={height}
        autoFit
        axis={{
          x: {
            title: false,
            labelAutoRotate: true,
            labelAutoHide: true,
          },
          y: {
            title: false,
            tickMinStep: 1,
            labelFormatter: (value: number) => `${value}家`,
          },
        }}
        scale={{
          y: {
            nice: true,
            min: 0,
          },
          color: {
            range: [
              "#1677ff",
              "#13c2c2",
              "#52c41a",
              "#faad14",
              "#f5222d",
              "#722ed1",
              "#eb2f96",
              "#2f54eb",
            ],
          },
        }}
        legend={{
          color: {
            position: "top",
            layout: {
              justifyContent: "center",
            },
          },
        }}
        tooltip={{
          title: "date",
          items: [
            {
              field: "terminatedShopCount",
              name: "解约店铺数",
              valueFormatter: (value: number) => `${value} 家`,
            },
          ],
        }}
        interaction={{
          tooltip: {
            shared: true,
          },
          legendFilter: true,
        }}
        style={{
          lineWidth: 2.5,
        }}
        point={{
          shapeField: "circle",
          sizeField: 3,
          style: {
            stroke: "#fff",
            lineWidth: 1,
          },
        }}
      />
    </div>
  );
}
