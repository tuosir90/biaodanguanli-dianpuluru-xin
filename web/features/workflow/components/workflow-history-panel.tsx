"use client";

import { Button } from "antd";
import type { PatrolHistoryItem } from "../types";

type WorkflowHistoryPanelProps = {
  historyMode: "patrol" | "completion";
  historyRange: "today" | "7d";
  historyOperator: string;
  historyPage: number;
  historyTotalPages: number;
  historyLoading: boolean;
  historyError: string;
  historyItems: PatrolHistoryItem[];
  historyTotal: number;
  onRangeChange: (range: "today" | "7d") => void;
  onClearOperator: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function WorkflowHistoryPanel({
  historyMode,
  historyRange,
  historyOperator,
  historyPage,
  historyTotalPages,
  historyLoading,
  historyError,
  historyItems,
  historyTotal,
  onRangeChange,
  onClearOperator,
  onPrevPage,
  onNextPage,
}: WorkflowHistoryPanelProps) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-text-100">
          {historyMode === "completion" ? "流程完成历史已标记商家ID" : "巡店历史已标记商家ID"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            htmlType="button"
            type={historyRange === "today" ? "primary" : "default"}
            className={`h-auto rounded-full border px-3 py-1 text-xs ${historyRange === "today" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-text-200 hover:bg-bg-200"}`}
            onClick={() => onRangeChange("today")}
          >
            今天
          </Button>
          <Button
            htmlType="button"
            type={historyRange === "7d" ? "primary" : "default"}
            className={`h-auto rounded-full border px-3 py-1 text-xs ${historyRange === "7d" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-text-200 hover:bg-bg-200"}`}
            onClick={() => onRangeChange("7d")}
          >
            近7天
          </Button>
          {historyOperator ? (
            <Button
              htmlType="button"
              className="h-auto rounded-full border border-border bg-card px-3 py-1 text-xs text-text-200 hover:bg-bg-200"
              onClick={onClearOperator}
            >
              当前运营：{historyOperator}（清除）
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 text-xs text-text-200">
        共 {historyTotal} 条，当前第 {historyPage}/{historyTotalPages} 页
      </div>

      {historyLoading ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-100/50 px-4 py-6 text-sm text-text-200">加载中...</div>
      ) : historyError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          {historyError}
        </div>
      ) : historyItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-100/50 px-4 py-6 text-sm text-text-200">暂无历史已标记记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-200">
                <th className="px-2 py-2 font-medium">商家ID</th>
                <th className="px-2 py-2 font-medium">店铺名</th>
                <th className="px-2 py-2 font-medium">运营</th>
                <th className="px-2 py-2 font-medium">
                  {historyMode === "completion" ? "流程项" : "巡店日期"}
                </th>
                <th className="px-2 py-2 font-medium">标记时间</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={`${item.shopId}-${item.markedAt}`} className="border-b border-border/60 text-text-100">
                  <td className="px-2 py-2 font-mono">{item.merchantId || "-"}</td>
                  <td className="px-2 py-2">{item.shopName || "-"}</td>
                  <td className="px-2 py-2">{item.operatorName || "未分配"}</td>
                  <td className="px-2 py-2 font-mono">
                    {historyMode === "completion" ? item.progressLabel || "-" : item.patrolDate || "-"}
                  </td>
                  <td className="px-2 py-2 font-mono">{item.markedAt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          htmlType="button"
          className="h-auto rounded-lg bg-bg-100 px-3 py-1.5 text-xs text-text-200"
          disabled={historyLoading || historyPage <= 1}
          onClick={onPrevPage}
        >
          上一页
        </Button>
        <Button
          htmlType="button"
          className="h-auto rounded-lg bg-bg-100 px-3 py-1.5 text-xs text-text-200"
          disabled={historyLoading || historyPage >= historyTotalPages}
          onClick={onNextPage}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
