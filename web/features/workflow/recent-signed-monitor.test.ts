import { describe, expect, it } from "vitest";
import { buildWorkflowRecentSignedMonitor } from "./recent-signed-monitor";

describe("buildWorkflowRecentSignedMonitor", () => {
  it("按运营统计签约10天内且仍有效的店铺", () => {
    const result = buildWorkflowRecentSignedMonitor({
      currentDateKey: "2026-03-30",
      windowDays: 10,
      shops: [
        {
          operatorName: "张三",
          shopStatus: "正常",
          wechatGroupName: "张三-一店群",
          contractSignedDate: "2026-03-30T08:00:00+08:00",
        },
        {
          operatorName: "张三",
          shopStatus: "新店",
          wechatGroupName: "张三-二店群",
          contractSignedDate: "2026-03-16T08:00:00+08:00",
        },
        {
          operatorName: "张三",
          shopStatus: "正常",
          wechatGroupName: "张三-超窗店群",
          contractSignedDate: "2026-03-15T08:00:00+08:00",
        },
        {
          operatorName: "李四",
          shopStatus: "已解约",
          wechatGroupName: "李四-解约店群",
          contractSignedDate: "2026-03-20T08:00:00+08:00",
        },
        {
          operatorName: "李四",
          shopStatus: "正常",
          wechatGroupName: "",
          contractSignedDate: "2026-03-29T08:00:00+08:00",
        },
        {
          operatorName: "",
          shopStatus: "正常",
          wechatGroupName: "未分配运营群",
          contractSignedDate: "2026-03-29T08:00:00+08:00",
        },
      ],
    });

    expect(result).toEqual({
      totalRecentSignedShops: 2,
      operatorStats: [
        { operatorName: "未分配", recentSignedShopCount: 1 },
        { operatorName: "张三", recentSignedShopCount: 1 },
      ],
    });
  });
});
