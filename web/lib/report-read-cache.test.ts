import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  clearReportReadCaches,
  getCachedReportPayload,
  setCachedReportPayload,
} from "@/lib/report-read-cache";

describe("report-read-cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearReportReadCaches();
  });

  afterEach(() => {
    clearReportReadCaches();
    vi.useRealTimers();
  });

  test("命中未过期缓存时返回原始 payload", () => {
    setCachedReportPayload("wuhan-sales", "2026-04", { total: 12 }, 5_000);

    expect(getCachedReportPayload("wuhan-sales", "2026-04")).toEqual({ total: 12 });
  });

  test("超过 ttl 后缓存自动失效", () => {
    setCachedReportPayload("sales-invalid", "2026-04:final", { total: 7 }, 1_000);

    vi.advanceTimersByTime(1_001);

    expect(getCachedReportPayload("sales-invalid", "2026-04:final")).toBeNull();
  });

  test("清理后所有命名空间缓存都失效", () => {
    setCachedReportPayload("wuhan-sales", "2026-04", { total: 5 }, 5_000);
    setCachedReportPayload("sales-invalid", "2026-04:final", { total: 9 }, 5_000);

    clearReportReadCaches();

    expect(getCachedReportPayload("wuhan-sales", "2026-04")).toBeNull();
    expect(getCachedReportPayload("sales-invalid", "2026-04:final")).toBeNull();
  });

  test("不同命名空间的同名 key 互不污染", () => {
    setCachedReportPayload("stats-monthly", "2026-04", { total: 3 }, 5_000);
    setCachedReportPayload("wuhan-sales", "2026-04", { total: 8 }, 5_000);

    expect(getCachedReportPayload("stats-monthly", "2026-04")).toEqual({ total: 3 });
    expect(getCachedReportPayload("wuhan-sales", "2026-04")).toEqual({ total: 8 });
  });
});
