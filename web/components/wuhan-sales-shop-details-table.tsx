"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WuhanSalesShopDetailItem } from "@/features/wuhan-sales-stats/shop-details-types";

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

type WuhanSalesShopDetailsTableProps = {
  details: WuhanSalesShopDetailItem[];
};

export function WuhanSalesShopDetailsTable({
  details,
}: WuhanSalesShopDetailsTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-100">当月店铺明细</h3>
        <div className="text-xs text-text-200">共 {details.length} 家</div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>开单日期</TableHead>
            <TableHead>商家ID</TableHead>
            <TableHead>店铺名</TableHead>
            <TableHead>开单销售</TableHead>
            <TableHead className="text-right">总回款金额</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-text-200">
                当前月份暂无店铺明细
              </TableCell>
            </TableRow>
          ) : (
            details.map((item) => (
              <TableRow key={item.shopId}>
                <TableCell className="font-mono">{item.contractSignedDate || "-"}</TableCell>
                <TableCell className="font-mono">{item.merchantId || "-"}</TableCell>
                <TableCell>{item.shopName || "-"}</TableCell>
                <TableCell>{item.salesName}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.totalAmount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
