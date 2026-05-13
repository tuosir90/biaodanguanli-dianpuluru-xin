type RecentSignedShopLite = {
  operatorName?: string;
  shopStatus?: string;
  wechatGroupName?: string;
  contractSignedDate?: Date | string | null;
};

type RecentSignedMonitorResult = {
  operatorStats: Array<{
    operatorName: string;
    recentSignedShopCount: number;
  }>;
  totalRecentSignedShops: number;
};

function normalizeOperatorName(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "未分配";
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateKey: string, dayOffset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";

  const dateValue = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  dateValue.setUTCDate(dateValue.getUTCDate() + dayOffset);

  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWithinRecentSignedWindow(
  contractSignedDate: unknown,
  currentDateKey: string,
  windowDays: number
) {
  if (!contractSignedDate || !currentDateKey || windowDays <= 0) {
    return false;
  }

  const parsedDate =
    contractSignedDate instanceof Date
      ? contractSignedDate
      : new Date(String(contractSignedDate));

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const contractDateKey = formatShanghaiDate(parsedDate);
  const windowEndDateKey = addDays(contractDateKey, windowDays - 1);
  if (!windowEndDateKey) {
    return false;
  }

  return currentDateKey >= contractDateKey && currentDateKey <= windowEndDateKey;
}

export function buildWorkflowRecentSignedMonitor(params: {
  shops: RecentSignedShopLite[];
  currentDateKey: string;
  windowDays: number;
}): RecentSignedMonitorResult {
  const operatorCountMap = new Map<string, number>();
  let totalRecentSignedShops = 0;

  params.shops.forEach((shop) => {
    const shopStatus = String(shop.shopStatus ?? "").trim();
    if (shopStatus === "已解约" || shopStatus === "无效店铺") {
      return;
    }

    if (!String(shop.wechatGroupName ?? "").trim()) {
      return;
    }

    if (
      !isWithinRecentSignedWindow(
        shop.contractSignedDate,
        params.currentDateKey,
        params.windowDays
      )
    ) {
      return;
    }

    totalRecentSignedShops += 1;
    const operatorName = normalizeOperatorName(shop.operatorName);
    operatorCountMap.set(
      operatorName,
      (operatorCountMap.get(operatorName) ?? 0) + 1
    );
  });

  return {
    totalRecentSignedShops,
    operatorStats: Array.from(operatorCountMap.entries())
      .map(([operatorName, recentSignedShopCount]) => ({
        operatorName,
        recentSignedShopCount,
      }))
      .sort(
        (left, right) =>
          right.recentSignedShopCount - left.recentSignedShopCount ||
          left.operatorName.localeCompare(right.operatorName, "zh-CN")
      ),
  };
}
