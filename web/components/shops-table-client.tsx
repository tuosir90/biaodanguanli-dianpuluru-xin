"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Tag, Typography, Space, Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Download,
  Pencil,
  Check,
} from "lucide-react";
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
    <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px]">
      <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">
        {label}
      </label>
      <Select
        value={value.length > 0 ? value[0] : "all"}
        onValueChange={(val) => onChange(val === "all" ? [] : [val])}
      >
        <SelectTrigger className="w-full">
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

function formatDate(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

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
  const [editingOperationModeShopId, setEditingOperationModeShopId] =
    useState<string | null>(null);
  const [editingOperationMode, setEditingOperationMode] = useState("");
  const [savingOperationModeId, setSavingOperationModeId] = useState<
    string | null
  >(null);
  const merchantIdCopyCacheRef = useRef<Map<string, string>>(new Map());

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

  const saveShopName = useCallback(
    async (row: ShopRow) => {
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
          const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(payload.message || "更新店铺名失败");
        }

        setRows((previous) =>
          previous.map((item) =>
            item._id === row._id ? { ...item, shopName: nextName } : item
          )
        );
        cancelEditShopName();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "更新店铺名失败";
        window.alert(message);
      } finally {
        setSavingShopNameId(null);
      }
    },
    [cancelEditShopName, editingShopName]
  );

  const saveOperationMode = useCallback(
    async (row: ShopRow) => {
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
          const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(payload.message || "更新运营模式失败");
        }

        setRows((previous) =>
          previous.map((item) =>
            item._id === row._id ? { ...item, operationMode: nextMode } : item
          )
        );
        cancelEditOperationMode();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "更新运营模式失败";
        window.alert(message);
      } finally {
        setSavingOperationModeId(null);
      }
    },
    [cancelEditOperationMode, editingOperationMode]
  );

  const debouncedShopNameKeyword = useDebouncedValue(
    shopNameKeyword,
    KEYWORD_DEBOUNCE_MS
  );
  const debouncedMerchantIdKeyword = useDebouncedValue(
    merchantIdKeyword,
    KEYWORD_DEBOUNCE_MS
  );
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

  const copyMerchantIdColumn = useCallback(async () => {
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

    const merchantIdCopyQuery = buildShopListSearchParams({
      startDate,
      endDate,
      operator,
      platform,
      sales,
      salesCity,
      shopNameKeyword: normalizedShopNameKeyword,
      merchantIdKeyword: normalizedMerchantIdKeyword,
    }).toString();

    try {
      let merchantIds = currentPageMerchantIds;

      if (total > rows.length) {
        const cacheKey = `${merchantIdCopyQuery}|${total}`;
        const cachedMerchantIds = merchantIdCopyCacheRef.current.get(cacheKey);

        if (cachedMerchantIds) {
          merchantIds = cachedMerchantIds;
        } else {
          setCopyingMerchantIds(true);

          const response = await fetch(
            `/api/shops/merchant-ids?${merchantIdCopyQuery}`,
            { cache: "no-store" }
          );

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as {
              message?: string;
            };
            throw new Error(payload.message || "获取全部商家ID失败");
          }

          const responseText = (await response.text()).trim();
          if (!responseText) {
            throw new Error("当前筛选结果没有可复制的商家ID");
          }

          merchantIds = responseText;
          merchantIdCopyCacheRef.current.set(cacheKey, responseText);
        }
      }

      await copyTextToClipboard(merchantIds);
      setCopiedMerchantIds(true);
      setTimeout(() => setCopiedMerchantIds(false), 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "复制商家ID失败";
      window.alert(message);
    } finally {
      setCopyingMerchantIds(false);
    }
  }, [
    loading,
    copyingMerchantIds,
    rows,
    total,
    startDate,
    endDate,
    operator,
    platform,
    sales,
    salesCity,
    normalizedShopNameKeyword,
    normalizedMerchantIdKeyword,
  ]);

  const columns = useMemo<ColumnsType<ShopRow>>(
    () => [
      {
        title: "录入日期",
        dataIndex: "entryDate",
        key: "entryDate",
        sorter: (a, b) =>
          (a.entryDate ?? "").localeCompare(b.entryDate ?? ""),
        sortIcon: SortIndicator,
        render: (value: string) => formatDate(value),
      },
      {
        title: "店铺名",
        dataIndex: "shopName",
        key: "shopName",
        sorter: (a, b) => (a.shopName ?? "").localeCompare(b.shopName ?? ""),
        sortIcon: SortIndicator,
        render: (_value, row) => {
          const isEditing = editingShopId === row._id;
          const isSaving = savingShopNameId === row._id;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editingShopName}
                  onChange={(event) => setEditingShopName(event.target.value)}
                  className="min-w-[220px] text-sm"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  icon={<Check className="h-3.5 w-3.5" />}
                  onClick={() => void saveShopName(row)}
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<X className="h-3.5 w-3.5" />}
                  onClick={cancelEditShopName}
                  disabled={isSaving}
                />
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-100">
                {row.shopName ?? ""}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => startEditShopName(row)}
              />
            </div>
          );
        },
      },
      {
        title: "商家ID",
        dataIndex: "merchantId",
        key: "merchantId",
        onHeaderCell: () => ({
          onClick: () => void copyMerchantIdColumn(),
          style: { cursor: copyingMerchantIds ? "wait" : "copy" },
          title:
            "点击复制当前筛选结果全部商家ID（每行一个）",
        }),
        render: (value: string) => (
          <span className="font-mono text-xs text-text-200">{value ?? ""}</span>
        ),
      },
      {
        title: "微信群全名",
        dataIndex: "wechatGroupName",
        key: "wechatGroupName",
        render: (value: string) => value ?? "",
      },
      {
        title: "店铺城市",
        dataIndex: "city",
        key: "city",
        render: (value: string) => value ?? "",
      },
      {
        title: "开单销售",
        dataIndex: "salesName",
        key: "salesName",
        render: (_value, row) => {
          const salesName = (row.salesName ?? "").trim();
          const status = normalizeEmploymentStatus(row.salesEmploymentStatus);
          if (!salesName) return "";
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary-100/50 px-2 py-0.5 text-xs font-medium text-text-200">
                {salesName}
              </span>
              {status ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employeeStatusClass(
                    status
                  )}`}
                >
                  {status}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "销售所属城市",
        dataIndex: "salesCity",
        key: "salesCity",
        render: (value: string) => (
          <span className="inline-flex items-center rounded-full bg-accent-100/20 px-2 py-0.5 text-xs font-medium text-accent-200">
            {value ?? ""}
          </span>
        ),
      },
      {
        title: "合同签订日期",
        dataIndex: "contractSignedDate",
        key: "contractSignedDate",
        render: (value: string) => formatDate(value),
      },
      {
        title: "运营模式",
        dataIndex: "operationMode",
        key: "operationMode",
        render: (_value, row) => {
          const isEditing = editingOperationModeShopId === row._id;
          const isSaving = savingOperationModeId === row._id;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editingOperationMode}
                  onChange={(event) =>
                    setEditingOperationMode(event.target.value)
                  }
                  className="min-w-[180px] text-sm"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  icon={<Check className="h-3.5 w-3.5" />}
                  onClick={() => void saveOperationMode(row)}
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<X className="h-3.5 w-3.5" />}
                  onClick={cancelEditOperationMode}
                  disabled={isSaving}
                />
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span>{row.operationMode ?? ""}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => startEditOperationMode(row)}
              />
            </div>
          );
        },
      },
      {
        title: "负责运营",
        dataIndex: "operatorName",
        key: "operatorName",
        sorter: (a, b) =>
          (a.operatorName ?? "").localeCompare(b.operatorName ?? ""),
        sortIcon: SortIndicator,
        render: (_value, row) => {
          const operatorName = (row.operatorName ?? "").trim();
          const status = normalizeEmploymentStatus(
            row.operatorEmploymentStatus
          );
          return (
            <div className="flex items-center gap-2">
              <Avatar
                size={24}
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--secondary-foreground)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {operatorName.slice(0, 1)}
              </Avatar>
              <span>{operatorName}</span>
              {status ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${employeeStatusClass(
                    status
                  )}`}
                >
                  {status}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "外卖平台",
        dataIndex: "deliveryPlatform",
        key: "deliveryPlatform",
        render: (value: string) => {
          const color = value?.includes("美团")
            ? "gold"
            : value?.includes("饿了么")
              ? "blue"
              : "default";
          return value ? <Tag color={color}>{value}</Tag> : null;
        },
      },
    ],
    [
      cancelEditOperationMode,
      cancelEditShopName,
      copyMerchantIdColumn,
      copyingMerchantIds,
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
      )
      .catch(() => undefined);
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
      <Card variant="outlined">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              店铺数据展示
            </Typography.Title>
            <Typography.Text type="secondary">
              支持多维度筛选与数据导出
            </Typography.Text>
          </div>
          <Space>
            <Button
              type="button"
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportAll}
              disabled={exporting}
            >
              {exporting ? "导出中..." : "导出全部Excel"}
            </Button>
            <Button
              variant="outline"
              icon={<X className="h-4 w-4" />}
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
              清空筛选
            </Button>
          </Space>
        </div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="grid min-w-[1120px] grid-cols-7 gap-4 xl:min-w-0">
            <FilterSelect
              label="负责运营"
              options={options.operatorNames}
              value={operator}
              onChange={handleOperatorChange}
              formatOptionLabel={(item) =>
                formatEmployeeNameWithStoredStatus(
                  item,
                  options.operatorStatusMap?.[item]
                )
              }
            />

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px]">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">
                店铺名筛选
              </label>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={shopNameKeyword}
                  onChange={(event) =>
                    handleShopNameKeywordChange(event.target.value)
                  }
                  placeholder="输入店铺名查找"
                />
                <div className="text-xs text-text-200">支持关键词匹配</div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px]">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">
                商家ID筛选
              </label>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={merchantIdKeyword}
                  onChange={(event) =>
                    handleMerchantIdKeywordChange(event.target.value)
                  }
                  placeholder="输入商家ID查找"
                />
                <div className="text-xs text-text-200">支持关键词匹配</div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-bg-200/50 p-4 min-h-[120px]">
              <label className="text-xs font-semibold text-text-200 uppercase tracking-wider">
                合同签订日期筛选
              </label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    handleStartDateChange(event.target.value)
                  }
                />
                <Input
                  type="date"
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

            <FilterSelect
              label="外卖平台"
              options={options.platforms}
              value={platform}
              onChange={handlePlatformChange}
            />
            <FilterSelect
              label="开单销售"
              options={options.salesNames}
              value={sales}
              onChange={handleSalesChange}
              formatOptionLabel={(item) =>
                formatEmployeeNameWithStoredStatus(
                  item,
                  options.salesStatusMap?.[item]
                )
              }
            />
            <FilterSelect
              label="销售所属城市"
              options={options.salesCities}
              value={salesCity}
              onChange={handleSalesCityChange}
            />
          </div>
        </div>
      </Card>

      <Card variant="outlined" styles={{ body: { padding: 0 } }}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="text-sm font-medium text-text-200">
            共找到{" "}
            <span className="font-bold text-accent-200">{total}</span> 条记录
          </div>
          {copyingMerchantIds ? (
            <div className="text-xs font-medium text-text-200">
              商家ID复制中...
            </div>
          ) : copiedMerchantIds ? (
            <div className="text-xs font-medium text-green-600 dark:text-green-400">
              商家ID已复制
            </div>
          ) : null}
          <Space>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
              size="sm"
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
          </Space>
        </div>

        <Table<ShopRow>
          columns={columns}
          dataSource={rows}
          rowKey="_id"
          loading={loading}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-2 py-8 text-text-200">
                <Filter className="h-8 w-8 opacity-20" />
                <span>暂无符合条件的数据</span>
              </div>
            ),
          }}
        />
      </Card>
    </section>
  );
}

// 自定义排序图标，沿用 lucide 风格
function SortIndicator({
  sortOrder,
}: {
  sortOrder: "ascend" | "descend" | null;
}) {
  if (sortOrder === "ascend")
    return <ArrowUp className="h-3.5 w-3.5 text-accent-200" />;
  if (sortOrder === "descend")
    return <ArrowDown className="h-3.5 w-3.5 text-accent-200" />;
  return <ArrowUpDown className="h-3.5 w-3.5 text-text-200/50" />;
}
