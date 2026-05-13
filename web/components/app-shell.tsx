"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { resolveAppShellView } from "@/lib/app-shell-view";
import { APP_CONTENT_CLASS } from "@/lib/app-layout-classes";
import { getFrontendAuthStatus } from "@/lib/frontend-auth";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
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
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className={APP_CONTENT_CLASS}>
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-slow">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
