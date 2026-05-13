"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SalesInvalidShopsDetailsTable } from "@/components/sales-invalid-shops-details-table";
import {
  defaultMonth,
  defaultResponse,
  resolveView,
  resolveViewDescription,
} from "@/components/sales-invalid-shops-report-helpers";
import { SalesInvalidShopsSummaryGrid } from "@/components/sales-invalid-shops-summary-grid";
import { SalesInvalidShopsViewTabs } from "@/components/sales-invalid-shops-view-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  SalesInvalidShopsResponse,
  SalesInvalidShopsView,
} from "@/features/sales-invalid-shops/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export function SalesInvalidShopsReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialMonth = useMemo(() => defaultMonth(), []);
  const activeView = resolveView(searchParams.get("view"));
  const [month, setMonth] = useState(initialMonth);
  const [salesName, setSalesName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<SalesInvalidShopsResponse>(defaultResponse(initialMonth));
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      month,
      view: activeView,
      page: String(page),
      pageSize: "20",
    });

    if (salesName) params.set("salesName", salesName);
    if (debouncedKeyword.trim()) params.set("keyword", debouncedKeyword.trim());

    fetch(`/api/daily-point/sales-invalid-shops?${params.toString()}`)
      .then(async (response) => {
        const result = (await response.json()) as SalesInvalidShopsResponse & {
          message?: string;
        };
        if (!response.ok) {
          throw new Error(result.message || "销售异常店铺统计数据加载失败");
        }
        return result;
      })
      .then((result) => {
        if (!active) return;
        setError("");
        setData(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "销售异常店铺统计数据加载失败"
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeView, debouncedKeyword, month, page, salesName]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 20))),
    [data.pageSize, data.total]
  );

  function changeView(nextView: SalesInvalidShopsView) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    setLoading(true);
    setPage(1);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-100 tracking-tight">销售异常店铺统计</h2>
            <p className="mt-1 text-sm text-text-200 opacity-80">
              {resolveViewDescription(
                data.view,
                data.windowDays,
                data.terminationWithinDays
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[180px_260px_auto]">
          <Input
            type="month"
            value={month}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setMonth(event.target.value);
            }}
            className="w-full"
          />
          <Input
            value={keyword}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setKeyword(event.target.value);
            }}
            placeholder="搜索店铺名或商家ID"
            className="w-full"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLoading(true);
                setPage(1);
                setSalesName("");
                setKeyword("");
              }}
            >
              清空筛选
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">最终汇总</div>
            <div className="mt-1 text-lg font-semibold text-text-100">{data.counts.final} 家</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">原始无效</div>
            <div className="mt-1 text-lg font-semibold text-text-100">{data.counts.invalid} 家</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="text-xs text-text-200">{data.terminationWithinDays}天内解约</div>
            <div className="mt-1 text-lg font-semibold text-text-100">
              {data.counts.terminatedWithinDays} 家
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-text-200">
          统计月份：{data.month} ｜ 统计口径：按合同签订日期归属月份 ｜ 当前筛选销售：
          {salesName || "全部"} ｜ 当前视图条数：{data.total}
        </div>
        {loading ? <div className="mt-4 text-sm text-text-200">加载中...</div> : null}
        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        ) : null}
      </div>

      <SalesInvalidShopsViewTabs
        activeView={activeView}
        counts={data.counts}
        onChangeView={changeView}
      />

      <SalesInvalidShopsSummaryGrid
        summary={data.summary}
        activeView={activeView}
        selectedSalesName={salesName}
        onToggleSalesName={(nextSalesName) => {
          setLoading(true);
          setPage(1);
          setSalesName(nextSalesName === salesName ? "" : nextSalesName);
        }}
      />

      <SalesInvalidShopsDetailsTable
        activeView={activeView}
        windowDays={data.windowDays}
        terminationWithinDays={data.terminationWithinDays}
        details={data.data}
        total={data.total}
        page={data.page}
        totalPages={totalPages}
        loading={loading}
        onPrevPage={() => {
          setLoading(true);
          setPage((current) => Math.max(1, current - 1));
        }}
        onNextPage={() => {
          setLoading(true);
          setPage((current) => Math.min(totalPages, current + 1));
        }}
      />
    </section>
  );
}
