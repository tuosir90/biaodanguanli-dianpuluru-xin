import { Button, Table } from "antd";

type PlatformType = "meituan" | "eleme";

export function SpreadsheetDetailsTable({
  platform,
  loading,
  page,
  pageSize,
  totalPages,
  disableNextPage,
  columns,
  rows,
  onPreviousPage,
  onNextPage,
}: {
  platform: PlatformType;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  disableNextPage?: boolean;
  columns: string[];
  rows: Record<string, string>[];
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const dataSource = rows.map((row, index) => ({
    ...row,
    __key: `${platform}-${page}-${index}`,
  }));

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-200/30 px-4 py-3">
        <div className="text-xs text-text-200">第 {page} / {totalPages} 页（每页 {pageSize} 条）</div>
        <div className="flex items-center gap-2">
          <Button
            htmlType="button"
            className="h-auto px-3 py-1.5 text-xs"
            disabled={loading || page <= 1}
            onClick={onPreviousPage}
          >
            上一页
          </Button>
          <Button
            htmlType="button"
            className="h-auto px-3 py-1.5 text-xs"
            disabled={disableNextPage || loading || page >= totalPages}
            onClick={onNextPage}
          >
            下一页
          </Button>
        </div>
      </div>
      <Table<Record<string, string> & { __key: string }>
        rowKey="__key"
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
        dataSource={dataSource}
        columns={columns.map((column) => ({
          title: column,
          dataIndex: column,
          key: column,
          render: (value: string) => (
            <span className="whitespace-nowrap text-sm text-text-200">
              {value || "-"}
            </span>
          ),
        }))}
        locale={{ emptyText: "暂无数据" }}
      />
    </div>
  );
}
