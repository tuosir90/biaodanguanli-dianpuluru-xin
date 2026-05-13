"use client";

import { FormEvent, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100/15 text-accent-200">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-100 tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-text-200 opacity-80">
              {description}
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={passwordInputId}>访问密码</Label>
            <Input
              id={passwordInputId}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入分类页访问密码"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <Button className="w-full" type="submit">
            进入分类页
          </Button>
        </form>
      </div>
    </section>
  );
}
