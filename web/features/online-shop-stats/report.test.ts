import { describe, expect, it } from "vitest";
import { buildOnlineShopCountReport } from "./report";

describe("buildOnlineShopCountReport", () => {
  it("同一天同平台有多次采集时只保留最新一条", () => {
    const report = buildOnlineShopCountReport({
      month: "2026-04",
      snapshots: [
        {
          platform: "meituan",
          statDateKey: "2026-04-24",
          count: 900,
          capturedAt: "2026-04-24T01:00:00.000Z",
        },
        {
          platform: "meituan",
          statDateKey: "2026-04-24",
          count: 925,
          capturedAt: "2026-04-24T01:30:00.000Z",
        },
        {
          platform: "eleme",
          statDateKey: "2026-04-24",
          count: 353,
          capturedAt: "2026-04-24T01:35:00.000Z",
        },
      ],
    });

    expect(report.rows).toEqual([
      {
        date: "2026-04-24",
        meituanCount: 925,
        meituanCapturedAt: "2026-04-24T01:30:00.000Z",
        elemeCount: 353,
        elemeCapturedAt: "2026-04-24T01:35:00.000Z",
      },
    ]);
  });

  it("会按日期倒序输出表格，按日期正序输出趋势", () => {
    const report = buildOnlineShopCountReport({
      month: "2026-04",
      snapshots: [
        {
          platform: "meituan",
          statDateKey: "2026-04-23",
          count: 880,
          capturedAt: "2026-04-23T01:30:00.000Z",
        },
        {
          platform: "meituan",
          statDateKey: "2026-04-24",
          count: 925,
          capturedAt: "2026-04-24T01:30:00.000Z",
        },
      ],
    });

    expect(report.rows.map((item) => item.date)).toEqual(["2026-04-24", "2026-04-23"]);
    expect(report.trendSeries[0].values.map((item) => item.date)).toEqual([
      "2026-04-23",
      "2026-04-24",
    ]);
  });

  it("会为缺失的平台补 0 到趋势图，但表格仍保留空值", () => {
    const report = buildOnlineShopCountReport({
      month: "2026-04",
      snapshots: [
        {
          platform: "eleme",
          statDateKey: "2026-04-22",
          count: 300,
          capturedAt: "2026-04-22T01:30:00.000Z",
        },
      ],
    });

    expect(report.rows[0]).toMatchObject({
      date: "2026-04-22",
      meituanCount: null,
      elemeCount: 300,
    });
    expect(report.trendSeries).toEqual([
      { name: "美团", values: [{ date: "2026-04-22", value: 0 }] },
      { name: "饿了么", values: [{ date: "2026-04-22", value: 300 }] },
    ]);
  });

  it("会分别返回每个平台最新一条卡片数据", () => {
    const report = buildOnlineShopCountReport({
      month: "2026-04",
      snapshots: [
        {
          platform: "eleme",
          statDateKey: "2026-04-23",
          count: 333,
          capturedAt: "2026-04-23T01:30:00.000Z",
        },
        {
          platform: "meituan",
          statDateKey: "2026-04-24",
          count: 925,
          capturedAt: "2026-04-24T01:30:00.000Z",
        },
      ],
    });

    expect(report.latestCards).toEqual([
      {
        platform: "meituan",
        statDate: "2026-04-24",
        count: 925,
        capturedAt: "2026-04-24T01:30:00.000Z",
      },
      {
        platform: "eleme",
        statDate: "2026-04-23",
        count: 333,
        capturedAt: "2026-04-23T01:30:00.000Z",
      },
    ]);
  });
});
