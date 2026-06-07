"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, theme as antdTheme } from "antd";
import { AppSidebar } from "@/components/app-sidebar";
import { resolveAppShellView } from "@/lib/app-shell-view";
import { getFrontendAuthStatus } from "@/lib/frontend-auth";

const { Content } = Layout;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = antdTheme.useToken();
  const hideSidebar = pathname.startsWith("/login");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const nextAuthStatus = getFrontendAuthStatus();
    setHasHydrated(true);
    setIsAuthed(nextAuthStatus);

    if (hideSidebar) {
      if (nextAuthStatus) {
        router.replace("/shops");
      }
      return;
    }

    if (!nextAuthStatus) {
      router.replace("/login");
    }
  }, [hideSidebar, pathname, router]);

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
