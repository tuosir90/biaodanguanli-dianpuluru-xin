"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileEdit,
  FileSpreadsheet,
  KanbanSquare,
} from "lucide-react";
import { APP_SIDEBAR_CLASS } from "@/lib/app-layout-classes";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  { href: "/shops/new", label: "店铺录入", icon: FileEdit },
  { href: "/shops", label: "店铺数据展示", icon: ClipboardList },
  { href: "/stats", label: "数据统计", icon: BarChart3 },
  { href: "/workflow", label: "运营工作进度", icon: KanbanSquare },
  { href: "/termination/meituan", label: "美团解约明细", icon: FileSpreadsheet },
  { href: "/termination/eleme", label: "饿了么解约明细", icon: FileSpreadsheet },
  { href: "/daily-point/meituan", label: "美团每日抽点明细", icon: FileSpreadsheet },
  { href: "/daily-point/eleme", label: "饿了么每日抽点明细", icon: FileSpreadsheet },
  { href: "/daily-point/sales-invalid-shops", label: "销售无效店铺统计", icon: FileSpreadsheet },
  { href: "/daily-point/wuhan-sales-stats", label: "武汉销售数据统计", icon: FileSpreadsheet },
  { href: "/online-shop-stats", label: "在线店铺数统计", icon: Activity },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className={APP_SIDEBAR_CLASS}>
      <div className="px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-200 to-accent-100 flex items-center justify-center shadow-lg shadow-accent-200/30">
              <span className="text-white font-bold text-sm tracking-tight">呈尚</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-text-100 tracking-tight leading-tight">呈尚策划</h1>
            <p className="text-[11px] text-text-200 font-medium">店铺管理系统</p>
          </div>
        </div>
      </div>
      <nav className="space-y-1.5 flex-1">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-base ease-apple group active-press ${
                isActive
                  ? "bg-accent-200 text-white shadow-md shadow-accent-200/20 translate-x-1"
                  : "text-text-200 hover:bg-bg-200 hover:text-text-100 hover:translate-x-1"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-base ease-apple ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="px-4 py-4 rounded-xl bg-bg-200/50 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent-100/20 flex items-center justify-center text-accent-200 font-bold text-xs">
            CS
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-100">当前用户</span>
            <span className="text-[10px] text-text-200">管理员</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-2 py-1.5">
          <span className="text-[11px] font-medium text-text-200">深浅色模式</span>
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
