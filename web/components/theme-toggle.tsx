"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}>
      <Button
        type="text"
        shape="circle"
        size="small"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
      />
    </Tooltip>
  );
}
