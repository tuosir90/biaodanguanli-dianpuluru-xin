import { describe, expect, it } from "vitest";
import {
  getPagedDaysRange,
  patrolWarningClass,
  statusBadgeClass,
  statusKey,
} from "./utils";

describe("workflow utils", () => {
  it("statusBadgeClass returns class by shop status", () => {
    expect(statusBadgeClass("已解约")).toContain("text-red");
    expect(statusBadgeClass("无效店铺")).toContain("text-yellow");
    expect(statusBadgeClass("新店")).toContain("text-blue");
    expect(statusBadgeClass("正常")).toContain("text-green");
  });

  it("patrolWarningClass returns red yellow green by days", () => {
    expect(patrolWarningClass(3)).toContain("text-red");
    expect(patrolWarningClass(2)).toContain("text-yellow");
    expect(patrolWarningClass(0)).toContain("text-green");
  });

  it("statusKey combines shopId and progressKey", () => {
    expect(statusKey("shop-id", "progress-key")).toBe("shop-id__progress-key");
  });

  it("getPagedDaysRange returns start and end date string", () => {
    const range = getPagedDaysRange(1, 30);
    expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
