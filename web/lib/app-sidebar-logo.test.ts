import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("AppSidebar logo", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../components/app-sidebar.tsx"),
    "utf8"
  );

  it("左上角品牌区使用上传的 logo 图标资源", () => {
    expect(source).toContain('src="/brand-logo-icon.png"');
    expect(source).toContain('alt="呈尚策划 logo"');
    expect(source).not.toContain("<Avatar\n              shape=\"square\"");
  });
});
