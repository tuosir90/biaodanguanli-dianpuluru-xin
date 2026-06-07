import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("店铺录入表单 v6 组件", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../app/shops/new/page.tsx"),
    "utf8"
  );

  it("使用 Ant Design v6 Form 和填充态组件，而不是原生 form", () => {
    expect(source).toContain("<Form<ShopFormValues>");
    expect(source).toContain('variant="filled"');
    expect(source).toContain("<Form.Item<ShopFormValues>");
    expect(source).toContain("<DatePicker");
    expect(source).not.toContain("<form onSubmit=");
    expect(source).not.toContain("function FieldLabel");
  });

  it("提交按钮使用 Ant Design v6 color/variant 样式", () => {
    expect(source).toContain('color="primary"');
    expect(source).toContain('variant="solid"');
  });

  it("商家ID字段展示运营绩效填写提醒", () => {
    expect(source).toContain("计算运营绩效都要使用商家ID，请务必仔细填写！");
  });
});
