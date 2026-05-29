import { describe, expect, it } from "vitest";
import { appSidebarMenuItems } from "@/components/app-sidebar";

describe("appSidebarMenuItems", () => {
  it("把优质店铺列表放在在线店铺数统计下方", () => {
    const labels = appSidebarMenuItems.map((item) => item.label);

    expect(labels[labels.indexOf("在线店铺数统计") + 1]).toBe("优质店铺列表");
  });
});
