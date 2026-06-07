import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("所有运营接手店铺统计面板 v6 组件", () => {
  const source = readFileSync(
    path.resolve(
      __dirname,
      "../features/workflow/components/workflow-overview-section.tsx"
    ),
    "utf8"
  );

  it("使用 Ant Design v6 数据展示组件重构运营统计面板", () => {
    expect(source).toContain("<Card");
    expect(source).toContain('variant="outlined"');
    expect(source).toContain("<Statistic");
    expect(source).toContain("<Row");
    expect(source).toContain("<Col");
    expect(source).toContain("<Avatar");
    expect(source).toContain("<Progress");
    expect(source).toContain("<Empty");
    expect(source).toContain("所有运营接手店铺统计面板");
    expect(source).not.toContain("<List");
    expect(source).not.toContain("valueStyle");
    expect(source).not.toContain("trailColor");
  });

  it("移除运营统计摘要，只保留列表和空状态", () => {
    expect(source).not.toContain("接手店铺总数");
    expect(source).not.toContain("活跃运营人数");
    expect(source).not.toContain("接手最多运营");
    expect(source).toContain("暂无运营接手店铺数据");
    expect(source).not.toContain("grid max-h-[300px] grid-cols-2");
  });

  it("运营统计面板使用紧凑尺寸", () => {
    expect(source).toContain("styles={{ body: { padding: 16 } }}");
    expect(source).toContain("max-h-[280px]");
    expect(source).toContain("size={28}");
    expect(source).toContain("fontSize: 16");
    expect(source).toContain("rounded-lg border border-border bg-bg-200/50 px-2.5 py-2");
  });
});
