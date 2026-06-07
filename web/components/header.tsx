"use client";

import { Avatar, Layout, theme as antdTheme } from "antd";
import { ThemeToggle } from "./theme-toggle";

const { Header: AntHeader } = Layout;

export function Header() {
  const { token } = antdTheme.useToken();

  return (
    <AntHeader
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: 24,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Avatar
          shape="square"
          style={{
            backgroundColor: token.colorPrimary,
            color: token.colorBgContainer,
            fontWeight: 700,
          }}
        >
          招
        </Avatar>
        <span className="text-xl font-semibold tracking-tight" style={{ color: token.colorText }}>
          招牌
        </span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </AntHeader>
  );
}
