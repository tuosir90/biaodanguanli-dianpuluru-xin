"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Download, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getShopExportAuthStatus,
  setShopExportAuthStatus,
  validateShopExportPassword,
} from "@/lib/frontend-auth";
import {
  formatEmployeeNameWithStoredStatus,
  normalizeEmploymentStatus,
} from "@/features/shops/employee-status";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { buildShopListSearchParams } from "@/features/shops/search-params";

type ShopRow = {
  _id: string;
  entryDate?: string;
  shopName?: string;
  merchantId?: string;
  wechatGroupName?: string;
  city?: string;
  salesName?: string;
  salesEmploymentStatus?: string;
  salesCity?: string;
  contractSignedDate?: string;
  operationMode?: string;
  operatorName?: string;
  operatorEmploymentStatus?: string;
  deliveryPlatform?: string;
};

type FilterOptions = {
  operatorNames: string[];
  operatorStatusMap?: Record<string, string>;
  platforms: string[];
  salesNames: string[];
  salesStatusMap?: Record<string, string>;
  salesCities: string[];
};

const WINDOW_PAGE_SIZE = 15;
const FILTER_PAGE_SIZE = 15;
const KEYWORD_DEBOUNCE_MS = 400;

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
  formatOptionLabel,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  formatOptionLabel?: (item: string) => string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px] hover-lift hover:border-accent-200/50">
      <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">{label}</label>
      <Select
        value={value.length > 0 ? value[0] : "all"}
        onValueChange={(val) => onChange(val === "all" ? [] : [val])}
      >
        <SelectTrigger className="w-full border-border bg-card text-text-100">
          <SelectValue placeholder="全部" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {options.map((item) => (
            <SelectItem key={item} value={item}>
              {formatOptionLabel ? formatOptionLabel(item) : item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function employeeStatusClass(status: string) {
  return status === "离职"
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
}

const columnHelper = createColumnHelper<ShopRow>();

export function ShopsTableClient() {
  const [rows, setRows] = useState<ShopRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<FilterOptions>({
    operatorNames: [],
    operatorStatusMap: {},
    platforms: [],
    salesNames: [],
    salesStatusMap: {},
    salesCities: [],
  });

  const [operator, setOperator] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string[]>([]);
  const [sales, setSales] = useState<string[]>([]);
  const [salesCity, setSalesCity] = useState<string[]>([]);
  const [shopNameKeyword, setShopNameKeyword] = useState("");
  const [merchantIdKeyword, setMerchantIdKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [windowPage, setWindowPage] = useState(1);
  const [filterPage, setFilterPage] = useState(1);
  const [hasNextWindow, setHasNextWindow] = useState(false);
  const [copiedMerchantIds, setCopiedMerchantIds] = useState(false);
  const [copyingMerchantIds, setCopyingMerchantIds] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editingShopName, setEditingShopName] = useState("");
  const [savingShopNameId, setSavingShopNameId] = useState<string | null>(null);
  const [editingOperationModeShopId, setEditingOperationModeShopId] = useState<string | null>(null);
  const [editingOperationMode, setEditingOperationMode] = useState("");
  const [savingOperationModeId, setSavingOperationModeId] = useState<string | null>(null);
  const merchantIdCopyCacheRef = useRef<Map<string, string>>(new Map());

  const [sorting, setSorting] = useState<SortingState>([]);

  const startEditShopName = useCallback((row: ShopRow) => {
    setEditingShopId(row._id);
    setEditingShopName((row.shopName ?? "").trim());
  }, []);

  const cancelEditShopName = useCallback(() => {
    setEditingShopId(null);
    setEditingShopName("");
  }, []);

  const startEditOperationMode = useCallback((row: ShopRow) => {
    setEditingOperationModeShopId(row._id);
    setEditingOperationMode((row.operationMode ?? "").trim());
  }, []);

  const cancelEditOperationMode = useCallback(() => {
    setEditingOperationModeShopId(null);
    setEditingOperationMode("");
  }, []);

  const saveShopName = useCallback(async (row: ShopRow) => {
    const nextName = editingShopName.trim();
    if (!nextName) {
      window.alert("店铺名不能为空");
      return;
    }

    if (nextName === (row.shopName ?? "").trim()) {
      cancelEditShopName();
      return;
    }

    setSavingShopNameId(row._id);
    try {
      const response = await fetch("/api/shops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: row._id, shopName: nextName }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || "更新店铺名失败");
      }

      setRows((previous) =>
        previous.map((item) => (item._id === row._id ? { ...item, shopName: nextName } : item))
      );
      cancelEditShopName();
    } catch (error) {
      const message = error instanceof Error ? error.message : "更新店铺名失败";
      window.alert(message);
    } finally {
      setSavingShopNameId(null);
    }
  }, [cancelEditShopName, editingShopName]);

  const saveOperationMode = useCallback(async (row: ShopRow) => {
    const nextMode = editingOperationMode.trim();
    if (!nextMode) {
      window.alert("运营模式不能为空");
      return;
    }

    if (nextMode === (row.operationMode ?? "").trim()) {
      cancelEditOperationMode();
      return;
    }

    setSavingOperationModeId(row._id);
    try {
      const response = await fetch("/api/shops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: row._id, operationMode: nextMode }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || "更新运营模式失败");
      }

      setRows((previous) =>
        previous.map((item) =>
          item._id === row._id ? { ...item, operationMode: nextMode } : item
        )
      );
      cancelEditOperationMode();
    } catch (error) {
      const message = error instanceof Error ? error.message : "更新运营模式失败";
      window.alert(message);
    } finally {
      setSavingOperationModeId(null);
    }
  }, [cancelEditOperationMode, editingOperationMode]);

  const debouncedShopNameKeyword = useDebouncedValue(shopNameKeyword, KEYWORD_DEBOUNCE_MS);
  const debouncedMerchantIdKeyword = useDebouncedValue(merchantIdKeyword, KEYWORD_DEBOUNCE_MS);
  const normalizedShopNameKeyword = debouncedShopNameKeyword.trim();
  const normalizedMerchantIdKeyword = debouncedMerchantIdKeyword.trim();
  const usingCustomRange = Boolean(startDate || endDate);
  const hasAnyFilter =
    operator.length > 0 ||
    platform.length > 0 ||
    sales.length > 0 ||
    salesCity.length > 0 ||
    normalizedShopNameKeyword.length > 0 ||
    normalizedMerchantIdKeyword.length > 0 ||
    usingCustomRange;

  const columns = useMemo(
    () => [
      columnHelper.accessor("entryDate", {
        header: "录入日期",
        cell: (info) => {
          const val = info.getValue();
          return val ? new Date(val).toISOString().slice(0, 10) : "";
        },
      }),
      columnHelper.accessor("shopName", {
        header: "店铺名",
        cell: (info) => {
          const row = info.row.original;
          const isEditing = editingShopId === row._id;
          const isSaving = savingShopNameId === row._id;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editingShopName}
                  onChange={(event) => setEditingShopName(event.target.value)}
                  className="h-8 min-w-[220px] border-border bg-card text-sm"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => void saveShopName(row)}
                  disabled={isSaving}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={cancelEditShopName}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-100">{info.getValue() ?? ""}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-text-200 hover:text-text-100"
                onClick={() => startEditShopName(row)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      }),
      columnHelper.accessor("merchantId", {
        header: "商家ID",
        cell: (info) => <span className="font-mono text-xs text-text-200">{info.getValue() ?? ""}</span>,
        enableSorting: false,
      }),
      columnHelper.accessor("wechatGroupName", {
        header: "微信群全名",
        cell: (info) => info.getValue() ?? "",
        enableSorting: false,
      }),
      columnHelper.accessor("city", {
        header: "店铺城市",
        cell: (info) => info.getValue() ?? "",
        enableSorting: false,
      }),
      columnHelper.accessor("salesName", {
        header: "开单销售",
        cell: (info) => {
          const row = info.row.original;
          const salesName = (info.getValue() ?? "").trim();
          const status = normalizeEmploymentStatus(row.salesEmploymentStatus);
          if (!salesName) {
            return "";
          }

          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary-100/50 px-2 py-0.5 text-xs font-medium text-text-200">
                {salesName}
              </span>
              {status ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employeeStatusClass(status)}`}
                >
                  {status}
                </span>
              ) : null}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("salesCity", {
        header: "销售所属城市",
        cell: (info) => (
          <span className="inline-flex items-center rounded-full bg-accent-100/20 px-2 py-0.5 text-xs font-medium text-accent-200">
            {info.getValue() ?? ""}
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("contractSignedDate", {
        header: "合同签订日期",
        cell: (info) => {
          const val = info.getValue();
          return val ? new Date(val).toISOString().slice(0, 10) : "";
        },
        enableSorting: false,
      }),
      columnHelper.accessor("operationMode", {
        header: "运营模式",
        cell: (info) => {
          const row = info.row.original;
          const isEditing = editingOperationModeShopId === row._id;
          const isSaving = savingOperationModeId === row._id;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editingOperationMode}
                  onChange={(event) => setEditingOperationMode(event.target.value)}
                  className="h-8 min-w-[180px] border-border bg-card text-sm"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => void saveOperationMode(row)}
                  disabled={isSaving}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={cancelEditOperationMode}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span>{info.getValue() ?? ""}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-text-200 hover:text-text-100"
                onClick={() => startEditOperationMode(row)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("operatorName", {
        header: "负责运营",
        cell: (info) => {
          const row = info.row.original;
          const operatorName = (info.getValue() ?? "").trim();
          const status = normalizeEmploymentStatus(row.operatorEmploymentStatus);
          return (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-accent-100/20 flex items-center justify-center text-[10px] font-bold text-accent-200">
                {operatorName.slice(0, 1)}
              </div>
              <span>{operatorName}</span>
              {status ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employeeStatusClass(status)}`}
                >
                  {status}
                </span>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("deliveryPlatform", {
        header: "外卖平台",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              val?.includes("美团") ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" : 
              val?.includes("饿了么") ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : 
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}>
              {val ?? ""}
            </span>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      cancelEditOperationMode,
      cancelEditShopName,
      editingOperationMode,
      editingOperationModeShopId,
      editingShopId,
      editingShopName,
      startEditOperationMode,
      startEditShopName,
      saveOperationMode,
      saveShopName,
      savingOperationModeId,
      savingShopNameId,
    ]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    fetch("/api/shops/filter-options")
      .then((response) => response.json())
      .then((data: FilterOptions) =>
        setOptions({
          operatorNames: data.operatorNames ?? [],
          operatorStatusMap: data.operatorStatusMap ?? {},
          platforms: data.platforms ?? [],
          salesNames: data.salesNames ?? [],
          salesStatusMap: data.salesStatusMap ?? {},
          salesCities: data.salesCities ?? [],
        })
      );
  }, []);

  useEffect(() => {
    const activePage = hasAnyFilter ? filterPage : windowPage;
    const activePageSize = hasAnyFilter ? FILTER_PAGE_SIZE : WINDOW_PAGE_SIZE;
    const search = buildShopListSearchParams({
      page: activePage,
      pageSize: activePageSize,
      startDate,
      endDate,
      operator,
      platform,
      sales,
      salesCity,
      shopNameKeyword: normalizedShopNameKeyword,
      merchantIdKeyword: normalizedMerchantIdKeyword,
    });

    fetch(`/api/shops?${search.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setRows((data.data ?? []) as ShopRow[]);
        const nextTotal = Number(data.total ?? 0);
        setTotal(nextTotal);
        setHasNextWindow(nextTotal > activePage * activePageSize);
      })
      .finally(() => setLoading(false));
  }, [
    endDate,
    filterPage,
    hasAnyFilter,
    operator,
    platform,
    sales,
    salesCity,
    normalizedShopNameKeyword,
    normalizedMerchantIdKeyword,
    startDate,
    windowPage,
  ]);

  const merchantIdCopyQuery = useMemo(
    () =>
      buildShopListSearchParams({
      startDate,
      endDate,
      operator,
      platform,
      sales,
      salesCity,
      shopNameKeyword: normalizedShopNameKeyword,
      merchantIdKeyword: normalizedMerchantIdKeyword,
    }).toString(),
    [
      endDate,
      normalizedMerchantIdKeyword,
      normalizedShopNameKeyword,
      operator,
      platform,
      sales,
      salesCity,
      startDate,
    ]
  );

  function handleOperatorChange(next: string[]) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setOperator(next);
  }

  function handlePlatformChange(next: string[]) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setPlatform(next);
  }

  function handleSalesChange(next: string[]) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setSales(next);
  }

  function handleSalesCityChange(next: string[]) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setSalesCity(next);
  }

  function handleMerchantIdKeywordChange(next: string) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setMerchantIdKeyword(next);
  }

  function handleShopNameKeywordChange(next: string) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setShopNameKeyword(next);
  }

  async function copyMerchantIdColumn() {
    if (loading || copyingMerchantIds) {
      return;
    }

    const currentPageMerchantIds = rows
      .map((item) => (item.merchantId ?? "").trim())
      .filter(Boolean)
      .join("\n");

    if (!currentPageMerchantIds) {
      return;
    }

    try {
      let merchantIds = currentPageMerchantIds;

      if (total > rows.length) {
        const cacheKey = `${merchantIdCopyQuery}|${total}`;
        const cachedMerchantIds = merchantIdCopyCacheRef.current.get(cacheKey);

        if (cachedMerchantIds) {
          merchantIds = cachedMerchantIds;
        } else {
          setCopyingMerchantIds(true);

          const response = await fetch(`/api/shops/merchant-ids?${merchantIdCopyQuery}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { message?: string };
            throw new Error(payload.message || "\u83b7\u53d6\u5168\u90e8\u5546\u5bb6ID\u5931\u8d25");
          }

          const responseText = (await response.text()).trim();
          if (!responseText) {
            throw new Error("\u5f53\u524d\u7b5b\u9009\u7ed3\u679c\u6ca1\u6709\u53ef\u590d\u5236\u7684\u5546\u5bb6ID");
          }

          merchantIds = responseText;
          merchantIdCopyCacheRef.current.set(cacheKey, responseText);
        }
      }

      await copyTextToClipboard(merchantIds);
      setCopiedMerchantIds(true);
      setTimeout(() => setCopiedMerchantIds(false), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "\u590d\u5236\u5546\u5bb6ID\u5931\u8d25";
      window.alert(message);
    } finally {
      setCopyingMerchantIds(false);
    }
  }

  function handleStartDateChange(next: string) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setStartDate(next);
  }

  function handleEndDateChange(next: string) {
    setLoading(true);
    setWindowPage(1);
    setFilterPage(1);
    setEndDate(next);
  }

  async function handleExportAll() {
    if (exporting) {
      return;
    }

    if (!getShopExportAuthStatus()) {
      const password = window.prompt("首次导出请输入密码");
      if (password === null) {
        return;
      }

      if (!validateShopExportPassword(password)) {
        window.alert("密码错误，无法导出全部Excel");
        return;
      }

      setShopExportAuthStatus(true);
    }

    setExporting(true);
    try {
      const response = await fetch("/api/shops/export");
      if (!response.ok) {
        let message = "导出失败";
        try {
          const payload = (await response.json()) as { message?: string };
          if (payload.message) {
            message = payload.message;
          }
        } catch {
          message = "导出失败";
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const now = new Date();
      const dateText = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("");
      const fileName = `店铺全部数据-${dateText}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败";
      window.alert(message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-100 tracking-tight">店铺数据展示</h2>
            <p className="mt-1 text-sm text-text-200 opacity-80">支持多维度筛选与数据导出</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-border bg-bg-100 text-text-200 hover:bg-bg-200 hover:text-text-100"
              onClick={handleExportAll}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "导出中..." : "导出全部Excel"}
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-border bg-bg-100 text-text-200 hover:bg-bg-200 hover:text-text-100"
              onClick={() => {
                setLoading(true);
                setOperator([]);
                setPlatform([]);
                setSales([]);
                setSalesCity([]);
                setShopNameKeyword("");
                setMerchantIdKeyword("");
                setStartDate("");
                setEndDate("");
                setWindowPage(1);
                setFilterPage(1);
              }}
            >
              <X className="h-4 w-4" />
              清空筛选
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="grid min-w-[1120px] grid-cols-7 gap-4 xl:min-w-0">
            <FilterSelect
              label="负责运营"
              options={options.operatorNames}
              value={operator}
              onChange={handleOperatorChange}
              formatOptionLabel={(item) =>
                formatEmployeeNameWithStoredStatus(item, options.operatorStatusMap?.[item])
              }
            />

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px] hover-lift hover:border-accent-200/50">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">店铺名筛选</label>
              <div className="space-y-2">
                <Input
                  type="text"
                  className="w-full border-border bg-card text-text-100"
                  value={shopNameKeyword}
                  onChange={(event) => handleShopNameKeywordChange(event.target.value)}
                  placeholder="输入店铺名查找"
                />
                <div className="text-xs text-text-200">支持关键词匹配</div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px] hover-lift hover:border-accent-200/50">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">商家ID筛选</label>
              <div className="space-y-2">
                <Input
                  type="text"
                  className="w-full border-border bg-card text-text-100"
                  value={merchantIdKeyword}
                  onChange={(event) => handleMerchantIdKeywordChange(event.target.value)}
                  placeholder="输入商家ID查找"
                />
                <div className="text-xs text-text-200">支持关键词匹配</div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px] hover-lift hover:border-accent-200/50">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">合同签订日期筛选</label>
              <div className="space-y-2">
                <Input
                  type="date"
                  className="w-full border-border bg-card text-text-100"
                  value={startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                />
                <Input
                  type="date"
                  className="w-full border-border bg-card text-text-100"
                  value={endDate}
                  onChange={(event) => handleEndDateChange(event.target.value)}
                />
                <div className="text-xs text-text-200">
                  {usingCustomRange
                    ? `当前按合同签订日期范围查询（第${filterPage}页，每页${FILTER_PAGE_SIZE}家）`
                    : hasAnyFilter
                      ? `当前为筛选结果分页展示（第${filterPage}页，每页${FILTER_PAGE_SIZE}家）`
                      : `当前为店铺分页展示（第${windowPage}页，每页${WINDOW_PAGE_SIZE}家）`}
                </div>
              </div>
            </div>

            <FilterSelect label="外卖平台" options={options.platforms} value={platform} onChange={handlePlatformChange} />
            <FilterSelect
              label="开单销售"
              options={options.salesNames}
              value={sales}
              onChange={handleSalesChange}
              formatOptionLabel={(item) =>
                formatEmployeeNameWithStoredStatus(item, options.salesStatusMap?.[item])
              }
            />
            <FilterSelect label="销售所属城市" options={options.salesCities} value={salesCity} onChange={handleSalesCityChange} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="border-b border-border bg-bg-200/30 px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-medium text-text-200">
            共找到 <span className="text-accent-200 font-bold">{total}</span> 条记录
          </div>
          {copyingMerchantIds ? (
            <div className="text-xs font-medium text-text-200">{"\u5546\u5bb6ID\u590d\u5236\u4e2d..."}</div>
          ) : copiedMerchantIds ? (
            <div className="text-xs font-medium text-green-600 dark:text-green-400">商家ID已复制</div>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto px-3 py-1.5 text-xs"
              disabled={loading || (hasAnyFilter ? filterPage <= 1 : windowPage <= 1)}
              onClick={() => {
                setLoading(true);
                if (hasAnyFilter) {
                  setFilterPage((page) => Math.max(1, page - 1));
                  return;
                }
                setWindowPage((page) => Math.max(1, page - 1));
              }}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto px-3 py-1.5 text-xs"
              disabled={loading || !hasNextWindow}
              onClick={() => {
                setLoading(true);
                if (hasAnyFilter) {
                  setFilterPage((page) => page + 1);
                  return;
                }
                setWindowPage((page) => page + 1);
              }}
            >
              下一页
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-bg-200/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`px-6 py-4 text-left font-semibold text-text-200 whitespace-nowrap select-none transition-colors duration-fast ease-apple ${
                        header.id === "merchantId"
                          ? copyingMerchantIds
                            ? "cursor-wait opacity-70"
                            : "cursor-copy hover:bg-accent-100/20"
                          : header.column.getCanSort()
                            ? "cursor-pointer hover:bg-bg-300/50"
                            : ""
                      }`}
                      onClick={
                        header.id === "merchantId"
                          ? copyMerchantIdColumn
                          : header.column.getToggleSortingHandler()
                      }
                      title={header.id === "merchantId" ? "\u70b9\u51fb\u590d\u5236\u5f53\u524d\u7b5b\u9009\u7ed3\u679c\u5168\u90e8\u5546\u5bb6ID\uff08\u6bcf\u884c\u4e00\u4e2a\uff09" : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-text-200/50">
                            {{
                              asc: <ArrowUp className="h-3.5 w-3.5 text-accent-200" />,
                              desc: <ArrowDown className="h-3.5 w-3.5 text-accent-200" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-border bg-card">
              {loading ? (
                <TableRow>
                  <TableCell className="px-6 py-12 text-center text-text-200" colSpan={columns.length}>
                    <div className="flex justify-center items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent-200"></div>
                      <span className="font-medium">加载数据中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-6 py-12 text-center text-text-200" colSpan={columns.length}>
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 opacity-20" />
                      <span>暂无符合条件的数据</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-bg-200/50 transition-colors duration-fast ease-apple group border-border">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap text-text-200 group-hover:text-text-100 transition-colors duration-fast ease-apple">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
