# WorkflowPage 拆分重构执行报告

## 1. 目标结果

- `web/app/workflow/page.tsx` 已从 1240 行收敛到 4 行，仅负责挂载业务组件。
- 新增 `web/features/workflow` 领域模块，按 `constants/types/utils/api/hooks/components` 分层。
- 新增 Vitest 单测基建，并对关键查询构造与纯函数行为补充测试。

## 2. 主要变更

### 2.1 入口与页面容器

- 修改：`web/app/workflow/page.tsx`
  - 仅保留：
    - `import { WorkflowPageClient } ...`
    - `return <WorkflowPageClient />`

### 2.2 领域模块（新增）

- 常量与类型：
  - `web/features/workflow/constants.ts`
  - `web/features/workflow/types.ts`
- 工具与 API：
  - `web/features/workflow/utils.ts`
  - `web/features/workflow/api.ts`
- hooks：
  - `web/features/workflow/hooks/use-workflow-filters.ts`
  - `web/features/workflow/hooks/use-workflow-overview-data.ts`
  - `web/features/workflow/hooks/use-workflow-detail-data.ts`
- 组件：
  - `web/features/workflow/components/workflow-page-client.tsx`
  - `web/features/workflow/components/workflow-overview-section.tsx`
  - `web/features/workflow/components/workflow-monitor-panels.tsx`
  - `web/features/workflow/components/workflow-detail-controls.tsx`
  - `web/features/workflow/components/workflow-shop-list.tsx`
  - `web/features/workflow/components/workflow-shop-card.tsx`

### 2.3 测试基建与测试用例

- 修改：`web/package.json`（新增 `test:unit`、`test:unit:watch`）
- 修改：`web/package-lock.json`（新增 vitest 依赖树）
- 新增：`web/vitest.config.ts`
- 新增测试：
  - `web/features/workflow/utils.test.ts`
  - `web/features/workflow/api.test.ts`

## 3. 文件规模检查

- `web/features/workflow` 下新增/改造文件均未超过 200 行。
- `web/app/workflow/page.tsx` 当前 4 行。

## 4. 验证结果（本地）

1. 单测：
   - 命令：`npm run test:unit`
   - 结果：2 个测试文件，8 个用例全部通过。

2. Lint：
   - 命令：`npm run lint`
   - 结果：0 error；保留 1 条既有 warning（`shops-table-client.tsx` 的 TanStack React Compiler 兼容提示）。

3. 构建：
   - 命令：`npm run build`
   - 结果：Next.js 构建成功，`/workflow` 与 API 路由均正常输出。

## 5. 已知项

- `web/components/shops-table-client.tsx` 仍有 React Compiler 兼容 warning（非本次引入，已存在）。
- `web/dev.log` 等运行日志文件仍在工作区变化（与功能代码无关）。
