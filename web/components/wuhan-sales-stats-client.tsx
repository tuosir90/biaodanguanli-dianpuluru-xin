"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { SalesInvalidShopsPasswordGate } from "@/components/sales-invalid-shops-password-gate";
import { WuhanSalesStatsReport } from "@/components/wuhan-sales-stats-report";
import {
  WUHAN_SALES_AUTH_KEY,
  getWuhanSalesAuthStatus,
  setWuhanSalesAuthStatus,
  validateWuhanSalesPassword,
} from "@/lib/frontend-auth";

function subscribeSalesInvalidShopsAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== WUHAN_SALES_AUTH_KEY) {
      return;
    }
    callback();
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function WuhanSalesStatsClient() {
  const pathname = usePathname();
  const [unlockedInCurrentTab, setUnlockedInCurrentTab] = useState(false);
  const [reportRenderVersion, setReportRenderVersion] = useState(0);
  const storedAuthed = useSyncExternalStore(
    subscribeSalesInvalidShopsAuth,
    getWuhanSalesAuthStatus,
    () => false
  );
  const isAuthed = storedAuthed || unlockedInCurrentTab;

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    if (pathname !== "/daily-point/wuhan-sales-stats") {
      return;
    }

    setReportRenderVersion((previous) => previous + 1);
  }, [isAuthed, pathname]);

  if (!isAuthed) {
    return (
      <SalesInvalidShopsPasswordGate
        onUnlock={() => setUnlockedInCurrentTab(true)}
        title="武汉销售数据统计"
        description="当前分类页已启用独立前端密码保护"
        passwordInputId="wuhan-sales-stats-password"
        validatePassword={validateWuhanSalesPassword}
        persistAuth={setWuhanSalesAuthStatus}
      />
    );
  }

  return <WuhanSalesStatsReport key={reportRenderVersion} />;
}
