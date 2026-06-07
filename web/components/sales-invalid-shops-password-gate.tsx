"use client";

import { FormEvent, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Alert, Button, Card, Input, Typography } from "antd";
import {
  SALES_INVALID_SHOPS_LOGIN_PASSWORD,
  setSalesInvalidShopsAuthStatus,
} from "@/lib/frontend-auth";

type SalesInvalidShopsPasswordGateProps = {
  onUnlock: () => void;
  title?: string;
  description?: string;
  passwordInputId?: string;
  validatePassword?: (password?: string | null) => boolean;
  persistAuth?: (isAuthed: boolean) => void;
};

export function SalesInvalidShopsPasswordGate({
  onUnlock,
  title = "销售无效店铺统计",
  description = "当前分类页已启用独立前端密码保护",
  passwordInputId = "sales-invalid-shops-password",
  validatePassword = (password) =>
    String(password ?? "").trim() === SALES_INVALID_SHOPS_LOGIN_PASSWORD,
  persistAuth = setSalesInvalidShopsAuthStatus,
}: SalesInvalidShopsPasswordGateProps) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPassword = password.trim();

    if (!validatePassword(normalizedPassword)) {
      setErrorMessage("密码错误，无法进入当前分类页");
      return;
    }

    persistAuth(true);
    setErrorMessage("");
    onUnlock();
  }

  return (
    <section className="mx-auto max-w-xl">
      <Card variant="outlined" styles={{ body: { padding: 32 } }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100/15 text-accent-200">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              {title}
            </Typography.Title>
            <Typography.Text type="secondary">
              {description}
            </Typography.Text>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor={passwordInputId}
              className="block text-sm font-medium text-text-100"
            >
              访问密码
            </label>
            <Input.Password
              id={passwordInputId}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入分类页访问密码"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage ? (
            <Alert
              type="error"
              showIcon
              icon={<ShieldAlert className="h-4 w-4 shrink-0" />}
              title={errorMessage}
            />
          ) : null}

          <Button block type="primary" htmlType="submit">
            进入分类页
          </Button>
        </form>
      </Card>
    </section>
  );
}
