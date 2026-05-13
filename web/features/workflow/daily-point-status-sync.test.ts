import { describe, expect, it } from "vitest";
import { buildConsecutiveDateKeys } from "../../lib/daily-point-status-sync";

describe("daily point status sync date helpers", () => {
  it("buildConsecutiveDateKeys returns latest day and previous days", () => {
    expect(buildConsecutiveDateKeys("2026-02-12", 5)).toEqual([
      "2026-02-12",
      "2026-02-11",
      "2026-02-10",
      "2026-02-09",
      "2026-02-08",
    ]);
  });

  it("buildConsecutiveDateKeys handles cross-month dates", () => {
    expect(buildConsecutiveDateKeys("2026-03-02", 4)).toEqual([
      "2026-03-02",
      "2026-03-01",
      "2026-02-28",
      "2026-02-27",
    ]);
  });

  it("buildConsecutiveDateKeys returns empty for invalid input", () => {
    expect(buildConsecutiveDateKeys("invalid-date", 5)).toEqual([]);
    expect(buildConsecutiveDateKeys("2026-02-12", 0)).toEqual([]);
  });
});
