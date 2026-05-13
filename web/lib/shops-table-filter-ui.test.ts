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

  it("所有筛选框在同一行展示", () => {
    expect(source).toContain('className="mt-6 overflow-x-auto pb-2"');
    expect(source).toContain('className="grid min-w-[1120px] grid-cols-7 gap-4 xl:min-w-0"');
    expect(source).not.toContain("xl:grid-cols-5");
  });

  it("日期筛选文案显示为合同签订日期", () => {
    expect(source).toContain("合同签订日期筛选");
    expect(source).not.toContain("录入日期筛选");
  });
});
