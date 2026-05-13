"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  SalesInvalidShopDetailItem,
  SalesInvalidShopsView,
} from "@/features/sales-invalid-shops/types";

type SalesInvalidShopsDetailsTableProps = {
  activeView: SalesInvalidShopsView;
  windowDays: number;
  terminationWithinDays: number;
  details: SalesInvalidShopDetailItem[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

function resolveTableTitle(activeView: SalesInvalidShopsView) {
  if (activeView === "invalid") return "原始无效店铺明细";
  if (activeView === "terminated") return "3天内解约店铺明细";
  return "最终去重汇总明细";
}

export function SalesInvalidShopsDetailsTable({
  activeView,
  windowDays,
  terminationWithinDays,
  details,
  total,
  page,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}: SalesInvalidShopsDetailsTableProps) {
  const tableTitle = resolveTableTitle(activeView);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-100">{tableTitle}</h3>
          <p className="mt-1 text-xs text-text-200">
            {windowDays}天窗口回款与 {terminationWithinDays} 天内解约口径已分开展示，最终汇总会自动去重。
          </p>
        </div>
        <div className="text-xs text-text-200">
          共 {total} 条，当前第 {page}/{totalPages} 页
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>命中来源</TableHead>
            <TableHead>销售</TableHead>
            <TableHead>店铺名</TableHead>
            <TableHead>商家ID</TableHead>
            <TableHead>平台</TableHead>
            <TableHead>城市</TableHead>
            <TableHead>运营</TableHead>
            <TableHead>签约日期</TableHead>
            <TableHead>{windowDays}天统计窗口</TableHead>
            <TableHead className="text-right">{windowDays}天回款总额</TableHead>
            <TableHead>解约日期</TableHead>
            <TableHead className="text-right">合作天数</TableHead>
            <TableHead>匹配方式</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center text-text-200">
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            details.map((item) => (
              <TableRow key={`${item.shopId}-${item.contractSignedDate}`}>
                <TableCell>
                  <span className="inline-flex rounded-full bg-accent-100/15 px-2.5 py-1 text-xs font-medium text-accent-200">
                    {item.reasonText}
                  </span>
                </TableCell>
                <TableCell>{item.salesName}</TableCell>
                <TableCell>{item.shopName}</TableCell>
                <TableCell>{item.merchantId || "-"}</TableCell>
                <TableCell>{item.deliveryPlatform}</TableCell>
                <TableCell>{item.city || "-"}</TableCell>
                <TableCell>{item.operatorName}</TableCell>
                <TableCell>{item.contractSignedDate}</TableCell>
                <TableCell>
                  {item.windowStartDate && item.windowEndDate
                    ? `${item.windowStartDate} 至 ${item.windowEndDate}`
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {typeof item.windowTotalAmount === "number"
                    ? formatCurrency(item.windowTotalAmount)
                    : "-"}
                </TableCell>
                <TableCell>{item.terminationDate || "-"}</TableCell>
                <TableCell className="text-right">
                  {typeof item.terminationCooperationDays === "number"
                    ? `${item.terminationCooperationDays} 天`
                    : "-"}
                </TableCell>
                <TableCell>{item.matchStrategy || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" disabled={loading || page <= 1} onClick={onPrevPage}>
          上一页
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading || page >= totalPages}
          onClick={onNextPage}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
