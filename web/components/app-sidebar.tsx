"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileEdit,
  FileSpreadsheet,
  KanbanSquare,
  Trophy,
} from "lucide-react";
import { Avatar, Layout, Menu, theme as antdTheme } from "antd";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

const { Sider } = Layout;

export const appSidebarMenuItems = [
  { href: "/shops/new", label: "店铺录入", icon: FileEdit },
  { href: "/shops", label: "店铺数据展示", icon: ClipboardList },
  { href: "/stats", label: "数据统计", icon: BarChart3 },
  { href: "/workflow", label: "运营工作进度", icon: KanbanSquare, disabled: true },
  { href: "/termination/meituan", label: "美团解约明细", icon: FileSpreadsheet },
  { href: "/termination/eleme", label: "饿了么解约明细", icon: FileSpreadsheet },
  { href: "/daily-point/meituan", label: "美团每日抽点明细", icon: FileSpreadsheet },
  { href: "/daily-point/eleme", label: "饿了么每日抽点明细", icon: FileSpreadsheet },
  { href: "/daily-point/sales-invalid-shops", label: "销售无效店铺统计", icon: FileSpreadsheet },
  { href: "/daily-point/wuhan-sales-stats", label: "武汉销售数据统计", icon: FileSpreadsheet },
  { href: "/online-shop-stats", label: "在线店铺数统计", icon: Activity },
  { href: "/premium-shops", label: "优质店铺列表", icon: Trophy },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = antdTheme.useToken();

  const menuItems = appSidebarMenuItems.map(({ href, label, icon: Icon, disabled }) => ({
    key: href,
    icon: <Icon className="h-4 w-4" />,
    label,
    disabled,
  }));

  return (
    <Sider
      width={256}
      theme="light"
      breakpoint="lg"
      collapsedWidth={0}
      style={{
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div className="flex h-full flex-col gap-4 px-3 py-5">
        {/* 品牌区 */}
        <div className="flex items-center gap-3 px-2">
          <Image
            src="/brand-logo-icon.png"
            alt="呈尚策划 logo"
            width={58}
            height={44}
            className="h-11 w-[58px] shrink-0 object-contain"
            priority
          />
          <div className="flex flex-col">
            <span
              className="text-base font-bold leading-tight"
              style={{ color: token.colorText }}
            >
              呈尚策划
            </span>
            <span className="text-[11px]" style={{ color: token.colorTextTertiary }}>
              店铺管理系统
            </span>
          </div>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ flex: 1, border: "none", background: "transparent" }}
        />

        {/* 底部用户区 */}
        <div
          className="rounded-xl px-3 py-3"
          style={{
            background: token.colorFillQuaternary,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar size={32} style={{ backgroundColor: token.colorFillSecondary, color: token.colorText }}>
              CS
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold" style={{ color: token.colorText }}>
                当前用户
              </span>
              <span className="text-[10px]" style={{ color: token.colorTextTertiary }}>
                管理员
              </span>
            </div>
          </div>
          <div
            className="mt-3 flex items-center justify-between rounded-lg px-2 py-1.5"
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorBgContainer,
            }}
          >
            <span className="text-[11px] font-medium" style={{ color: token.colorTextSecondary }}>
              深浅色模式
            </span>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </div>
    </Sider>
  );
}
