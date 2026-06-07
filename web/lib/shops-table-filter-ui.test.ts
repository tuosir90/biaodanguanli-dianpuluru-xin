import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("店铺数据展示筛选区", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../components/shops-table-client.tsx"),
    "utf8"
  );

  it("不渲染运营状态和销售状态筛选框", () => {
    expect(source).not.toContain('label="运营状态"');
    expect(source).not.toContain('label="销售状态"');
  });

  it("所有筛选框在同一行展示（Ant Design v6 单行工具栏）", () => {
    expect(source).toContain("flex min-w-max items-end gap-3");
    expect(source).toContain('variant="filled"');
    expect(source).not.toContain("grid-cols-7");
    expect(source).not.toContain("xl:grid-cols-5");
  });

  it("导出和清空按钮使用 Ant Design v6 color/variant 样式", () => {
    expect(source).toContain('color="primary"');
    expect(source).toContain('variant="solid"');
    expect(source).toContain('color="default"');
    expect(source).toContain('variant="filled"');
    expect(source).toContain('className="shrink-0 whitespace-nowrap"');
  });

  it("日期筛选文案显示为合同签订日期", () => {
    expect(source).toContain("合同签订日期筛选");
    expect(source).not.toContain("录入日期筛选");
  });
});
