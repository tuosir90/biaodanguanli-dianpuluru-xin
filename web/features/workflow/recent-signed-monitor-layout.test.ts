import { describe, expect, it } from "vitest";
import { groupRecentSignedMonitorRows } from "./recent-signed-monitor-layout";

describe("groupRecentSignedMonitorRows", () => {
  it("按每行两个运营分组", () => {
    const rows = groupRecentSignedMonitorRows([
      { operatorName: "张三", recentSignedShopCount: 3 },
      { operatorName: "李四", recentSignedShopCount: 2 },
      { operatorName: "王五", recentSignedShopCount: 1 },
    ]);

    expect(rows).toEqual([
      [
        { operatorName: "张三", recentSignedShopCount: 3 },
        { operatorName: "李四", recentSignedShopCount: 2 },
      ],
      [{ operatorName: "王五", recentSignedShopCount: 1 }],
    ]);
  });

  it("也支持未完成监控项按每行两个运营分组", () => {
    const rows = groupRecentSignedMonitorRows([
      { operatorName: "张三", pendingShopCount: 5 },
      { operatorName: "李四", pendingShopCount: 4 },
      { operatorName: "王五", pendingShopCount: 2 },
    ]);

    expect(rows).toEqual([
      [
        { operatorName: "张三", pendingShopCount: 5 },
        { operatorName: "李四", pendingShopCount: 4 },
      ],
      [{ operatorName: "王五", pendingShopCount: 2 }],
    ]);
  });
});
