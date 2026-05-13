#!/usr/bin/env node

import fsp from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(SKILL_DIR, "..", "..");
const WEB_DIR = path.join(REPO_ROOT, "web");

const DATASETS = [
  {
    name: "美团每日抽点明细",
    folder: "美团每日抽点数据",
    endpoint: "/api/daily-point-import",
    platform: "meituan",
  },
  {
    name: "饿了么每日抽点明细",
    folder: "饿了么每日抽点数据",
    endpoint: "/api/daily-point-import",
    platform: "eleme",
  },
  {
    name: "美团解约明细",
    folder: "美团解约数据",
    endpoint: "/api/termination-import",
    platform: "meituan",
  },
  {
    name: "饿了么解约明细",
    folder: "饿了么解约数据",
    endpoint: "/api/termination-import",
    platform: "eleme",
  },
];

const TARGET_FOLDERS = DATASETS.map((item) => item.folder);
const EXCEL_EXTENSIONS = new Set([".xlsx", ".xls", ".xlsm"]);
const SOURCE_FILE_RULES = [
  {
    sourceDir: "F:\\claude-code\\饿了么美团回款数据统计系统\\excel-input\\2",
    targetFolder: "饿了么每日抽点数据",
  },
  {
    sourceDir: "F:\\claude-code\\饿了么美团回款数据统计系统\\excel-input\\3",
    targetFolder: "美团每日抽点数据",
  },
  {
    sourceDir: "F:\\tuosir90-claude-code\\美团饿了么解约数据统计\\饿了么解约数据统计",
    sourceNameIncludes: "解约数据汇总",
    targetFolder: "饿了么解约数据",
  },
  {
    sourceDir: "F:\\tuosir90-claude-code\\美团饿了么解约数据统计\\data",
    sourceNameIncludes: "解约数据统计",
    targetFolder: "美团解约数据",
  },
];

function parseArgs(argv) {
  const args = {
    mode: "upsert",
    baseUrl: "http://localhost:3000",
    autoStartDev: true,
    git: true,
    dryRun: false,
  };

  for (const raw of argv.slice(2)) {
    if (raw.startsWith("--mode=")) {
      const value = raw.split("=")[1];
      if (value === "upsert" || value === "replace") {
        args.mode = value;
        continue;
      }
      throw new Error(`不支持的 mode: ${value}`);
    }

    if (raw.startsWith("--base-url=")) {
      args.baseUrl = raw.split("=")[1] ?? args.baseUrl;
      continue;
    }

    if (raw === "--auto-start-dev") {
      args.autoStartDev = true;
      continue;
    }

    if (raw === "--no-auto-start-dev") {
      args.autoStartDev = false;
      continue;
    }

    if (raw === "--no-git") {
      args.git = false;
      continue;
    }

    if (raw === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    throw new Error(`无法识别参数: ${raw}`);
  }

  return args;
}

async function ensureFolders() {
  for (const folder of TARGET_FOLDERS) {
    const fullPath = path.join(REPO_ROOT, folder);
    await fsp.mkdir(fullPath, { recursive: true });
  }
}

async function ensureFileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parsePortFromBaseUrl(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.port) {
      const parsedPort = Number(parsed.port);
      if (Number.isInteger(parsedPort) && parsedPort > 0) {
        return parsedPort;
      }
    }
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return 3000;
  }
}

async function clearExcelFilesInFolder(folderPath, dryRun) {
  const entries = await fsp.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.join(folderPath, entry.name);
    const ext = path.extname(filePath).toLowerCase();
    if (!EXCEL_EXTENSIONS.has(ext)) {
      continue;
    }
    if (dryRun) {
      console.log(`[sync] dry-run 将删除旧Excel: ${filePath}`);
      continue;
    }
    await fsp.unlink(filePath);
    console.log(`[sync] 已删除旧Excel: ${filePath}`);
  }
}

async function copySourceFiles(dryRun) {
  const targetFileMap = new Map();

  for (const item of SOURCE_FILE_RULES) {
    let resolvedSourcePath = item.sourcePath ?? null;
    if (!resolvedSourcePath && item.sourceDir) {
      resolvedSourcePath = await findLatestExcel(item.sourceDir, item.sourceNameIncludes);
      if (!resolvedSourcePath) {
        throw new Error(
          `源目录未找到可用Excel: ${item.sourceDir}${
            item.sourceNameIncludes ? ` (名称需包含: ${item.sourceNameIncludes})` : ""
          }`,
        );
      }
    }

    if (!resolvedSourcePath) {
      throw new Error(`未配置源文件或源目录: ${JSON.stringify(item)}`);
    }

    const exists = await ensureFileExists(resolvedSourcePath);
    if (!exists) {
      throw new Error(`源文件不存在: ${resolvedSourcePath}`);
    }

    const targetFolderPath = path.join(REPO_ROOT, item.targetFolder);
    await clearExcelFilesInFolder(targetFolderPath, dryRun);

    const fileName = path.basename(resolvedSourcePath);
    const targetPath = path.join(REPO_ROOT, item.targetFolder, fileName);
    targetFileMap.set(item.targetFolder, targetPath);

    if (dryRun) {
      console.log(`[sync] dry-run 将覆盖复制: ${resolvedSourcePath} -> ${targetPath}`);
      continue;
    }

    await fsp.copyFile(resolvedSourcePath, targetPath);
    console.log(`[sync] 已覆盖复制: ${resolvedSourcePath} -> ${targetPath}`);
  }

  return targetFileMap;
}

