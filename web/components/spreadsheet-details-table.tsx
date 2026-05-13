import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-200/30 px-4 py-3">
        <div className="text-xs text-text-200">第 {page} / {totalPages} 页（每页 {pageSize} 条）</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto px-3 py-1.5 text-xs"
            disabled={loading || page <= 1}
            onClick={onPreviousPage}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto px-3 py-1.5 text-xs"
            disabled={disableNextPage || loading || page >= totalPages}
            onClick={onNextPage}
          >
            下一页
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-bg-200/50">
            <TableRow className="hover:bg-transparent border-border">
              {columns.map((column) => (
                <TableHead key={column} className="px-6 py-4 text-left font-semibold text-text-200 whitespace-nowrap">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border bg-card">
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-12 text-center text-text-200" colSpan={Math.max(columns.length, 1)}>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${platform}-${index}`} className="border-border">
                  {columns.map((column) => (
                    <TableCell key={`${column}-${index}`} className="px-6 py-3 whitespace-nowrap text-sm text-text-200">
                      {row[column] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
