import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkflowShopCard } from "./components/workflow-shop-card";

const baseProps = {
  copiedShopId: null,
  statusMap: {},
  patrolDateMap: {},
  patrolStatusMap: {},
  patrolLoadingMap: {},
  patrolMessageMap: {},
  metrics: {
    completedCount: 0,
    totalProgressCount: 3,
    remainingCount: 3,
  },
  onSetPatrolDate: () => undefined,
  onToggleProgress: () => undefined,
  onCopyShopName: () => undefined,
  onMarkDailyPatrol: () => undefined,
};

describe("WorkflowShopCard", () => {
  it("无效店铺标签后不再显示括号说明", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-1",
          shopName: "测试店铺",
          merchantId: "m1",
          operatorName: "运营A",
          salesName: "销售A",
          wechatGroupName: "测试群",
          contractSignedDate: "2026-03-01T00:00:00+08:00",
          deliveryPlatform: "美团餐饮",
          shopStatus: "无效店铺",
        },
      })
    );

    expect(html).toContain("无效店铺");
    expect(html).not.toContain("最近日期连续五天没有抽到钱");
  });

  it("新店标签后不再显示括号说明", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-2",
          shopName: "测试新店",
          merchantId: "m2",
          operatorName: "运营B",
          salesName: "销售B",
          wechatGroupName: "测试群2",
          contractSignedDate: "2026-03-02T00:00:00+08:00",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "新店",
        },
      })
    );

    expect(html).toContain("新店");
    expect(html).not.toContain("签约日起5天内自动标记新店");
  });

  it("正常店铺不显示低回款锁定提示，也不禁用菜品图标签", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-3",
          shopName: "低回款店铺",
          merchantId: "m3",
          operatorName: "运营C",
          salesName: "销售C",
          wechatGroupName: "测试群3",
          contractSignedDate: "2026-03-03T00:00:00+08:00",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html).not.toContain("已锁定全店图");
    expect(html).not.toContain("菜品图 5 项不计入完整流程");
    expect((html.match(/disabled=""/g) ?? []).length).toBe(0);
  });

  it("外卖活动方案排在全店图标签前面", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-4",
          shopName: "顺序测试店铺",
          merchantId: "m4",
          operatorName: "运营D",
          salesName: "销售D",
          wechatGroupName: "测试群4",
          contractSignedDate: "2026-03-04T00:00:00+08:00",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html.indexOf("外卖活动方案")).toBeLessThan(
      html.indexOf("菜品图（1-10张）")
    );
  });

  it("美团店铺把开启新店特权放在图片三件套后、视频店招前", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-5",
          shopName: "美团顺序店铺",
          merchantId: "m5",
          operatorName: "运营E",
          salesName: "销售E",
          wechatGroupName: "测试群5",
          contractSignedDate: "2026-03-05T00:00:00+08:00",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html.indexOf("图片三件套")).toBeLessThan(
      html.indexOf("开启新店特权")
    );
    expect(html.indexOf("开启新店特权")).toBeLessThan(
      html.indexOf("视频店招")
    );
  });

  it("饿了么店铺把开启新店特权放在图片三件套后、橱窗展示前", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-6",
          shopName: "饿了么顺序店铺",
          merchantId: "m6",
          operatorName: "运营F",
          salesName: "销售F",
          wechatGroupName: "测试群6",
          contractSignedDate: "2026-03-06T00:00:00+08:00",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html.indexOf("图片三件套")).toBeLessThan(
      html.indexOf("开启新店特权")
    );
    expect(html.indexOf("开启新店特权")).toBeLessThan(
      html.indexOf("橱窗展示")
    );
  });

  it("美团店铺会醒目提示今日需同天完成的成对流程", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-7",
          shopName: "美团成对流程店铺",
          merchantId: "m7",
          operatorName: "运营G",
          salesName: "销售G",
          wechatGroupName: "测试群7",
          contractSignedDate: "2026-03-07T00:00:00+08:00",
          deliveryPlatform: "美团餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html).toContain("以下标签需同天完成");
    expect(html).toContain("分类栏优化 + 图片三件套");
    expect(html).toContain("开启新店特权 + 视频店招");
    expect(html).toContain("两个都标记后，店铺才会移出今日任务");
    expect(html).toContain("border-sky-200 bg-sky-50 text-sky-800");
    expect(html).toContain("border-teal-200 bg-teal-50 text-teal-800");
    expect(html).toContain("border-sky-300 bg-sky-50 text-sky-700");
    expect(html).toContain("border-teal-300 bg-teal-50 text-teal-700");
  });

  it("饿了么店铺会醒目提示今日需同天完成的成对流程", () => {
    const html = renderToStaticMarkup(
      createElement(WorkflowShopCard, {
        ...baseProps,
        shop: {
          _id: "shop-8",
          shopName: "饿了么成对流程店铺",
          merchantId: "m8",
          operatorName: "运营H",
          salesName: "销售H",
          wechatGroupName: "测试群8",
          contractSignedDate: "2026-03-08T00:00:00+08:00",
          deliveryPlatform: "饿了么餐饮",
          shopStatus: "正常",
        },
      })
    );

    expect(html).toContain("以下标签需同天完成");
    expect(html).toContain("分类栏优化 + 图片三件套");
    expect(html).toContain("开启新店特权 + 橱窗展示");
    expect(html).not.toContain("开启新店特权 + 视频店招");
    expect(html).toContain("border-sky-200 bg-sky-50 text-sky-800");
    expect(html).toContain("border-teal-200 bg-teal-50 text-teal-800");
  });
});
