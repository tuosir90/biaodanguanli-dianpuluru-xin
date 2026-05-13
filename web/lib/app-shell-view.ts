export type AppShellView = "login" | "loading" | "app";

export function resolveAppShellView(params: {
  hideSidebar: boolean;
  hasHydrated: boolean;
  isAuthed: boolean;
}): AppShellView {
  if (params.hideSidebar) {
    return "login";
  }

  if (!params.hasHydrated) {
    return "loading";
  }

  return params.isAuthed ? "app" : "loading";
}
