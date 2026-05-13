import { describe, expect, it } from "vitest";
import { resolveAppShellView } from "./app-shell-view";

describe("resolveAppShellView", () => {
  it("登录页始终渲染登录视图", () => {
    expect(
      resolveAppShellView({
        hideSidebar: true,
        hasHydrated: false,
        isAuthed: false,
      })
    ).toBe("login");

    expect(
      resolveAppShellView({
        hideSidebar: true,
        hasHydrated: true,
        isAuthed: true,
      })
    ).toBe("login");
  });

  it("受保护页面在首屏 hydration 前保持 loading 视图", () => {
    expect(
      resolveAppShellView({
        hideSidebar: false,
        hasHydrated: false,
        isAuthed: false,
      })
    ).toBe("loading");

    expect(
      resolveAppShellView({
        hideSidebar: false,
        hasHydrated: false,
        isAuthed: true,
      })
    ).toBe("loading");
  });

  it("受保护页面 hydration 后按登录状态决定是否显示内容", () => {
    expect(
      resolveAppShellView({
        hideSidebar: false,
        hasHydrated: true,
        isAuthed: true,
      })
    ).toBe("app");

    expect(
      resolveAppShellView({
        hideSidebar: false,
        hasHydrated: true,
        isAuthed: false,
      })
    ).toBe("loading");
  });
});
