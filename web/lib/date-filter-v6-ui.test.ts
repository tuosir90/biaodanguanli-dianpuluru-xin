import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("日期筛选框 Ant Design v6 样式", () => {
  it("数据统计月份筛选框使用 DatePicker 月份弹窗", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../app/stats/page.tsx"),
      "utf8"
    );

    expect(source).toContain("DatePicker");
    expect(source).toContain('picker="month"');
    expect(source).toContain('variant="filled"');
    expect(source).not.toContain('type="month"');
    expect(source).not.toContain("border-0 bg-transparent");
  });

  it("运营工作进度日期筛选框使用 DatePicker 日期弹窗", () => {
    const source = readFileSync(
      path.resolve(
        __dirname,
        "../features/workflow/components/workflow-overview-section.tsx"
      ),
      "utf8"
    );

    expect(source).toContain("DatePicker");
    expect(source.match(/variant="filled"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source.match(/format="YYYY-MM-DD"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('type="date"');
    expect(source).not.toContain("focus-visible:border-accent-200");
  });
});
