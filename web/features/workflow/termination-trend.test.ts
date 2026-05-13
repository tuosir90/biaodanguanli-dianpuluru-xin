import { describe, expect, it } from "vitest";
import { buildWorkflowTerminationTrend } from "./termination-trend";

describe("buildWorkflowTerminationTrend", () => {
  it("按日期生成每个运营的每日解约店铺数趋势", () => {
    const series = buildWorkflowTerminationTrend({
      start: new Date("2026-03-01T00:00:00"),
      end: new Date("2026-03-03T00:00:00"),
      shops: [
        {
          operatorName: "张三",
          shopStatus: "已解约",
          terminationDate: "2026-03-01T08:00:00",
        },
        {
          operatorName: "张三",
          shopStatus: "已解约",
          terminationDate: "2026-03-02T08:00:00",
        },
        {
          operatorName: "李四",
          shopStatus: "已解约",
          terminationDate: "2026-03-03T08:00:00",
        },
      ],
    });

    const byOperator = new Map(series.map((item) => [item.name, item.values]));
    expect(byOperator.get("张三")).toEqual([
      { date: "2026-03-01", value: 1 },
      { date: "2026-03-02", value: 1 },
      { date: "2026-03-03", value: 0 },
    ]);
    expect(byOperator.get("李四")).toEqual([
      { date: "2026-03-01", value: 0 },
      { date: "2026-03-02", value: 0 },
      { date: "2026-03-03", value: 1 },
    ]);
  });

  it("只统计已解约且落在区间内的店铺", () => {
    const series = buildWorkflowTerminationTrend({
      start: new Date("2026-03-01T00:00:00"),
      end: new Date("2026-03-01T00:00:00"),
      shops: [
        {
          operatorName: "王五",
          shopStatus: "正常",
          terminationDate: "2026-03-01T08:00:00",
        },
        {
          operatorName: "王五",
          shopStatus: "已解约",
          terminationDate: "2026-02-28T08:00:00",
        },
        {
          operatorName: "王五",
          shopStatus: "已解约",
          terminationDate: "2026-03-01T08:00:00",
        },
      ],
    });

    expect(series).toEqual([
      {
        name: "王五",
        values: [{ date: "2026-03-01", value: 1 }],
      },
    ]);
  });

  it("支持按运营筛选单条趋势", () => {
    const series = buildWorkflowTerminationTrend({
      start: new Date("2026-03-01T00:00:00"),
      end: new Date("2026-03-01T00:00:00"),
      operatorName: "张三",
      shops: [
        {
          operatorName: "张三",
          shopStatus: "已解约",
          terminationDate: "2026-03-01T08:00:00",
        },
        {
          operatorName: "李四",
          shopStatus: "已解约",
          terminationDate: "2026-03-01T08:00:00",
        },
      ],
    });

    expect(series).toEqual([
      {
        name: "张三",
        values: [{ date: "2026-03-01", value: 1 }],
      },
    ]);
  });
});
