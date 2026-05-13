#!/usr/bin/env node

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.ONLINE_SHOP_STATS_BASE_URL || "http://localhost:3000",
    date: "",
    capturedAt: "",
    source: "online-shop-crawler",
    meituanCount: "",
    elemeCount: "",
  };

  for (const raw of argv.slice(2)) {
    if (!raw.startsWith("--")) {
      throw new Error(`无法识别参数: ${raw}`);
    }

    const [key, value = ""] = raw.slice(2).split("=");
    if (!(key in args)) {
      throw new Error(`不支持的参数: --${key}`);
    }
    args[key] = value;
  }

  return args;
}

function normalizeCount(value, label) {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} 必须为大于等于 0 的整数`);
  }
  return parsed;
}

function resolvePayload(args) {
  const capturedAt = args.capturedAt || new Date().toISOString();
  const statDate = args.date || capturedAt.slice(0, 10);
  const stamp = capturedAt.replace(/[:.]/g, "").replace("T", "-").replace("Z", "");
  const records = [];

  const meituanCount = normalizeCount(args.meituanCount, "美团在线店铺数");
  if (meituanCount !== null) {
    records.push({
      platform: "meituan",
      count: meituanCount,
      summaryText: `符合检索条件的数量：${meituanCount}`,
      captureKey: `meituan-${statDate}-${stamp}`,
    });
  }

  const elemeCount = normalizeCount(args.elemeCount, "饿了么在线店铺数");
  if (elemeCount !== null) {
    records.push({
      platform: "eleme",
      count: elemeCount,
      summaryText: `共 ${elemeCount} 条`,
      captureKey: `eleme-${statDate}-${stamp}`,
    });
  }

  if (records.length === 0) {
    throw new Error("至少需要传入一个平台的在线店铺数");
  }

  return {
    statDate,
    capturedAt,
    source: args.source,
    records,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const payload = resolvePayload(args);
  const baseUrl = String(args.baseUrl).replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/api/online-shop-counts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error || result?.message || "上传失败");
  }

  console.log("在线店铺数上传成功");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("在线店铺数上传失败");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
