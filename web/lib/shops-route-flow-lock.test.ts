import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("shops route workflow lock response", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../app/api/shops/route.ts"),
    "utf8"
  );

  it("默认工作进度列表请求累计回款时同步返回菜品图锁定状态", () => {
    expect(source).toContain("fetchWorkflowFlowLockLookup");
    expect(source).toContain("applyWorkflowFlowLockToShops");
    expect(source).toMatch(
      /applyWorkflowFlowLockToShops\(\s*applyDailyPointTotalAmountToShops/
    );
  });
});
