"use client";

import { Table } from "antd";
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

      <Table<WuhanSalesShopDetailItem>
        rowKey="shopId"
        dataSource={details}
        pagination={false}
        columns={[
          {
            title: "开单日期",
            dataIndex: "contractSignedDate",
            render: (value: string) => <span className="font-mono">{value || "-"}</span>,
          },
          {
            title: "商家ID",
            dataIndex: "merchantId",
            render: (value: string) => <span className="font-mono">{value || "-"}</span>,
          },
          {
            title: "店铺名",
            dataIndex: "shopName",
            render: (value: string) => value || "-",
          },
          {
            title: "开单销售",
            dataIndex: "salesName",
            render: (value: string) => value || "-",
          },
          {
            title: "总回款金额",
            dataIndex: "totalAmount",
            align: "right",
            render: (value: number) => (
              <span className="font-medium">{formatCurrency(value)}</span>
            ),
          },
        ]}
        locale={{ emptyText: "当前月份暂无店铺明细" }}
      />
    </div>
  );
}
