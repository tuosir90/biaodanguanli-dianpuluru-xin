import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Ant Design 中文语言环境", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../components/theme-provider.tsx"),
    "utf8"
  );

  it("ConfigProvider 和 dayjs 均使用中文语言环境", () => {
    expect(source).toContain('import zhCN from "antd/locale/zh_CN"');
    expect(source).toContain('import "dayjs/locale/zh-cn"');
    expect(source).toContain('dayjs.locale("zh-cn")');
    expect(source).toContain("locale={zhCN}");
  });
});
