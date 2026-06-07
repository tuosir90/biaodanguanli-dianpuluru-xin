import { theme as antdTheme, type ThemeConfig } from "antd";

/**
 * shadcn 风格的 Ant Design 主题令牌。
 * 设计目标：中性近黑主色 + 低存在感边框 + 适中圆角 + 克制阴影。
 * 同时提供浅色与深色两套配置，配合 ConfigProvider 的算法切换。
 */

// 通用（与深浅色无关）的设计令牌
const sharedToken: ThemeConfig["token"] = {
  // 适中圆角，贴近 shadcn 的 0.625rem
  borderRadius: 8,
  borderRadiusLG: 10,
  borderRadiusSM: 6,
  // 字体与 shadcn 接近，使用系统字体栈
  fontFamily:
    'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 14,
  // 控件高度更紧凑、现代
  controlHeight: 36,
  controlHeightLG: 40,
  controlHeightSM: 28,
  // 线宽更细，营造低存在感边框
  lineWidth: 1,
  wireframe: false,
};

// 浅色主题：中性近黑主色
export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: "#18181b", // zinc-900，近黑主色
    colorInfo: "#18181b",
    colorBgBase: "#ffffff",
    colorBgLayout: "#f8f8f7",
    colorBgContainer: "#ffffff",
    colorText: "#1d1c1c",
    colorTextSecondary: "#52525b",
    colorTextTertiary: "#71717a",
    colorBorder: "#e7e7e4", // 低存在感边框
    colorBorderSecondary: "#f0f0ee",
    colorSplit: "rgba(0, 0, 0, 0.06)",
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.06)",
    boxShadowSecondary:
      "0 4px 16px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.05)",
    colorPrimaryBg: "#f4f4f5",
    colorPrimaryBgHover: "#e4e4e7",
  },
  components: {
    Layout: {
      bodyBg: "#f8f8f7",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      headerHeight: 56,
    },
    Menu: {
      itemSelectedBg: "#18181b",
      itemSelectedColor: "#ffffff",
      itemHoverBg: "#f4f4f5",
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginInline: 0,
      activeBarBorderWidth: 0,
      iconMarginInlineEnd: 12,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary:
        "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.06)",
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      fontWeight: 500,
    },
    Table: {
      headerBg: "#fafafa",
      headerColor: "#52525b",
      borderColor: "#f0f0ee",
      rowHoverBg: "#fafafa",
      headerSplitColor: "transparent",
      cellPaddingBlock: 12,
    },
    Input: { activeShadow: "0 0 0 2px rgba(24, 24, 27, 0.08)" },
    Segmented: { itemSelectedBg: "#18181b", itemSelectedColor: "#ffffff" },
    Tabs: { inkBarColor: "#18181b", itemSelectedColor: "#18181b" },
  },
};

// 深色主题：中性近黑/深灰
export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: "#fafafa", // 深色下用近白作为主色，保证对比
    colorInfo: "#fafafa",
    colorBgBase: "#0a0a0a",
    colorBgLayout: "#0a0a0a",
    colorBgContainer: "#141414",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorTextTertiary: "#71717a",
    colorBorder: "#262626", // 低存在感边框
    colorBorderSecondary: "#1f1f1f",
    colorSplit: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    boxShadowSecondary: "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
    colorPrimaryBg: "#262626",
    colorPrimaryBgHover: "#333333",
  },
  components: {
    Layout: {
      bodyBg: "#0a0a0a",
      headerBg: "#141414",
      siderBg: "#141414",
      headerHeight: 56,
    },
    Menu: {
      itemSelectedBg: "#fafafa",
      itemSelectedColor: "#0a0a0a",
      itemHoverBg: "#1f1f1f",
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginInline: 0,
      activeBarBorderWidth: 0,
      iconMarginInlineEnd: 12,
    },
    Card: { borderRadiusLG: 12 },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      fontWeight: 500,
    },
    Table: {
      headerBg: "#1a1a1a",
      headerColor: "#a1a1aa",
      borderColor: "#1f1f1f",
      rowHoverBg: "#1a1a1a",
      headerSplitColor: "transparent",
      cellPaddingBlock: 12,
    },
    Input: { activeShadow: "0 0 0 2px rgba(250, 250, 250, 0.12)" },
    Segmented: { itemSelectedBg: "#fafafa", itemSelectedColor: "#0a0a0a" },
    Tabs: { inkBarColor: "#fafafa", itemSelectedColor: "#fafafa" },
  },
};
