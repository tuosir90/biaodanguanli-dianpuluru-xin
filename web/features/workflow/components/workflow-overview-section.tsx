"use client";

import { KanbanSquare, Store, Users } from "lucide-react";
import dayjs from "dayjs";
import {
  Avatar,
  Card,
  Col,
  DatePicker,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
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

function normalizeOperatorName(operatorName: string) {
  return operatorName.trim() || "未分配";
}

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
  const maxShopCount = Math.max(
    ...summary.shopCountByOperator.map((item) => Number(item.shopCount ?? 0)),
    0
  );

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
        <Card
          variant="outlined"
          className="shadow-soft"
          styles={{ body: { padding: 16 } }}
          title={
            <Space size={8}>
              <Store className="h-5 w-5 text-accent-200" />
              <Typography.Text strong>所有运营接手店铺统计面板</Typography.Text>
            </Space>
          }
          extra={<Tag color="blue">{startDate} ~ {endDate}</Tag>}
        >
          {summary.shopCountByOperator.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              <Row gutter={[8, 8]}>
                {summary.shopCountByOperator.map((item, index) => {
                  const operatorName = normalizeOperatorName(item.operatorName);
                  const shopCount = Number(item.shopCount ?? 0);
                  const percent =
                    maxShopCount > 0 ? Math.round((shopCount / maxShopCount) * 100) : 0;

                  return (
                    <Col xs={24} md={12} key={`${operatorName}-${index}`}>
                      <div className="rounded-lg border border-border bg-bg-200/50 px-2.5 py-2 transition-colors duration-fast ease-apple hover:bg-bg-200">
                        <div className="flex items-start justify-between gap-3">
                          <Space size={8} align="start">
                            <Avatar
                              shape="square"
                              size={28}
                              style={{
                                backgroundColor: "var(--accent)",
                                color: "var(--accent-foreground)",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                              icon={
                                operatorName === "未分配" ? (
                                  <Users className="h-4 w-4" />
                                ) : undefined
                              }
                            >
                              {operatorName.slice(0, 1)}
                            </Avatar>
                            <div className="min-w-0">
                              <Typography.Text strong className="block max-w-[120px] truncate text-sm">
                                {operatorName}
                              </Typography.Text>
                              <Tag
                                color={index === 0 ? "gold" : "default"}
                                style={{
                                  marginTop: 2,
                                  marginInlineEnd: 0,
                                  fontSize: 10,
                                  lineHeight: "16px",
                                }}
                              >
                                第 {index + 1} 名
                              </Tag>
                            </div>
                          </Space>
                          <Statistic
                            value={shopCount}
                            suffix="家"
                            styles={{
                              content: {
                                color: "var(--accent-foreground)",
                                fontSize: 16,
                                fontWeight: 700,
                                lineHeight: 1,
                              },
                            }}
                          />
                        </div>
                        <Progress
                          className="mt-1.5"
                          percent={percent}
                          showInfo={false}
                          size="small"
                          strokeColor="var(--accent-200)"
                          railColor="var(--bg-300)"
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ) : (
            <Empty
              className="mt-4"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无运营接手店铺数据"
            />
          )}
        </Card>

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
