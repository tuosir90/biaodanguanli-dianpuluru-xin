import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as xlsx from "xlsx";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  read: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ connectMongo: mocks.connect }));
vi.mock("@/models/shop", () => ({
  Shop: {
    find: () => {
      const query = {
        select: () => query,
        sort: () => query,
        lean: mocks.read,
      };
      return query;
    },
  },
}));

import { GET } from "@/app/api/shops/export/route";

describe("shop Excel export", () => {
  beforeEach(() => {
    mocks.connect.mockResolvedValue(undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("exports every shop with Shanghai dates and a compact XLSX payload", async () => {
    const shops = Array.from({ length: 6208 }, (_, index) => ({
      _id: `shop-${index}`,
      entryDate: new Date("2026-06-30T16:00:00.000Z"),
      shopName: `测试店铺${index}（完整保留导出内容）`.repeat(3),
      merchantId: String(100000 + index),
      wechatGroupName: `测试店铺${index}运营服务群`.repeat(3),
      city: "宜昌",
      salesName: "测试销售",
      salesCity: "宜昌",
      contractSignedDate: new Date("2026-07-01T16:00:00.000Z"),
      operationMode: "代运营",
      operatorName: "测试运营",
      deliveryPlatform: "美团",
      shopStatus: "正常",
      terminationDate: null,
      terminationCooperationDays: null,
      createdAt: new Date("2026-07-01T01:00:00.000Z"),
      updatedAt: new Date("2026-07-01T02:00:00.000Z"),
    }));
    mocks.read.mockResolvedValue(shops);

    const response = await GET();
    const buffer = Buffer.from(await response.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets["店铺数据"]
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(".xlsx");
    expect(rows).toHaveLength(shops.length);
    expect(Object.keys(rows[0])).toHaveLength(17);
    expect(rows[0]).toMatchObject({
      店铺ID: "shop-0",
      店铺名: shops[0].shopName,
      录入日期: "2026-07-01",
      合同签订日期: "2026-07-02",
      解约日期: "",
    });
    expect(rows.at(-1)?.店铺ID).toBe("shop-6207");
    expect(buffer.length).toBeLessThan(4_500_000);
  }, 15_000);

  it("records the failed export stage without logging database credentials", async () => {
    mocks.connect.mockRejectedValue(new Error("mongodb://user:private@db/test"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalled();
    const logs = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logs).toContain("connect");
    expect(logs).not.toContain("private");
    expect(logs).not.toContain("mongodb://");
  });
});
