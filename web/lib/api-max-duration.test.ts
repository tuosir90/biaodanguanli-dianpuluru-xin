import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function collectRouteFiles(dirPath: string, output: string[] = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectRouteFiles(fullPath, output);
      return;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      output.push(fullPath);
    }
  });

  return output;
}

describe("API route maxDuration", () => {
  it("所有依赖 Mongo 的 API 路由都不应继续使用 10 秒超时", () => {
    const apiRoot = path.resolve(__dirname, "../app/api");
    const routeFiles = collectRouteFiles(apiRoot);

    const invalidFiles = routeFiles.filter((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return source.includes("connectMongo(") && source.includes("export const maxDuration = 10");
    });

    expect(invalidFiles).toEqual([]);
  });
});
