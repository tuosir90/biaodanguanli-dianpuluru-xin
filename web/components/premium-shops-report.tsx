"use client";

import { useCallback, useRef, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Copy, Crown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PremiumShopPlatformReport,
  PremiumShopReport,
} from "@/features/premium-shops/types";

type PremiumShopsReportProps = {
  data: PremiumShopReport | null;
  loading?: boolean;
};

function formatAmount(value: number) {
  return `${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 元`;
}

function formatGeneratedAt(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function PremiumShopPlatformTable({
  report,
  loading,
}: {
  report: PremiumShopPlatformReport;
  loading: boolean;
}) {
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

  const renderCopyableValue = (label: string, valueText: string, valueKey: string) => {
    const normalizedValue = valueText || "-";
    const isCopied = copiedValueKey === valueKey;

    return (
      <button
        type="button"
        onClick={() => copyValueText(valueKey, normalizedValue)}
        disabled={normalizedValue === "-"}
        className={`inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-bg-200 disabled:cursor-not-allowed disabled:opacity-60 ${
          isCopied ? "text-green-600 dark:text-green-400" : "text-text-100"
        }`}
        title={normalizedValue === "-" ? `${label}为空` : `点击复制${label}`}
      >
        <span className="truncate">{normalizedValue}</span>
        {isCopied ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </button>
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-bg-100/50 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-text-100">
            <BadgeDollarSign className="h-4 w-4 text-accent-200" />
            {report.platformLabel}
          </h3>
          <p className="mt-1 text-xs text-text-200">
            截至 {report.latestDateKey || "—"}，共 {report.items.length} 家
          </p>
        </div>
      </div>

      <div className="max-h-[680px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-bg-200/95 backdrop-blur">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-14 px-4 py-3">序号</TableHead>
              <TableHead className="min-w-[120px] px-4 py-3">商家ID</TableHead>
              <TableHead className="min-w-[180px] px-4 py-3">微信群名称</TableHead>
              <TableHead className="min-w-[180px] px-4 py-3">店铺名</TableHead>
              <TableHead className="px-4 py-3 text-right">总回款金额</TableHead>
              <TableHead className="px-4 py-3">截至日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-36 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="ml-auto h-4 w-20 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-bg-200" />
                  </TableCell>
                </TableRow>
              ))
            ) : report.items.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="h-28 text-center text-sm text-text-200">
                  暂无在线未解约店铺
                </TableCell>
              </TableRow>
            ) : (
              report.items.map((item) => (
                <TableRow key={item.shopId} className="border-border">
                  <TableCell className="px-4 py-3 font-mono text-xs text-text-200">
                    {item.rank}
                  </TableCell>
                  <TableCell className="max-w-[150px] px-4 py-3 font-mono text-xs">
                    {renderCopyableValue(
                      "商家ID",
                      item.merchantId,
                      `${item.shopId}:merchantId`
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] px-4 py-3 text-xs">
                    {renderCopyableValue(
                      "微信群名称",
                      item.wechatGroupName,
                      `${item.shopId}:wechatGroupName`
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate px-4 py-3 font-medium text-text-100">
                    {item.shopName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                    {formatAmount(item.totalAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs text-text-200">
                    {item.updatedDateKey || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function PremiumShopsReport({
  data,
  loading = false,
}: PremiumShopsReportProps) {
  const emptyReport: PremiumShopReport = {
    generatedAt: "",
    meituan: {
      platform: "meituan",
      platformLabel: "美团",
      latestDateKey: "",
      items: [],
    },
    eleme: {
      platform: "eleme",
      platformLabel: "饿了么",
      latestDateKey: "",
      items: [],
    },
  };
  const report = data ?? emptyReport;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-100">
              <Crown className="h-5 w-5 text-amber-500" />
              优质店铺列表
            </h2>
            <p className="mt-1 text-sm text-text-200">
              按累计总回款金额从高到低展示在线未解约店铺
            </p>
          </div>
          <div className="text-xs text-text-200">
            更新于 {formatGeneratedAt(report.generatedAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PremiumShopPlatformTable report={report.meituan} loading={loading} />
        <PremiumShopPlatformTable report={report.eleme} loading={loading} />
      </div>
    </div>
  );
}
