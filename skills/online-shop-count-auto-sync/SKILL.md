---
name: online-shop-count-auto-sync
description: Use when user needs to 自动采集美团和饿了么在线店铺数，追加写入本地Excel，并把结果上传到当前项目云数据库后在在线店铺数页面展示。
---

# 在线店铺数自动同步 Skill

执行美团与饿了么在线店铺数的一次完整采集闭环：

1. 打开美团后台合同管理页
2. 筛选 `签约状态 = 已签约`
3. 读取 `符合检索条件的数量：N`
4. 打开饿了么后台商家合同页
5. 筛选 `合同状态 = 生效中`
6. 读取 `共 N 条`
7. 追加写入本地 Excel
8. 上传到当前项目的云数据库

## 适用场景

- 需要每日自动抓取美团和饿了么在线店铺数
- 需要把采集结果保存在本地 Excel
- 需要把采集结果同步到当前项目的 `在线店铺数统计` 页面

## 目录结构

```text
skills/online-shop-count-auto-sync/
├── SKILL.md
├── data/
│   ├── 在线店铺数统计.xlsx
│   └── browser_states/
├── logs/
├── references/
│   └── routes-and-selectors.md
└── scripts/
    ├── config.py
    ├── browser_clients.py
    ├── excel_store.py
    ├── dev_server.py
    ├── run_online_shop_sync.py
    └── requirements.txt
```

## 执行方式

在当前目录执行：

```bash
python skills/online-shop-count-auto-sync/scripts/run_online_shop_sync.py
```

## 常用参数

- `--base-url=http://localhost:3000`
  - 上传目标 API 地址
- `--headed`
  - 以有界面浏览器运行，便于排查登录问题
- `--dry-run`
  - 只采集并打印结果，不写 Excel、不上传数据库
- `--no-auto-start-dev`
  - 当本地 API 不可达时，不自动启动 `web` 下的开发服务

示例：

```bash
python skills/online-shop-count-auto-sync/scripts/run_online_shop_sync.py --headed
python skills/online-shop-count-auto-sync/scripts/run_online_shop_sync.py --dry-run
python skills/online-shop-count-auto-sync/scripts/run_online_shop_sync.py --base-url=http://localhost:3000
```

## 数据落点

- 本地 Excel：
  - `skills/online-shop-count-auto-sync/data/在线店铺数统计.xlsx`
- 云数据库：
  - 调用当前项目 `web` 下的 `/api/online-shop-counts`
- 页面展示：
  - 当前项目侧边栏 `在线店铺数统计`

## 运行前检查

执行脚本前先确认：

1. `web/.env.local` 中 `MONGODB_URI` 使用 `39056` 端口
   - 且数据库名必须是 `test`
   - 若系统环境变量中存在 `MONGODB_URI`，也必须指向同一个库，否则脚本会中止执行
2. 本机已安装 Python、playwright、openpyxl、requests
3. 现有美团/饿了么登录态文件可用

## 登录态策略

脚本优先使用 skill 自己保存的登录态：

- `skills/online-shop-count-auto-sync/data/browser_states/meituan_state.json`
- `skills/online-shop-count-auto-sync/data/browser_states/eleme_state.json`

若本地 skill 登录态不存在，则回退到现有项目中的登录态：

- 美团：
  - `F:\tuosir90-claude-code\美团饿了么解约数据统计\storage_state.json`
  - `F:\tuosir90-claude-code\美团饿了么解约数据统计\cookies.json`
- 饿了么：
  - `F:\tuosir90-claude-code\美团饿了么解约数据统计\饿了么解约数据统计\eleme_storage_state.json`

采集成功后会把当前有效登录态回写到 skill 自己的 `data/browser_states/` 目录，后续优先复用。

## 技术口径

- 美团在线店铺数：
  - 页面：`#/client/list`
  - 筛选：`签约状态 = 已签约`
  - 取值：`符合检索条件的数量：N`
- 饿了么在线店铺数：
  - 页面：`/manager/agent/contract-list`
  - 筛选：`合同状态 = 生效中`
  - 取值：`共 N 条`

## Excel 规则

每次执行都**追加**一行，不覆盖历史：

- 日期
- 美团在线店铺数
- 饿了么在线店铺数
- 采集时间

## 失败处理

- 某个平台未拿到数量时，整次执行失败，不写 Excel、不上传数据库
- 本地 API 不可达时，默认自动尝试启动 `web` 下的 `npm run dev`
- 若登录态失效，脚本会直接报错并提示刷新登录态

## 参考资料

具体路由与选择器说明见：

- `skills/online-shop-count-auto-sync/references/routes-and-selectors.md`
