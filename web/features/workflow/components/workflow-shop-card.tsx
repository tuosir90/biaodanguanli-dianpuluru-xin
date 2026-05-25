"use client";

import { memo, useCallback, useRef, useState } from "react";
import { CheckCircle2, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DAILY_PATROL_LABEL,
  progressItems,
} from "../constants";
import {
  getPendingWorkflowFlowCoCompletionGroups,
  getWorkflowFlowCoCompletionToneClasses,
  type WorkflowFlowCoCompletionTone,
} from "../flow-co-completion";
import { getWorkflowFlowProgressKeys } from "@/lib/workflow-flow-metrics";
import type { PatrolStatusItem, ShopFlowMetrics, ShopItem } from "../types";
import {
  patrolWarningClass,
  platformClass,
  statusBadgeClass,
  statusKey,
  todayDateValue,
} from "../utils";

type WorkflowShopCardProps = {
  shop: ShopItem;
  copiedShopId: string | null;
  statusMap: Record<string, boolean>;
  patrolDateMap: Record<string, string>;
  patrolStatusMap: Record<string, PatrolStatusItem>;
  patrolLoadingMap: Record<string, boolean>;
  patrolMessageMap: Record<string, string>;
  metrics: ShopFlowMetrics;
  onSetPatrolDate: (shopId: string, dateValue: string) => void;
  onToggleProgress: (
    shopId: string,
    operatorName: string,
    progressKey: string,
    progressLabel: string
  ) => void;
  onCopyShopName: (shopId: string, shopName: string) => void;
  onMarkDailyPatrol: (shop: ShopItem) => void;
};