async function listFilesRecursively(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFilesRecursively(fullPath);
      files.push(...nested);
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function findLatestExcel(folderPath, nameIncludes) {
  const allFiles = await listFilesRecursively(folderPath);
  const excelFiles = [];

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!EXCEL_EXTENSIONS.has(ext)) continue;
    const fileName = path.basename(filePath);
    if (fileName.startsWith("~$")) continue;
    if (nameIncludes && !fileName.includes(nameIncludes)) continue;
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) continue;
    excelFiles.push({ filePath, mtimeMs: stat.mtimeMs });
  }

  excelFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return excelFiles[0]?.filePath ?? null;
}

async function isServerReady(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/`, { method: "GET" });
    return response.ok || response.status >= 400;
  } catch {
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startDevServer(baseUrl) {
  const isWin = process.platform === "win32";
  const command = isWin ? "npm.cmd" : "npm";
  const port = parsePortFromBaseUrl(baseUrl);
  const args = ["run", "dev", "--", "--port", String(port)];

  const child = spawn(command, args, {
    cwd: WEB_DIR,
    detached: true,
    stdio: "ignore",
    shell: isWin,
    windowsHide: isWin,
  });

  child.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[sync] 自动启动开发服务失败: ${message}`);
  });

  child.unref();
}

async function ensureServer(args) {
  const readyNow = await isServerReady(args.baseUrl);
  if (readyNow) {
    return;
  }

  if (!args.autoStartDev) {
    throw new Error(`服务不可达: ${args.baseUrl}，并且已关闭自动启动`);
  }

  console.log("[sync] 未检测到服务，尝试自动启动 web 开发服务...");
  startDevServer(args.baseUrl);

  for (let attempt = 1; attempt <= 40; attempt += 1) {
    await wait(1500);
    const ready = await isServerReady(args.baseUrl);
    if (ready) {
      console.log("[sync] 开发服务已就绪");
      return;
    }
  }

  throw new Error("自动启动开发服务超时，请手动启动后重试");
}

async function uploadOne({ baseUrl, mode, dataset, filePath }) {
  const buffer = await fsp.readFile(filePath);
  const blob = new Blob([buffer]);
  const form = new FormData();
  form.set("platform", dataset.platform);
  form.set("mode", mode);
  form.set("file", blob, path.basename(filePath));

  const targetUrl = `${baseUrl}${dataset.endpoint}`;
  const response = await fetch(targetUrl, {
    method: "POST",
    body: form,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `${dataset.name} 上传失败`;
    throw new Error(`${message} (${response.status})`);
  }

  return payload;
}

function runGit() {
  const hasGit = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (hasGit.status !== 0) {
    throw new Error("当前目录不是 git 仓库，无法执行推送");
  }

  const add = spawnSync("git", ["add", "--", ...TARGET_FOLDERS], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (add.status !== 0) {
    throw new Error(add.stderr || "git add 执行失败");
  }

  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", ...TARGET_FOLDERS], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (staged.status !== 0) {
    throw new Error(staged.stderr || "git diff --cached 执行失败");
  }

  const changedFiles = staged.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    console.log("[sync] 四个数据目录无变更，跳过 git commit/push");
    return;
  }

  const now = new Date();
  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const commitMsg = `chore: sync four excel datasets ${dateText}`;

  const commit = spawnSync("git", ["commit", "-m", commitMsg], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

  if (commit.status !== 0) {
    const combined = `${commit.stdout || ""}\n${commit.stderr || ""}`;
    if (combined.includes("nothing to commit")) {
      console.log("[sync] 无可提交变更，跳过 push");
      return;
    }
    throw new Error(combined || "git commit 执行失败");
  }

  const push = spawnSync("git", ["push"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (push.status !== 0) {
    throw new Error(push.stderr || "git push 执行失败");
  }

  console.log("[sync] 已完成 git commit 与 push");
}

async function main() {
  const args = parseArgs(process.argv);

  console.log(`[sync] 仓库目录: ${REPO_ROOT}`);
  console.log(`[sync] 上传模式: ${args.mode}`);
  console.log(`[sync] 目标服务: ${args.baseUrl}`);

  await ensureFolders();
  const copiedTargetMap = await copySourceFiles(args.dryRun);

  const plans = [];
  for (const dataset of DATASETS) {
    const folderPath = path.join(REPO_ROOT, dataset.folder);
    const copiedTargetPath = copiedTargetMap.get(dataset.folder) ?? null;
    const latestFile = args.dryRun && copiedTargetPath
      ? copiedTargetPath
      : await findLatestExcel(folderPath);
    if (!latestFile) {
      throw new Error(`${dataset.folder} 未找到 Excel 文件`);
    }
    plans.push({ dataset, filePath: latestFile });
  }

  console.log("[sync] 本次将上传文件：");
  plans.forEach((item) => {
    console.log(`  - ${item.dataset.name}: ${path.relative(REPO_ROOT, item.filePath)}`);
  });

  if (args.dryRun) {
    console.log("[sync] dry-run 模式，已结束");
    return;
  }

  await ensureServer(args);

  for (const item of plans) {
    console.log(`[sync] 上传中: ${item.dataset.name}`);
    const result = await uploadOne({
      baseUrl: args.baseUrl,
      mode: args.mode,
      dataset: item.dataset,
      filePath: item.filePath,
    });
    console.log(`[sync] 上传成功: ${item.dataset.name}`);
    if (result && typeof result === "object") {
      const printed = {
        success: result.success,
        total: result.total,
        inserted: result.inserted,
        updated: result.updated,
      };
      console.log(`       结果: ${JSON.stringify(printed)}`);
    }
  }

  if (args.git) {
    runGit();
  } else {
    console.log("[sync] 已跳过 git 提交与推送（--no-git）");
  }

  console.log("[sync] 全部完成");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[sync] 失败: ${message}`);
  process.exit(1);
});
