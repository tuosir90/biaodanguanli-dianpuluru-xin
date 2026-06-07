"use client";

import Link from "next/link";
import { Button, Table } from "antd";
import type { WuhanSalesDailyStatItem } from "@/features/wuhan-sales-stats/types";
import { WUHAN_SALES_STATS_ALL_VALUE } from "@/features/wuhan-sales-stats/month";

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

type WuhanSalesDailyStatsTableProps = {
  month: string;
  dailyStats: WuhanSalesDailyStatItem[];
};

export function WuhanSalesDailyStatsTable({
  month,
  dailyStats,
}: WuhanSalesDailyStatsTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-100">每日回款明细</h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-text-200">共 {dailyStats.length} 天</div>
          {month === WUHAN_SALES_STATS_ALL_VALUE ? null : (
            <Link href={`/daily-point/wuhan-sales-stats/shop-details?month=${encodeURIComponent(month)}`}>
              <Button>店铺明细</Button>
            </Link>
          )}
        </div>
      </div>

      <Table<WuhanSalesDailyStatItem>
        rowKey="date"
        dataSource={dailyStats}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          {
            title: "日期",
            dataIndex: "date",
            fixed: "left",
            render: (value: string) => <span className="font-mono">{value}</span>,
          },
          {
            title: "每日抽点店铺数",
            dataIndex: "dailyPointShopCount",
            align: "right",
            render: (value: number) => <span className="font-medium">{value}</span>,
          },
          {
            title: "每日总回款金额",
            dataIndex: "dailyPointAmountTotal",
            align: "right",
            render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
          },
          {
            title: "美团抽点店铺数",
            dataIndex: "meituanDailyPointShopCount",
            align: "right",
            render: (value: number) => <span className="font-medium">{value}</span>,
          },
          {
            title: "美团总回款金额",
            dataIndex: "meituanDailyPointAmountTotal",
            align: "right",
            render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
          },
          {
            title: "饿了么抽点店铺数",
            dataIndex: "elemeDailyPointShopCount",
            align: "right",
            render: (value: number) => <span className="font-medium">{value}</span>,
          },
          {
            title: "饿了么总回款金额",
            dataIndex: "elemeDailyPointAmountTotal",
            align: "right",
            render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
          },
          {
            title: "每日开单店铺数",
            dataIndex: "signedShopCount",
            align: "right",
            render: (value: number) => <span className="font-medium">{value}</span>,
          },
        ]}
        locale={{ emptyText: "当前暂无每日回款明细" }}
      />
    </div>
  );
}
