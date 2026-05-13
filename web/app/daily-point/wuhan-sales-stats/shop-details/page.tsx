import { normalizeWuhanSalesStatsMonth } from "@/features/wuhan-sales-stats/month";
import { WuhanSalesShopDetailsClient } from "@/components/wuhan-sales-shop-details-client";

export default async function WuhanSalesShopDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialMonth = normalizeWuhanSalesStatsMonth(resolvedSearchParams.month);

  return <WuhanSalesShopDetailsClient initialMonth={initialMonth} />;
}
