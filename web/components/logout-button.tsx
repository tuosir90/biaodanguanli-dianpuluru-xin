"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  setFrontendAuthStatus,
  setSalesInvalidShopsAuthStatus,
} from "@/lib/frontend-auth";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      setFrontendAuthStatus(false);
      setSalesInvalidShopsAuthStatus(false);
    } finally {
      router.replace("/login");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-200 hover:bg-bg-200 hover:text-text-100 transition-all duration-base disabled:opacity-50 disabled:pointer-events-none"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isSubmitting ? "退出中..." : "退出登录"}
    </button>
  );
}
