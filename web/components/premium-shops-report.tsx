"use client";

import { useCallback, useRef, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Copy, Crown } from "lucide-react";
import { Button, Table } from "antd";
import type {
  PremiumShopListItem,
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
      <Button
        htmlType="button"
        type="text"
        size="small"
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
      </Button>
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

      <Table<PremiumShopListItem>
        rowKey="shopId"
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content", y: 620 }}
        dataSource={report.items}
        columns={[
          {
            title: "序号",
            dataIndex: "rank",
            width: 72,
            fixed: "left",
            render: (value: number) => (
              <span className="font-mono text-xs text-text-200">{value}</span>
            ),
          },
          {
            title: "商家ID",
            dataIndex: "merchantId",
            width: 160,
            render: (value: string, item) =>
              renderCopyableValue("商家ID", value, `${item.shopId}:merchantId`),
          },
          {
            title: "微信群名称",
            dataIndex: "wechatGroupName",
            width: 220,
            render: (value: string, item) =>
              renderCopyableValue("微信群名称", value, `${item.shopId}:wechatGroupName`),
          },
          {
            title: "店铺名",
            dataIndex: "shopName",
            width: 260,
            render: (value: string) => (
              <span className="font-medium text-text-100">{value}</span>
            ),
          },
          {
            title: "总回款金额",
            dataIndex: "totalAmount",
            align: "right",
            render: (value: number) => (
              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                {formatAmount(value)}
              </span>
            ),
          },
          {
            title: "合作总天数",
            dataIndex: "cooperationDays",
            align: "right",
            render: (value: number) => (
              <span className="font-mono text-xs text-text-200">{value}</span>
            ),
          },
          {
            title: "平均日均回款金额",
            dataIndex: "averageDailyAmount",
            align: "right",
            render: (value: number) => (
              <span className="font-mono font-semibold text-text-100">
                {formatAmount(value)}
              </span>
            ),
          },
          {
            title: "截至日期",
            dataIndex: "updatedDateKey",
            render: (value: string) => (
              <span className="font-mono text-xs text-text-200">{value || "—"}</span>
            ),
          },
        ]}
        locale={{ emptyText: "暂无在线未解约店铺" }}
      />
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

      <div className="grid grid-cols-1 gap-4">
        <PremiumShopPlatformTable report={report.meituan} loading={loading} />
        <PremiumShopPlatformTable report={report.eleme} loading={loading} />
      </div>
    </div>
  );
}
