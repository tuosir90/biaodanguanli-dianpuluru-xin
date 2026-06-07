"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
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
    <Button
      block
      size="small"
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      loading={isSubmitting}
      style={{ marginTop: 12 }}
    >
      {isSubmitting ? "退出中..." : "退出登录"}
    </Button>
  );
}
