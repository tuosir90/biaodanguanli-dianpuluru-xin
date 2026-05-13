"use client";

import { useState, useSyncExternalStore } from "react";
import { SalesInvalidShopsPasswordGate } from "@/components/sales-invalid-shops-password-gate";
import { WuhanSalesShopDetailsReport } from "@/components/wuhan-sales-shop-details-report";
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

type WuhanSalesShopDetailsClientProps = {
  initialMonth: string;
};

export function WuhanSalesShopDetailsClient({
  initialMonth,
}: WuhanSalesShopDetailsClientProps) {
  const [unlockedInCurrentTab, setUnlockedInCurrentTab] = useState(false);
  const storedAuthed = useSyncExternalStore(
    subscribeSalesInvalidShopsAuth,
    getWuhanSalesAuthStatus,
    () => false
  );
  const isAuthed = storedAuthed || unlockedInCurrentTab;

  if (!isAuthed) {
    return (
      <SalesInvalidShopsPasswordGate
        onUnlock={() => setUnlockedInCurrentTab(true)}
        title="武汉销售店铺明细"
        description="当前分类页已启用独立前端密码保护"
        passwordInputId="wuhan-sales-shop-details-password"
        validatePassword={validateWuhanSalesPassword}
        persistAuth={setWuhanSalesAuthStatus}
      />
    );
  }

  return <WuhanSalesShopDetailsReport initialMonth={initialMonth} />;
}
