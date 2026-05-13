import { describe, expect, it } from "vitest";
import { resolveDailyPointImportUniqueKey } from "./daily-point-import-key";

describe("resolveDailyPointImportUniqueKey", () => {
  it("饿了么导入唯一键会忽略入账状态和合同状态变化", () => {
    const baseRow = {
      合同编号: "10000000002437981",
      门店id: "1327890541",
      合同类型: "普通代运营",
      代运营结算金额: "42.69",
      代运营收入: "44.05",
      "技术服务费（抽佣）": "-1.36",
      结算类型: "代运营业务结算",
      入账状态: "待入账",
      代运营服务编号: "D22628771",
      门店名称: "真真厨房（铁板烧烤肉餐厅）(嘉华城店)",
      入账日期: "2026-04-10",
      账单日期: "2026-04-10",
      合同状态: "生效中",
    };

    const changedStatusRow = {
      ...baseRow,
      入账状态: "已入账",
      合同状态: "服务商终止",
    };

    expect(resolveDailyPointImportUniqueKey("eleme", baseRow)).toBe(
      resolveDailyPointImportUniqueKey("eleme", changedStatusRow)
    );
  });

  it("饿了么业务字段变化时会生成不同唯一键", () => {
    const baseRow = {
      合同编号: "10000000002437981",
      门店id: "1327890541",
      代运营结算金额: "42.69",
      门店名称: "真真厨房（铁板烧烤肉餐厅）(嘉华城店)",
      入账日期: "2026-04-10",
      账单日期: "2026-04-10",
      入账状态: "待入账",
      合同状态: "生效中",
    };

    const changedAmountRow = {
      ...baseRow,
      代运营结算金额: "45.00",
    };

    expect(resolveDailyPointImportUniqueKey("eleme", baseRow)).not.toBe(
      resolveDailyPointImportUniqueKey("eleme", changedAmountRow)
    );
  });
});