function WorkflowShopCardBase({
  shop,
  copiedShopId,
  statusMap,
  patrolDateMap,
  patrolStatusMap,
  patrolLoadingMap,
  patrolMessageMap,
  metrics,
  onSetPatrolDate,
  onToggleProgress,
  onCopyShopName,
  onMarkDailyPatrol,
}: WorkflowShopCardProps) {
  const [copiedValueKey, setCopiedValueKey] = useState<string | null>(null);
  const copiedValueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyValueText = useCallback(async (valueKey: string, valueText: string) => {
    if (!valueText || valueText === "-") return;
    try {
      await navigator.clipboard.writeText(valueText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = valueText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedValueKey(valueKey);
    if (copiedValueTimerRef.current) {
      clearTimeout(copiedValueTimerRef.current);
    }
    copiedValueTimerRef.current = setTimeout(() => setCopiedValueKey(null), 1200);
  }, []);

  const formatLocalDate = (dateValue?: string) => {
    if (!dateValue) return "-";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "-";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const shopStatus = shop.shopStatus || "正常";
  const visibleFlowProgressKeys = new Set<string>(
    getWorkflowFlowProgressKeys(shop.deliveryPlatform)
  );
  const incompleteFlowKeys = Array.from(visibleFlowProgressKeys).filter(
    (progressKey) => !Boolean(statusMap[statusKey(shop._id, progressKey)])
  );
  const pendingCoCompletionGroups = getPendingWorkflowFlowCoCompletionGroups({
    deliveryPlatform: shop.deliveryPlatform,
    incompleteFlowKeys,
  });
  const pendingCoCompletionToneByKey = new Map<string, WorkflowFlowCoCompletionTone>();
  pendingCoCompletionGroups.forEach((group) => {
    group.keys.forEach((progressKey) => {
      pendingCoCompletionToneByKey.set(progressKey, group.tone);
    });
  });
  const isNormalShop = shopStatus === "正常" || shopStatus === "新店";
  const isTerminatedShop = shopStatus === "已解约";
  const selectedPatrolDate = patrolDateMap[shop._id] || todayDateValue();
  const terminationDateText = formatLocalDate(shop.terminationDate);
  const fallbackOperationDays = (() => {
    if (!shop.contractSignedDate || !shop.terminationDate) return null;
    const contractSignedDate = new Date(shop.contractSignedDate);
    const terminationDate = new Date(shop.terminationDate);
    if (Number.isNaN(contractSignedDate.getTime()) || Number.isNaN(terminationDate.getTime())) {
      return null;
    }
    contractSignedDate.setHours(0, 0, 0, 0);
    terminationDate.setHours(0, 0, 0, 0);
    const diffMs = terminationDate.getTime() - contractSignedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0) + 1;
  })();
  const operationDays = typeof shop.terminationCooperationDays === "number"
    ? shop.terminationCooperationDays
    : fallbackOperationDays;
  const operationDaysText = typeof operationDays === "number" ? `${operationDays} 天` : "-";

  const renderCopyableValue = (label: string, valueText: string, valueKey: string, valueClassName?: string) => (
    <span className="flex items-center gap-1">
      <span className="opacity-70 font-medium">{label}:</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => copyValueText(valueKey, valueText)}
        disabled={!valueText || valueText === "-"}
        className={`h-auto p-0 hover:bg-transparent ${valueClassName ?? "font-mono"} ${
          copiedValueKey === valueKey
            ? "text-green-600 dark:text-green-400"
            : "text-text-100 hover:text-accent-200"
        }`}
        title={valueText && valueText !== "-" ? `点击复制${label}` : `${label}为空`}
      >
        <span className="flex items-center gap-1">
          {valueText || "-"}
          {copiedValueKey === valueKey ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
          )}
        </span>
      </Button>
    </span>
  );

  return (
    <article className="group rounded-xl border border-border bg-card p-5 shadow-sm hover-lift">
      <div className="mb-4 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onCopyShopName(shop._id, shop.shopName)}
            className={`h-auto p-0 text-lg font-bold transition-all hover:bg-transparent ${
              copiedShopId === shop._id
                ? "scale-105 text-green-600 dark:text-green-400"
                : "text-text-100 hover:text-accent-200"
            }`}
            title="点击复制店铺名"
          >
            <span className="flex items-center gap-2">
              {shop.shopName}
              {copiedShopId === shop._id ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
              )}
            </span>
          </Button>
          {copiedShopId === shop._id ? (
            <span className="animate-fade-in text-xs text-green-600 dark:text-green-400">已复制</span>
          ) : null}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(shopStatus)}`}>
            {shopStatus}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-200">
          {renderCopyableValue("商家ID", shop.merchantId || "-", `${shop._id}:merchantId`, "font-mono")}
          <span className="hidden h-3 w-px bg-border md:block"></span>
          {renderCopyableValue("运营负责人", shop.operatorName || "-", `${shop._id}:operatorName`, "font-medium")}
          <span className="hidden h-3 w-px bg-border md:block"></span>
          {renderCopyableValue("销售负责人", shop.salesName || "-", `${shop._id}:salesName`, "font-medium")}
          <span className="hidden h-3 w-px bg-border md:block"></span>
          {renderCopyableValue("微信群", shop.wechatGroupName || "-", `${shop._id}:wechatGroupName`, "font-medium")}
          <span className="hidden h-3 w-px bg-border md:block"></span>
          {renderCopyableValue("签约", formatLocalDate(shop.contractSignedDate), `${shop._id}:contractSignedDate`, "font-mono")}
          <span className="hidden h-3 w-px bg-border md:block"></span>
          {renderCopyableValue("平台", shop.deliveryPlatform || "-", `${shop._id}:deliveryPlatform`, `font-medium ${platformClass(shop.deliveryPlatform || "")}`)}
          {isNormalShop ? (
            <>
              <span className="hidden h-3 w-px bg-border md:block"></span>
              <span className={`flex items-center gap-1 font-medium ${patrolWarningClass(patrolStatusMap[shop._id]?.daysUnpatrolled)}`}>
                <span className="opacity-70">巡店进度:</span>
                <span>{Number.isFinite(patrolStatusMap[shop._id]?.daysUnpatrolled) ? `${patrolStatusMap[shop._id]?.daysUnpatrolled} 天未巡店` : "0 天未巡店"}</span>
              </span>
              <span className="hidden h-3 w-px bg-border md:block"></span>
              <span className="flex items-center gap-1 text-text-200">
                <span className="opacity-70">最后更新日期:</span>
                <span className="font-mono">{patrolStatusMap[shop._id]?.latestUpdatedDate || "-"}</span>
              </span>
            </>
          ) : null}
          {isTerminatedShop ? (
            <>
              <span className="hidden h-3 w-px bg-border md:block"></span>
              {renderCopyableValue("解约日期", terminationDateText, `${shop._id}:terminationDate`, "font-mono")}
              <span className="hidden h-3 w-px bg-border md:block"></span>
              {renderCopyableValue("运营天数", operationDaysText, `${shop._id}:operationDays`, "font-mono")}
            </>
          ) : null}
        </div>
      </div>

      {pendingCoCompletionGroups.length > 0 ? (
        <div className="mb-3 space-y-2">
          {pendingCoCompletionGroups.map((group) => {
            const toneClasses = getWorkflowFlowCoCompletionToneClasses(group.tone);
            return (
              <div
                key={group.label}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${toneClasses.notice}`}
              >
                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">以下标签需同天完成</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${toneClasses.chip}`}
                  >
                    {group.label}
                  </span>
                  <span>两个都标记后，店铺才会移出今日任务</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-bg-100 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-200">
            流程完成 <span className="font-semibold text-text-100">{metrics.completedCount}/{metrics.totalProgressCount}</span>
          </span>
          {shop.todayActionLabel ? (
            <span className={`rounded-full px-2 py-0.5 font-medium ${
              shop.todayActionType === "flow"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}>
              {shop.todayActionLabel}
            </span>
          ) : null}
        </div>
        <span className={`font-semibold ${metrics.remainingCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
          还差 {metrics.remainingCount} 项
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {progressItems.map((item) => {
          if (item.key !== "daily_patrol" && !visibleFlowProgressKeys.has(item.key)) {
            return null;
          }
          if (item.key === "daily_patrol") {
            const patrolInfo = patrolStatusMap[shop._id];
            return (
              <div key={item.key} className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-100 px-3 py-2">
                <span className="text-xs font-medium text-text-200">{DAILY_PATROL_LABEL}</span>
                <Input
                  type="date"
                  value={selectedPatrolDate}
                  disabled={!isNormalShop}
                  onChange={(event) => onSetPatrolDate(shop._id, event.target.value)}
                  className="h-7 w-[140px] rounded border-border bg-card px-2 py-1 text-xs text-text-100"
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!isNormalShop || patrolLoadingMap[shop._id]}
                  onClick={() => onMarkDailyPatrol(shop)}
                  className="h-auto rounded-md bg-accent-200 px-2 py-1 text-xs font-medium text-white hover:bg-accent-200"
                >
                  {patrolLoadingMap[shop._id] ? "标记中..." : "标记"}
                </Button>
                <span className="max-w-[320px] truncate text-xs text-text-200">
                  {patrolMessageMap[shop._id] || (patrolInfo?.latestPatrolDate
                    ? `${patrolInfo.latestPatrolDate} 已计入巡店进度（不影响流程还差项）`
                    : isNormalShop ? "今日未计入巡店进度" : "非正常店铺无需巡店")}
                </span>
              </div>
            );
          }

          const done = Boolean(statusMap[statusKey(shop._id, item.key)]);
          const isPendingCoCompletionKey =
            !done && pendingCoCompletionToneByKey.has(item.key);
          const pendingCoCompletionTone = pendingCoCompletionToneByKey.get(item.key);
          return (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              onClick={() => onToggleProgress(shop._id, shop.operatorName || "", item.key, item.label)}
              className={`h-auto shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-base ease-apple active-press ${
                done
                  ? "bg-accent-200 text-white shadow-sm shadow-accent-200/20 hover:bg-accent-200 hover:text-white"
                  : isPendingCoCompletionKey
                  ? getWorkflowFlowCoCompletionToneClasses(
                      pendingCoCompletionTone ?? "sky"
                    ).button
                  : "bg-bg-200 text-text-200 hover:bg-bg-300 hover:text-text-100"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-3 w-3 animate-in zoom-in duration-base ease-apple" />
              ) : isPendingCoCompletionKey ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-text-200/30" />
              )}
              {item.label}
            </Button>
          );
        })}
      </div>
    </article>
  );
}

export const WorkflowShopCard = memo(WorkflowShopCardBase);
WorkflowShopCard.displayName = "WorkflowShopCard";
