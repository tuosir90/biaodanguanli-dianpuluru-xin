"use client";

import { useState, useSyncExternalStore } from "react";
import { SalesInvalidShopsPasswordGate } from "@/components/sales-invalid-shops-password-gate";
import { SalesInvalidShopsReport } from "@/components/sales-invalid-shops-report";
import {
  SALES_INVALID_SHOPS_AUTH_KEY,
  getSalesInvalidShopsAuthStatus,
} from "@/lib/frontend-auth";

function subscribeSalesInvalidShopsAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== SALES_INVALID_SHOPS_AUTH_KEY) {
      return;
    }
    callback();
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

export function SalesInvalidShopsClient() {
  const [unlockedInCurrentTab, setUnlockedInCurrentTab] = useState(false);
  const storedAuthed = useSyncExternalStore(
    subscribeSalesInvalidShopsAuth,
    getSalesInvalidShopsAuthStatus,
    () => false
  );
  const isAuthed = storedAuthed || unlockedInCurrentTab;

  if (!isAuthed) {
    return (
      <SalesInvalidShopsPasswordGate onUnlock={() => setUnlockedInCurrentTab(true)} />
    );
  }

  return <SalesInvalidShopsReport />;
}
