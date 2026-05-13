"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Store, ChevronRight } from "lucide-react";
import {
  FRONTEND_LOGIN_PASSWORD,
  getFrontendAuthStatus,
  setFrontendAuthStatus,
} from "@/lib/frontend-auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getFrontendAuthStatus()) {
      router.replace("/shops");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const normalizedPassword = password.trim();
      if (normalizedPassword !== FRONTEND_LOGIN_PASSWORD) {
        setErrorMessage("密码错误");
        return;
      }

      setFrontendAuthStatus(true);
      router.replace("/shops");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Branding */}
      <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-primary-100 via-primary-200 to-accent-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-white blur-3xl mix-blend-overlay animate-pulse" />
          <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent-200 blur-3xl mix-blend-multiply dark:mix-blend-overlay animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="p-4 bg-white/20 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-white/10">
            <Store className="w-12 h-12 text-primary-300 dark:text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary-300 dark:text-white">
              呈尚策划
            </h1>
            <p className="text-xl lg:text-2xl font-medium text-primary-300/80 dark:text-white/80">
              店铺管理系统（内部）
            </p>
          </div>
          
          <div className="h-px w-24 bg-primary-300/20 dark:bg-white/20 my-6" />
          
          <p className="text-primary-300/70 dark:text-white/60 text-sm lg:text-base font-medium tracking-wide uppercase">
            高效管理 · 智慧运营 · 数据驱动
          </p>
        </div>
        
        <div className="absolute bottom-8 text-primary-300/40 dark:text-white/20 text-xs font-medium">
          © {new Date().getFullYear()} 呈尚策划
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              欢迎回来
            </h2>
            <p className="text-muted-foreground">
              请输入您的访问密码以进入呈尚策划内部系统
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                访问密码
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入系统密码"
                  autoComplete="current-password"
                  required
                  className="pl-10 h-11 bg-muted/30 border-input focus-visible:ring-primary transition-all duration-200"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {errorMessage}
              </div>
            )}

            <Button 
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 group" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  立即登录
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          <div className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              如需重置密码或遇到登录问题，请联系系统管理员
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
