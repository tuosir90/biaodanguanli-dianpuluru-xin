import { describe, expect, it } from "vitest";
import {
  buildDailyPointDerivedBulkOperations,
  buildMonthRecordDateRegex,
} from "./daily-point-derived-prep";

describe("buildMonthRecordDateRegex", () => {
  it("支持 yyyy-mm 形式匹配不同日期格式", () => {
    const regex = buildMonthRecordDateRegex("2026-03");

    expect(regex.test("2026-03-30")).toBe(true);
    expect(regex.test("2026/3/30")).toBe(true);
    expect(regex.test("2026年3月30日")).toBe(true);
    expect(regex.test("2026-04-01")).toBe(false);
  });
});

describe("buildDailyPointDerivedBulkOperations", () => {
  it("为美团明细补齐 recordDateKey 和 amountValue", () => {
    const operations = buildDailyPointDerivedBulkOperations({
      platform: "meituan",
      docs: [
        {
          _id: "doc-1",
          recordDate: "2026-03-30",
          rowData: {
            日期: "2026-03-30",
            抽点金额: "12.50",
          },
        },
      ],
    });

    expect(operations).toEqual([
      {
        updateOne: {
          filter: { _id: "doc-1" },
          update: {
            $set: {
              recordDateKey: "2026-03-30",
              amountValue: 12.5,
            },
          },
        },
      },
    ]);
  });

  it("为饿了么明细补齐 recordDateKey 和 amountValue", () => {
    const operations = buildDailyPointDerivedBulkOperations({
      platform: "eleme",
      docs: [
        {
          _id: "doc-2",
          recordDate: "2026-03-29",
          rowData: {
            账单日期: "2026-03-29",
            代运营结算金额: "4.78",
          },
        },
      ],
    });

    expect(operations).toEqual([
      {
        updateOne: {
          filter: { _id: "doc-2" },
          update: {
            $set: {
              recordDateKey: "2026-03-29",
              amountValue: 4.78,
            },
          },
        },
      },
    ]);
  });
});
