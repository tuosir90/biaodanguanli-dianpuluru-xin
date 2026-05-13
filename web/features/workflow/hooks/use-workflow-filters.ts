import { useMemo, useState } from "react";
import { ALL_OPERATORS } from "../constants";
import { currentMonth, monthEnd, monthStart } from "../utils";

export function useWorkflowFilters() {
  const initialMonth = useMemo(() => currentMonth(), []);
  const initialStartDate = useMemo(() => monthStart(), []);
  const initialEndDate = useMemo(() => monthEnd(), []);

  const [selectedOperator, setSelectedOperator] = useState(ALL_OPERATORS);
  const [detailPage, setDetailPage] = useState(1);
  const [chartOperator, setChartOperator] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const [shopNameKeyword, setShopNameKeyword] = useState("");
  const [merchantIdKeyword, setMerchantIdKeyword] = useState("");
  const [statusKeyword, setStatusKeyword] = useState("");

  const [recentSignedFilterOperator, setRecentSignedFilterOperator] = useState("");
  const [dailyActionFilterOperator, setDailyActionFilterOperator] = useState("");

  const hasKeywordFilters = Boolean(shopNameKeyword || merchantIdKeyword || statusKeyword);
  const detailFullScopeMode = false;

  function clearDailyActionFilter() {
    setDetailPage(1);
    setSelectedOperator(ALL_OPERATORS);
    setRecentSignedFilterOperator("");
    setDailyActionFilterOperator("");
  }

  function clearRecentSignedFilter() {
    setDetailPage(1);
    setSelectedOperator(ALL_OPERATORS);
    setRecentSignedFilterOperator("");
  }

  function applyRecentSignedFilter(operatorName: string) {
    const normalizedOperator = (operatorName ?? "").trim() || "未分配";
    setRecentSignedFilterOperator(normalizedOperator);
    setShopNameKeyword("");
    setMerchantIdKeyword("");
    setStatusKeyword("");
    setDailyActionFilterOperator("");
    setDetailPage(1);
    setSelectedOperator(normalizedOperator !== "未分配" ? normalizedOperator : ALL_OPERATORS);
  }

  function applyDailyActionFilter(operatorName: string) {
    const normalizedOperator = (operatorName ?? "").trim() || "未分配";
    setRecentSignedFilterOperator("");
    setDailyActionFilterOperator(normalizedOperator);
    setShopNameKeyword("");
    setMerchantIdKeyword("");
    setStatusKeyword("");
    setDetailPage(1);
    setSelectedOperator(normalizedOperator !== "未分配" ? normalizedOperator : ALL_OPERATORS);
  }

  function resetByOperatorChange(operator: string) {
    setDetailPage(1);
    setSelectedOperator(operator);
    setRecentSignedFilterOperator("");
    setDailyActionFilterOperator("");
  }

  function clearKeywords() {
    setDetailPage(1);
    setShopNameKeyword("");
    setMerchantIdKeyword("");
    setStatusKeyword("");
  }

  function updateShopNameKeyword(value: string) {
    setDetailPage(1);
    setShopNameKeyword(value);
  }

  function updateMerchantIdKeyword(value: string) {
    setDetailPage(1);
    setMerchantIdKeyword(value);
  }

  function updateStatusKeyword(value: string) {
    setDetailPage(1);
    setStatusKeyword(value);
  }

  return {
    initialMonth,
    selectedOperator,
    setSelectedOperator,
    detailPage,
    setDetailPage,
    chartOperator,
    setChartOperator,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    shopNameKeyword,
    updateShopNameKeyword,
    merchantIdKeyword,
    updateMerchantIdKeyword,
    statusKeyword,
    updateStatusKeyword,
    dailyActionFilterOperator,
    recentSignedFilterOperator,
    hasKeywordFilters,
    detailFullScopeMode,
    clearDailyActionFilter,
    clearRecentSignedFilter,
    applyRecentSignedFilter,
    applyDailyActionFilter,
    resetByOperatorChange,
    clearKeywords,
  };
}
