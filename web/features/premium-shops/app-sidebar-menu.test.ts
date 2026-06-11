import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("appSidebarMenuItems", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../../components/app-sidebar.tsx"),
    "utf8"
  );

  it("把优质店铺列表放在在线店铺数统计下方", () => {
    const onlineShopIndex = source.indexOf('label: "在线店铺数统计"');
    const premiumShopIndex = source.indexOf('label: "优质店铺列表"');

    expect(onlineShopIndex).toBeGreaterThan(-1);
    expect(premiumShopIndex).toBeGreaterThan(onlineShopIndex);
  });

  it("禁用运营工作进度入口，避免用户从分类栏点击进入", () => {
    expect(source).toContain(
      '{ href: "/workflow", label: "运营工作进度", icon: KanbanSquare, disabled: true }'
    );
    expect(source).toContain("disabled");
  });
});
