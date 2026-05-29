import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PremiumShopsReport } from "@/components/premium-shops-report";

describe("PremiumShopsReport", () => {
  it("分两列展示美团和饿了么优质店铺列表", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumShopsReport, {
        data: {
          generatedAt: "2026-05-29T03:00:00.000Z",
          meituan: {
            platform: "meituan",
            platformLabel: "美团",
            latestDateKey: "2026-05-29",
            items: [
              {
                rank: 1,
                shopId: "m-1",
                shopName: "美团高回款店",
                merchantId: "m-1",
                wechatGroupName: "美团高回款群",
                totalAmount: 1234.56,
                updatedDateKey: "2026-05-29",
                platform: "meituan",
                platformLabel: "美团",
              },
            ],
          },
          eleme: {
            platform: "eleme",
            platformLabel: "饿了么",
            latestDateKey: "2026-05-28",
            items: [
              {
                rank: 1,
                shopId: "e-1",
                shopName: "饿了么高回款店",
                merchantId: "e-1",
                wechatGroupName: "饿了么高回款群",
                totalAmount: 88,
                updatedDateKey: "2026-05-28",
                platform: "eleme",
                platformLabel: "饿了么",
              },
            ],
          },
        },
      })
    );

    expect(html).toContain("优质店铺列表");
    expect(html).toContain("美团");
    expect(html).toContain("饿了么");
    expect(html).toContain("序号");
    expect(html).toContain("商家ID");
    expect(html).toContain("微信群名称");
    expect(html).toContain("店铺名");
    expect(html).toContain("总回款金额");
    expect(html).toContain("截至日期");
    expect(html).not.toContain("所属平台");
    expect(html).toContain("m-1");
    expect(html).toContain("美团高回款群");
    expect(html).toContain("点击复制商家ID");
    expect(html).toContain("点击复制微信群名称");
    expect(html).toContain("美团高回款店");
    expect(html).toContain("1,234.56 元");
    expect(html).toContain("饿了么高回款店");
    expect(html).toContain("88.00 元");
  });
});
