import { SpreadsheetDetailsClient } from "@/components/spreadsheet-details-client";

type PlatformType = "meituan" | "eleme";

export function TerminationDetailsClient({
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
      listApiPath="/api/termination-details"
      loadErrorMessage="解约明细加载失败"
      searchPlaceholder="输入关键词筛选解约明细"
      disableNextPage
    />
  );
}
