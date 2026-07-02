import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  addMonthsToMonthKey,
  formatShanghaiDateKey,
  parseShanghaiDateInputToDate,
  shanghaiDateKeyToDate,
} from "@/lib/shanghai-date";

describe("shanghai date helpers", () => {
  it("converts date keys to Shanghai midnight boundaries", () => {
    expect(shanghaiDateKeyToDate("2026-07-01")?.toISOString()).toBe(
      "2026-06-30T16:00:00.000Z"
    );
  });

  it("formats stored UTC instants as Shanghai date keys", () => {
    expect(formatShanghaiDateKey("2026-06-30T16:00:00.000Z")).toBe("2026-07-01");
    expect(formatShanghaiDateKey("2026-07-01T00:00:00+08:00")).toBe("2026-07-01");
  });

  it("normalizes date input to the Shanghai day start", () => {
    expect(parseShanghaiDateInputToDate("2026-07-01")?.toISOString()).toBe(
      "2026-06-30T16:00:00.000Z"
    );
    expect(parseShanghaiDateInputToDate("2026-07-01T12:30:00+08:00")?.toISOString()).toBe(
      "2026-06-30T16:00:00.000Z"
    );
  });

  it("adds date and month offsets without depending on server timezone", () => {
    expect(addDaysToDateKey("2026-07-01", 1)).toBe("2026-07-02");
    expect(addMonthsToMonthKey("2026-12", 1)).toBe("2027-01");
  });
});
