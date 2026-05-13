import { SpreadsheetDetailsClient } from "@/components/spreadsheet-details-client";

type PlatformType = "meituan" | "eleme";

export function DailyPointDetailsClient({
  platform,
  title,
  subtitle,
}: {
  platform: PlatformType;
  title: string;
  subtitle: string;
}) {
  return (
    <SpreadsheetDetailsClient
      platform={platform}
      title={title}
      subtitle={subtitle}
      listApiPath="/api/daily-point-details"
      loadErrorMessage="每日抽点明细加载失败"
      searchPlaceholder="输入关键词筛选抽点明细"
      disableNextPage
    />
  );
}
