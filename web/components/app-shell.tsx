"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, theme as antdTheme } from "antd";
import { AppSidebar } from "@/components/app-sidebar";
import { resolveAppShellView } from "@/lib/app-shell-view";
import {
  FRONTEND_AUTH_CHANGE_EVENT,
  FRONTEND_AUTH_KEY,
  getFrontendAuthStatus,
} from "@/lib/frontend-auth";

const { Content } = Layout;

type AppShellProps = {
  children: ReactNode;
};

function subscribeFrontendAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== FRONTEND_AUTH_KEY) {
      return;
    }
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(FRONTEND_AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(FRONTEND_AUTH_CHANGE_EVENT, callback);
  };
}

function subscribeHydration() {
  return () => undefined;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = antdTheme.useToken();
  const hideSidebar = pathname.startsWith("/login");
  const hasHydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const isAuthed = useSyncExternalStore(
    subscribeFrontendAuth,
    getFrontendAuthStatus,
    () => false
  );

  useEffect(() => {
    if (hideSidebar) {
      if (isAuthed) {
        router.replace("/shops");
      }
      return;
    }

    if (!hasHydrated) {
      return;
    }

    if (!isAuthed) {
      router.replace("/login");
    }
  }, [hasHydrated, hideSidebar, isAuthed, pathname, router]);

  const view = resolveAppShellView({
    hideSidebar,
    hasHydrated,
    isAuthed,
  });

  if (view === "login") {
    return <>{children}</>;
  }

  if (view === "loading") {
    return <div style={{ minHeight: "100vh", background: token.colorBgLayout }} />;
  }

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <AppSidebar />
      <Layout style={{ background: token.colorBgLayout }}>
        <Content
          className="custom-scrollbar"
          style={{ padding: 24, overflow: "auto" }}
        >
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-slow">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
