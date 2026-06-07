import { theme as antdTheme, type ThemeConfig } from "antd";

/**
 * Ant Design v6 主题令牌。
 * 设计目标：中性运营后台底色 + 青绿色主色 + 蓝色辅助强调 + 克制阴影。
 * 同时提供浅色与深色两套配置，配合 ConfigProvider 的算法切换。
 */

// 通用（与深浅色无关）的设计令牌
const sharedToken: ThemeConfig["token"] = {
  // 适中圆角，适合密集后台界面
  borderRadius: 8,
  borderRadiusLG: 10,
  borderRadiusSM: 6,
  // 使用系统字体栈
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 14,
  // 控件高度更紧凑、现代
  controlHeight: 36,
  controlHeightLG: 40,
  controlHeightSM: 28,
  // 线宽更细，营造低存在感边框
  lineWidth: 1,
  wireframe: false,
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: "#0f766e",
    colorInfo: "#2563eb",
    colorSuccess: "#16a34a",
    colorWarning: "#d97706",
    colorError: "#dc2626",
    colorBgBase: "#ffffff",
    colorBgLayout: "#f6f8f7",
    colorBgContainer: "#ffffff",
    colorText: "#17211f",
    colorTextSecondary: "#596b67",
    colorTextTertiary: "#7a8d88",
    colorBorder: "#dce7e3",
    colorBorderSecondary: "#e8efec",
    colorSplit: "rgba(15, 118, 110, 0.08)",
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.06)",
    boxShadowSecondary:
      "0 10px 28px -16px rgba(15, 118, 110, 0.35), 0 4px 12px -8px rgba(23, 33, 31, 0.18)",
    colorPrimaryBg: "#e6f7f4",
    colorPrimaryBgHover: "#c8ede6",
  },
  components: {
    Layout: {
      bodyBg: "#f6f8f7",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      headerHeight: 56,
    },
    Menu: {
      itemSelectedBg: "#0f766e",
      itemSelectedColor: "#ffffff",
      itemHoverBg: "#e6f7f4",
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginInline: 0,
      activeBarBorderWidth: 0,
      iconMarginInlineEnd: 12,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary:
        "0 8px 24px -18px rgba(23, 33, 31, 0.28), 0 2px 8px -6px rgba(23, 33, 31, 0.18)",
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      fontWeight: 500,
    },
    Table: {
      headerBg: "#f1f6f4",
      headerColor: "#596b67",
      borderColor: "#e8efec",
      rowHoverBg: "#f6fbf9",
      headerSplitColor: "transparent",
      cellPaddingBlock: 12,
    },
    Input: { activeShadow: "0 0 0 2px rgba(15, 118, 110, 0.12)" },
    Select: { activeOutlineColor: "rgba(15, 118, 110, 0.12)" },
    Segmented: { itemSelectedBg: "#0f766e", itemSelectedColor: "#ffffff" },
    Tabs: { inkBarColor: "#0f766e", itemSelectedColor: "#0f766e" },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: "#5eead4",
    colorInfo: "#60a5fa",
    colorSuccess: "#4ade80",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorBgBase: "#0d1413",
    colorBgLayout: "#0d1413",
    colorBgContainer: "#121c1a",
    colorText: "#edf7f4",
    colorTextSecondary: "#a8bbb6",
    colorTextTertiary: "#7f948f",
    colorBorder: "#22312e",
    colorBorderSecondary: "#1a2825",
    colorSplit: "rgba(94, 234, 212, 0.1)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    boxShadowSecondary: "0 12px 32px -18px rgba(0, 0, 0, 0.65)",
    colorPrimaryBg: "#123f3b",
    colorPrimaryBgHover: "#1f6f66",
  },
  components: {
    Layout: {
      bodyBg: "#0d1413",
      headerBg: "#121c1a",
      siderBg: "#121c1a",
      headerHeight: 56,
    },
    Menu: {
      itemSelectedBg: "#5eead4",
      itemSelectedColor: "#06211d",
      itemHoverBg: "#18312d",
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
      headerBg: "#172522",
      headerColor: "#a8bbb6",
      borderColor: "#1a2825",
      rowHoverBg: "#172522",
      headerSplitColor: "transparent",
      cellPaddingBlock: 12,
    },
    Input: { activeShadow: "0 0 0 2px rgba(94, 234, 212, 0.16)" },
    Select: { activeOutlineColor: "rgba(94, 234, 212, 0.16)" },
    Segmented: { itemSelectedBg: "#5eead4", itemSelectedColor: "#06211d" },
    Tabs: { inkBarColor: "#5eead4", itemSelectedColor: "#5eead4" },
  },
};
