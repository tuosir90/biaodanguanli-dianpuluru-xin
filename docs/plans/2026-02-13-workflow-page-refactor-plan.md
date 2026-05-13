# WorkflowPage 拆分重构 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `web/app/workflow/page.tsx` 从 1240 行拆分为可维护模块（单文件不超过 200 行），保持现有功能与交互行为不变。

**Architecture:** 采用“页面容器 + 领域模块”拆分：页面只负责组装与路由上下文，业务常量/类型/工具函数沉淀到 `features/workflow`，数据请求与副作用沉淀到 hooks，复杂 UI 拆成无副作用展示组件。通过单元测试锁定工具函数与筛选逻辑，避免拆分后行为漂移。

**Tech Stack:** Next.js App Router、React 19、TypeScript、TanStack Table、shadcn/ui、Vitest（新增）

---

## 执行前约束

- 不改接口契约：`/api/workflow/*`、`/api/shops*`、`/api/dropdowns` 参数与返回结构保持不变。
- 不改业务文案与默认筛选逻辑（除 lint 报错的引号转义）。
- 每次任务完成后运行最小验证命令，保证可回滚。
- 每次任务单独提交，避免“超大提交难审查”。

---

### Task 1: 建立最小单测基建（Vitest）

**Files:**
- Modify: `web/package.json`
- Create: `web/vitest.config.ts`

**Step 1: 先验证当前无单测命令（预期失败）**

Run: `npm run test:unit`  
Expected: 报错 `Missing script: "test:unit"`（FAIL）

**Step 2: 添加测试脚本与最小配置**

`web/package.json` 追加：

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

`web/vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["features/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
```

**Step 3: 安装依赖**

Run: `npm i -D vitest @vitest/coverage-v8`

**Step 4: 验证命令可运行**

Run: `npm run test:unit`  
Expected: 无测试文件提示或 0 个测试（PASS，命令可执行）

**Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/vitest.config.ts
git commit -m "test: add vitest unit test baseline"
```

---

### Task 2: 用失败测试锁定 workflow 核心工具行为

**Files:**
- Create: `web/features/workflow/utils.test.ts`
- Create: `web/features/workflow/types.ts`
- Create: `web/features/workflow/constants.ts`
- Create: `web/features/workflow/utils.ts`

**Step 1: 先写失败测试（模块尚不存在）**

`web/features/workflow/utils.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import {
  statusBadgeClass,
  patrolWarningClass,
  getPagedDaysRange,
  statusKey,
} from "./utils";

