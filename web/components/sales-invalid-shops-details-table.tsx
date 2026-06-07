"use client";

import { Button, Table } from "antd";
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
      <Table<SalesInvalidShopDetailItem>
        rowKey={(item) => `${item.shopId}-${item.contractSignedDate}-${item.reasonText}`}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
        dataSource={details}
        columns={[
          {
            title: "命中来源",
            dataIndex: "reasonText",
            render: (value: string) => (
              <span className="inline-flex rounded-full bg-accent-100/40 px-2.5 py-1 text-xs font-medium text-accent-200">
                {value}
              </span>
            ),
          },
          { title: "销售", dataIndex: "salesName" },
          { title: "店铺名", dataIndex: "shopName" },
          {
            title: "商家ID",
            dataIndex: "merchantId",
            render: (value: string) => value || "-",
          },
          { title: "平台", dataIndex: "deliveryPlatform" },
          {
            title: "城市",
            dataIndex: "city",
            render: (value: string) => value || "-",
          },
          { title: "运营", dataIndex: "operatorName" },
          { title: "签约日期", dataIndex: "contractSignedDate" },
          {
            title: `${windowDays}天统计窗口`,
            key: "window",
            render: (_, item) =>
              item.windowStartDate && item.windowEndDate
                ? `${item.windowStartDate} 至 ${item.windowEndDate}`
                : "-",
          },
          {
            title: `${windowDays}天回款总额`,
            dataIndex: "windowTotalAmount",
            align: "right",
            render: (value: number | undefined) =>
              typeof value === "number" ? formatCurrency(value) : "-",
          },
          {
            title: "解约日期",
            dataIndex: "terminationDate",
            render: (value: string) => value || "-",
          },
          {
            title: "合作天数",
            dataIndex: "terminationCooperationDays",
            align: "right",
            render: (value: number | undefined) =>
              typeof value === "number" ? `${value} 天` : "-",
          },
          {
            title: "匹配方式",
            dataIndex: "matchStrategy",
            render: (value: string) => value || "-",
          },
        ]}
        locale={{ emptyText: "暂无数据" }}
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button htmlType="button" disabled={loading || page <= 1} onClick={onPrevPage}>
          上一页
        </Button>
        <Button
          htmlType="button"
          disabled={loading || page >= totalPages}
          onClick={onNextPage}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
