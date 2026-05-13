import { describe, expect, it } from "vitest";
import {
  APP_CONTENT_CLASS,
  APP_SIDEBAR_CLASS,
} from "./app-layout-classes";

describe("app layout classes", () => {
  it("侧边栏固定宽度且不参与收缩", () => {
    expect(APP_SIDEBAR_CLASS).toContain("w-64");
    expect(APP_SIDEBAR_CLASS).toContain("shrink-0");
  });

  it("主内容区域允许在 flex 布局中收缩", () => {
    expect(APP_CONTENT_CLASS).toContain("flex-1");
    expect(APP_CONTENT_CLASS).toContain("min-w-0");
  });
});