describe("workflow utils", () => {
  it("statusBadgeClass returns class by shop status", () => {
    expect(statusBadgeClass("已解约")).toContain("text-red");
    expect(statusBadgeClass("无效店铺")).toContain("text-yellow");
    expect(statusBadgeClass("正常")).toContain("text-green");
  });

  it("patrolWarningClass returns red/yellow/green by days", () => {
    expect(patrolWarningClass(3)).toContain("text-red");
    expect(patrolWarningClass(2)).toContain("text-yellow");
    expect(patrolWarningClass(0)).toContain("text-green");
  });

  it("statusKey combines shopId and progressKey", () => {
    expect(statusKey("a", "b")).toBe("a__b");
  });

  it("getPagedDaysRange returns start/end date string", () => {
    const range = getPagedDaysRange(1, 30);
    expect(range.startDate).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/);
    expect(range.endDate).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm run test:unit -- web/features/workflow/utils.test.ts`  
Expected: `Cannot find module './utils'`（FAIL）

**Step 3: 写最小实现让测试通过**

`web/features/workflow/types.ts`：

```ts
export type ShopStatus = "正常" | "已解约" | "无效店铺";
```

`web/features/workflow/constants.ts`（迁移原页面常量）：

```ts
export const ALL_OPERATORS = "__ALL__";
export const DETAIL_WINDOW_DAYS = 30;
export const DETAIL_FETCH_LIMIT = 1000;
export const MONITOR_FULL_FETCH_LIMIT = 10000;
export const WORKFLOW_BATCH_SIZE = 300;
export const DAILY_PATROL_LABEL = "增加每日巡店（包含商家的要求和新的评价解释和发券）";
```

`web/features/workflow/utils.ts`（迁移原页面纯函数）：

```ts
export function statusKey(shopId: string, progressKey: string) {
  return `${shopId}__${progressKey}`;
}

export function statusBadgeClass(status: string) {
  if (status === "已解约") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (status === "无效店铺") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
}

export function patrolWarningClass(daysUnpatrolled: number | null | undefined) {
  const days = Number.isFinite(daysUnpatrolled) ? Number(daysUnpatrolled) : 0;
  if (days >= 3) return "text-red-600 dark:text-red-400";
  if (days === 2) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPagedDaysRange(page: number, days: number) {
  const safePage = Math.max(page, 1);
  const offsetDays = (safePage - 1) * days;
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));
  return { startDate: formatDateValue(start), endDate: formatDateValue(end) };
}
```

**Step 4: 运行测试验证通过**

Run: `npm run test:unit -- web/features/workflow/utils.test.ts`  
Expected: 全部 PASS

**Step 5: Commit**

```bash
git add web/features/workflow web/package.json web/package-lock.json web/vitest.config.ts
git commit -m "refactor(workflow): extract and test workflow pure utils"
```

---

### Task 3: 抽离 workflow 类型与常量，页面只保留引用

**Files:**
- Modify: `web/app/workflow/page.tsx:16-126`
- Modify: `web/features/workflow/types.ts`
- Modify: `web/features/workflow/constants.ts`

**Step 1: 将页面内 type/const 全部迁移到领域模块**

把以下内容迁移并导出：
- `ShopItem`、`PatrolStatusItem`、`WorkflowSummary`、`CompletionMonitorItem` 等类型
- `progressItems`、`ELEME_HIDDEN_PROGRESS_KEYS`

**Step 2: 页面改为 import，不保留重复定义**

```ts
import {
  ALL_OPERATORS,
  DETAIL_WINDOW_DAYS,
  DETAIL_FETCH_LIMIT,
  MONITOR_FULL_FETCH_LIMIT,
  WORKFLOW_BATCH_SIZE,
  progressItems,
  ELEME_HIDDEN_PROGRESS_KEYS,
} from "@/features/workflow/constants";
```

**Step 3: 验证类型检查**

Run: `npm run lint`  
Expected: 不新增 TS/ESLint 错误

**Step 4: Commit**

```bash
git add web/app/workflow/page.tsx web/features/workflow/types.ts web/features/workflow/constants.ts
git commit -m "refactor(workflow): move page-local types and constants to feature module"
```

---

### Task 4: 抽离 API 调用与参数构造逻辑

**Files:**
- Create: `web/features/workflow/api.ts`
- Create: `web/features/workflow/api.test.ts`
- Modify: `web/app/workflow/page.tsx:267-457,616-711`

**Step 1: 写 API 参数构造失败测试**

`web/features/workflow/api.test.ts` 覆盖：
- shops 查询参数组合（分页/时间窗口/筛选联动）
- patrol status 查询参数

**Step 2: 运行测试确认失败**

Run: `npm run test:unit -- web/features/workflow/api.test.ts`  
Expected: 模块或导出不存在（FAIL）

**Step 3: 实现 API 封装**

`web/features/workflow/api.ts` 提供：
- `buildShopQuery(params)`
- `fetchWorkflowShops(params)`
- `fetchWorkflowStatus(payload)`
- `fetchPatrolStatus(payload)`
- `toggleWorkflowProgress(payload)`
- `updateWorkflowShopStatus(payload)`
- `markWorkflowDailyPatrol(payload)`

**Step 4: 页面替换为 API 调用函数**

将 `fetch("/api/...")` 内联调用替换为 `api.ts` 导出的函数，保留原返回结构。

**Step 5: 运行测试验证通过**

Run: `npm run test:unit -- web/features/workflow/api.test.ts`  
Expected: PASS

**Step 6: Commit**

```bash
git add web/features/workflow/api.ts web/features/workflow/api.test.ts web/app/workflow/page.tsx
git commit -m "refactor(workflow): extract api requests and query builders"
```

---

### Task 5: 抽离数据副作用 hooks（降低 page 复杂度）

**Files:**
- Create: `web/features/workflow/hooks/use-workflow-detail-data.ts`
- Create: `web/features/workflow/hooks/use-workflow-summary-data.ts`
- Create: `web/features/workflow/hooks/use-workflow-filters.ts`
- Modify: `web/app/workflow/page.tsx:214-557`

**Step 1: 先定义 hook 输出契约**

例如：

```ts
type UseWorkflowDetailDataReturn = {
  shops: ShopItem[];
  shopsTotal: number;
  hasNextWindow: boolean;
  loading: boolean;
  statusMap: Record<string, boolean>;
  patrolStatusMap: Record<string, PatrolStatusItem>;
  // ...
};
```

**Step 2: 搬迁 `useEffect` 到 hooks**

- `use-workflow-detail-data.ts`：店铺列表、状态批量查询、巡店状态批量查询
- `use-workflow-summary-data.ts`：summary、completionMonitor、patrolAlerts、dropdowns
- `use-workflow-filters.ts`：筛选状态组合、`filteredShops`、`hasActiveDetailFilters`

**Step 3: 页面使用 hook 返回值替代本地副作用**

`page.tsx` 保留状态最少化，仅负责组合 props 与回调。

**Step 4: 验证**

Run: `npm run lint`  
Expected: `page.tsx` 明显降行，且无新错误

**Step 5: Commit**

```bash
git add web/features/workflow/hooks web/app/workflow/page.tsx
git commit -m "refactor(workflow): move side effects and derived states into hooks"
```

---

### Task 6: 抽离监控面板组件（统计图、完成度、巡店预警）

**Files:**
- Create: `web/features/workflow/components/workflow-overview-panels.tsx`
- Create: `web/features/workflow/components/workflow-completion-monitor.tsx`
- Create: `web/features/workflow/components/workflow-patrol-monitor.tsx`
- Modify: `web/app/workflow/page.tsx:748-945`

**Step 1: 创建无副作用展示组件（props 驱动）**

组件只接收数据和回调：
- `onApplyMonitorFilter`
- `onClearMonitorFilter`
- `onApplyPatrolFilter`
- `onClearPatrolFilter`

**Step 2: 把原 JSX 块剪切到新组件**

每个组件控制在 120~180 行，避免再次膨胀。

**Step 3: 页面组合调用**

`page.tsx` 只传入 `summary`、`completionMonitor`、`patrolAlerts` 和事件回调。

**Step 4: 验证**

Run: `npm run lint`  
Expected: 组件文件通过 lint

**Step 5: Commit**

```bash
git add web/features/workflow/components web/app/workflow/page.tsx
git commit -m "refactor(workflow): split overview and monitor panels into presentational components"
```

---

### Task 7: 抽离明细区组件（筛选栏、分页栏、店铺卡片）

**Files:**
- Create: `web/features/workflow/components/workflow-operator-tabs.tsx`
- Create: `web/features/workflow/components/workflow-detail-filters.tsx`
- Create: `web/features/workflow/components/workflow-detail-pagination.tsx`
- Create: `web/features/workflow/components/workflow-shop-card.tsx`
- Create: `web/features/workflow/components/workflow-shop-list.tsx`
- Modify: `web/app/workflow/page.tsx:947-1240`

**Step 1: 先抽 `workflow-shop-card.tsx`**

迁移单店铺 card 的渲染和交互按钮，保留以下回调透传：
- `onToggleProgress`
- `onUpdateShopStatus`
- `onMarkDailyPatrol`
- `onCopyShopName`

**Step 2: 再抽 `workflow-shop-list.tsx`**

处理 loading/empty/list 三态，内部复用 `workflow-shop-card.tsx`。

**Step 3: 抽离 operator tabs / filters / pagination**

把 “运营切换 + 关键字筛选 + 分页控制” 拆成三个独立组件。

**Step 4: 页面改为拼装**

`page.tsx` 仅保留容器编排，不保留长 JSX。

**Step 5: 验证**

Run: `npm run lint`  
Expected: 通过（仅保留已知兼容性 warning）

**Step 6: Commit**

```bash
git add web/features/workflow/components web/app/workflow/page.tsx
git commit -m "refactor(workflow): split detail area into tabs filters pagination and shop list components"
```

---

### Task 8: 修复现有 lint 错误并控制文件规模

**Files:**
- Modify: `web/app/workflow/page.tsx:820`
- Modify: `web/app/workflow/page.tsx`（收尾格式化）

**Step 1: 修复未转义引号错误**

将：

```tsx
<p className="text-xs text-text-200">按"还差N项"统计</p>
```

改为：

```tsx
<p className="text-xs text-text-200">按“还差N项”统计</p>
```

**Step 2: 验证 page 行数**

Run:  
`(Get-Content web/app/workflow/page.tsx | Measure-Object -Line).Lines`

Expected: `< 200`

**Step 3: Commit**

```bash
git add web/app/workflow/page.tsx
git commit -m "fix(workflow): resolve lint errors and keep container page minimal"
```

---

### Task 9: 全量验证与回归检查

**Files:**
- Modify: `docs/plans/2026-02-13-workflow-page-refactor-report.md`（新增执行记录）

**Step 1: 运行自动化验证**

Run:

```bash
npm run test:unit
npm run lint
npm run build
```

Expected:
- unit tests 全部通过
- lint 无 error（兼容性 warning 可记录）
- build 成功

**Step 2: 手工回归（关键业务路径）**

1. `/workflow` 默认加载：统计面板、监控面板、明细列表均可展示  
2. 运营切换：切换后店铺数/列表联动正确  
3. 点击进度项：灰色 <-> 高亮可切换  
4. 巡店标记：提交后状态更新且文案回显  
5. 监控筛选联动：完成度筛选、巡店预警筛选都能回填到明细区

**Step 3: 记录结果文档**

在 `docs/plans/2026-02-13-workflow-page-refactor-report.md` 写：
- 变更文件清单
- 风险点与已验证项
- 未覆盖项与后续建议

**Step 4: Commit**

```bash
git add docs/plans/2026-02-13-workflow-page-refactor-report.md
git commit -m "docs: add workflow refactor verification report"
```

---

## 目标文件规模（重构后）

- `web/app/workflow/page.tsx`：<= 180 行
- `web/features/workflow/constants.ts`：<= 120 行
- `web/features/workflow/types.ts`：<= 120 行
- `web/features/workflow/utils.ts`：<= 180 行
- `web/features/workflow/api.ts`：<= 180 行
- `web/features/workflow/hooks/*.ts`：每个 <= 180 行
- `web/features/workflow/components/*.tsx`：每个 <= 180 行

---

## 风险与缓解

- 风险：拆分后 props 过深导致可读性下降  
缓解：按“数据/行为/样式”分组 props，必要时引入小型 view-model。

- 风险：筛选联动条件遗漏导致明细结果偏差  
缓解：用 `utils.test.ts` 和 `api.test.ts` 固定核心逻辑，并保留手工回归清单。

- 风险：`react-hooks/incompatible-library` warning 持续存在  
缓解：该 warning 来自 `useReactTable`，保留并在报告中标注“已知可接受警告”。

---

Plan complete and saved to `docs/plans/2026-02-13-workflow-page-refactor-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - 我在当前会话逐任务执行，每一步完成后做检查再继续。  

**2. Parallel Session (separate)** - 你开一个新会话，用 `executing-plans` 按该计划批量推进。
