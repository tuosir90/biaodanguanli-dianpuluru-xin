import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("数据统计页图表组件库", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../app/stats/page.tsx"),
    "utf8"
  );

  it("所有图表使用 Ant Design Charts，与运营解约趋势图保持一致", () => {
    expect(source).toContain('import { Column, Line } from "@ant-design/charts";');
    expect(source).toContain("<Column");
    expect(source).toContain("<Line");
    expect(source).not.toContain("@/components/charts/bar-chart");
    expect(source).not.toContain("@/components/charts/line-chart");
    expect(source).not.toContain("NiceBarChart");
    expect(source).not.toContain("NiceLineChart");
  });
});
