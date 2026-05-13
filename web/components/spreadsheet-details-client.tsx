"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SpreadsheetDetailsTable } from "@/components/spreadsheet-details-table";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type PlatformType = "meituan" | "eleme";

type SpreadsheetResponse = {
  columns: string[];
  total: number;
  page: number;
  pageSize: number;
  data: Record<string, string>[];
  message?: string;
};

type SpreadsheetDetailsClientProps = {
  platform: PlatformType;
  title: string;
  subtitle: string;
  listApiPath: string;
  loadErrorMessage: string;
  searchPlaceholder?: string;
  disableNextPage?: boolean;
};

const PAGE_SIZE = 50;
const KEYWORD_DEBOUNCE_MS = 400;

function buildListUrl(
  path: string,
  platform: PlatformType,
  page: number,
  pageSize: number,
  keyword: string
) {
  const params = new URLSearchParams({
    platform,
    page: String(page),
    pageSize: String(pageSize),
  });

  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }

  return `${path}?${params.toString()}`;
}

export function SpreadsheetDetailsClient({
  platform,
  title,
  subtitle,
  listApiPath,
  loadErrorMessage,
  searchPlaceholder = "输入关键词筛选明细",
  disableNextPage = false,
}: SpreadsheetDetailsClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const debouncedKeyword = useDebouncedValue(keyword, KEYWORD_DEBOUNCE_MS);

  useEffect(() => {
    let active = true;
    const requestUrl = buildListUrl(
      listApiPath,
      platform,
      page,
      PAGE_SIZE,
      debouncedKeyword
    );

    fetch(requestUrl)
      .then(async (response) => {
        const result = (await response.json()) as SpreadsheetResponse;
        if (!response.ok) {
          throw new Error(result.message || loadErrorMessage);
        }
        return result;
      })
      .then((result) => {
        if (!active) return;
        setError("");
        setColumns(result.columns ?? []);
        setRows(result.data ?? []);
        setTotal(Number(result.total ?? 0));
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : loadErrorMessage);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedKeyword, listApiPath, loadErrorMessage, page, platform, refreshToken]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-bold text-text-100 tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-text-200 opacity-80">{subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-lg px-4 py-2"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setRefreshToken((value) => value + 1);
            }}
          >
            刷新数据
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={keyword}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setKeyword(event.target.value);
            }}
            placeholder={searchPlaceholder}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-100 px-3 py-2 text-sm text-text-100 outline-none focus:border-accent-200"
          />
          <div className="text-xs text-text-200">
            数据总数 {total} 条，当前页 {rows.length} 条
            {debouncedKeyword.trim() ? "（全局搜索结果）" : ""}
          </div>
        </div>
        {loading ? <div className="mt-4 text-sm text-text-200">加载中...</div> : null}
        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        ) : null}
      </div>
      <SpreadsheetDetailsTable
        platform={platform}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        disableNextPage={disableNextPage}
        columns={columns}
        rows={rows}
        onPreviousPage={() => {
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
