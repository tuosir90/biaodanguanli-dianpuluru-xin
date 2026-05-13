---
name: four-dataset-auto-sync
description: This skill should be used when user needs to batch upload four Excel datasets (美团/饿了么每日抽点明细、解约明细) from local folders to current project's import APIs, then optionally commit and push related folder updates.
---

# Four Dataset Auto Sync

执行四类 Excel 数据自动同步：
- 美团每日抽点明细
- 饿了么每日抽点明细
- 美团解约明细
- 饿了么解约明细

## 适用场景

- 需要每日把四份 Excel 放入固定目录后，一次性自动上传到系统
- 需要上传完成后自动执行 Git 提交并推送远程

## 数据目录约定（仓库根目录）

- `美团每日抽点数据/`
- `饿了么每日抽点数据/`
- `美团解约数据/`
- `饿了么解约数据/`

脚本会在每个目录中自动选择“最近修改”的 Excel 文件（`.xlsx/.xls/.xlsm`）进行上传。

### 上传前覆盖复制规则（已内置）

每次执行脚本时，会先按“目录中最近修改时间”动态选源文件，再覆盖复制：

- 从 `F:\claude-code\饿了么美团回款数据统计系统\excel-input\2\` 自动选择最新 Excel
  → 复制到 `饿了么每日抽点数据/`
- 从 `F:\claude-code\饿了么美团回款数据统计系统\excel-input\3\` 自动选择最新 Excel
  → 复制到 `美团每日抽点数据/`
- 从 `F:\tuosir90-claude-code\美团饿了么解约数据统计\饿了么解约数据统计\` 中选择文件名包含 `解约数据汇总` 的最新 Excel
  → 复制到 `饿了么解约数据/`
- 从 `F:\tuosir90-claude-code\美团饿了么解约数据统计\data\` 中选择文件名包含 `解约数据统计` 的最新 Excel
  → 复制到 `美团解约数据/`

执行复制前，会先清理对应目标目录中的旧 Excel 文件，再复制新文件，确保目录内只保留本次来源文件。复制完成后再进入四类数据上传流程。

> 这样可以避免因日期后缀变更导致“源文件不存在”而需要重复运行。

## 执行方式

在仓库根目录运行：

`node skills/four-dataset-auto-sync/scripts/sync-four-datasets.mjs`

## 常用参数

- `--mode=upsert|replace`：上传模式，默认 `upsert`
- `--base-url=http://localhost:3000`：API 地址，默认 `http://localhost:3000`
- `--auto-start-dev`：当 API 不可达时自动启动 `web` 下的 `npm run dev`（默认开启）
- `--no-auto-start-dev`：API 不可达时不自动拉起服务
- `--no-git`：上传后不执行 git add/commit/push
- `--dry-run`：仅打印将要上传的文件，不实际上传

示例：

- `node skills/four-dataset-auto-sync/scripts/sync-four-datasets.mjs --mode=upsert`
- `node skills/four-dataset-auto-sync/scripts/sync-four-datasets.mjs --mode=replace --no-git`

## 稳定性说明（Windows）

- 脚本会按 `--base-url` 自动解析端口，并以该端口启动 `web` 开发服务。
- Windows 环境下自动启动使用兼容方式，避免 `spawn EINVAL` 导致的首次启动失败。

## 自动上传映射

- 美团每日抽点数据 → `POST /api/daily-point-import` + `platform=meituan`
- 饿了么每日抽点数据 → `POST /api/daily-point-import` + `platform=eleme`
- 美团解约数据 → `POST /api/termination-import` + `platform=meituan`
- 饿了么解约数据 → `POST /api/termination-import` + `platform=eleme`

请求参数统一使用：
- `platform`
- `mode`
- `file`

## Git 提交与推送策略

默认会在上传成功后仅提交以下目录变更并推送：
- `美团每日抽点数据/`
- `饿了么每日抽点数据/`
- `美团解约数据/`
- `饿了么解约数据/`

若上述目录无变更，则跳过提交与推送。

## 云数据库配置

当前项目的正确云数据库为：

```
mongodb://root:6scldk9f@dbconn.sealosbja.site:39056/?directConnection=true
```

- 数据库名：`test`
- 端口：**39056**（唯一正确端口，其他端口均为其他项目的数据库）

## 执行前检查（强制）

**上传数据前必须依次完成以下检查，任一不通过则禁止执行上传：**

1. 在仓库根目录执行命令
2. **检查 `web/.env.local` 中的 `MONGODB_URI` 是否为 `39056` 端口**，如果不是则必须修正后再继续
3. **检查系统环境变量（用户级 + 机器级）中是否存在 `MONGODB_URI`**，如果存在则警告用户：系统环境变量会覆盖 `.env.local`，可能导致数据写入错误的数据库，必须确认或删除后再继续
4. 确保四个目录中已有当天 Excel 文件
