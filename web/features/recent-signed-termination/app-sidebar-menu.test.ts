import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("recent signed termination sidebar entry", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../../components/app-sidebar.tsx"),
    "utf8"
  );

  it("把新签解约统计放在解约明细入口附近", () => {
    const meituanTerminationIndex = source.indexOf('label: "美团解约明细"');
    const elemeTerminationIndex = source.indexOf('label: "饿了么解约明细"');
    const recentSignedTerminationIndex = source.indexOf('label: "新签解约统计"');

    expect(meituanTerminationIndex).toBeGreaterThan(-1);
    expect(elemeTerminationIndex).toBeGreaterThan(meituanTerminationIndex);
    expect(recentSignedTerminationIndex).toBeGreaterThan(elemeTerminationIndex);
    expect(source).toContain('href: "/termination/recent-signed-stats"');
  });
});
