export type RecentSignedTerminationShopSource = {
  _id?: string;
  shopName?: string | null;
  merchantId?: string | null;
  deliveryPlatform?: string | null;
  operatorName?: string | null;
  contractSignedDate?: Date | string | null;
  shopStatus?: string | null;
  terminationDate?: Date | string | null;
  terminationCooperationDays?: number | null;
};

export type RecentSignedTerminationShop = {
  id: string;
  shopName: string;
  merchantId: string;
  deliveryPlatform: string;
  operatorName: string;
  contractSignedDate: string;
  terminationDate: string;
  terminationCooperationDays: number | null;
};

export type RecentSignedTerminationReport = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  operatorCount: number;
  operatorStats: Array<{
    operatorName: string;
    count: number;
  }>;
  shops: RecentSignedTerminationShop[];
};

export type RecentSignedTerminationMonthRange = {
  month: string;
  signedStart: Date;
  signedEnd: Date;
  terminationStart: Date;
  terminationEnd: Date;
  signedMonthRange: RecentSignedTerminationReport["signedMonthRange"];
  terminationDateRange: {
    startDate: string;
    endDate: string;
  };
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatShanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateKeyFromParts(year: number, monthNumber: number, day: number) {
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthFromParts(year: number, monthNumber: number) {
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

function shanghaiDateKeyToDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+08:00`);
}

function addMonths(year: number, monthNumber: number, offset: number) {
  const value = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return {
    year: value.getUTCFullYear(),
    monthNumber: value.getUTCMonth() + 1,
  };
}

function endDateKeyOfMonth(year: number, monthNumber: number) {
  const value = new Date(Date.UTC(year, monthNumber, 0));
  return formatDateKeyFromParts(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate()
  );
}

function isDateKeyInClosedRange(dateKey: string, startDateKey: string, endDateKey: string) {
  return dateKey >= startDateKey && dateKey <= endDateKey;
}

export function buildRecentSignedTerminationMonthRange(
  month: string
): RecentSignedTerminationMonthRange | null {
  const normalizedMonth = normalizeText(month);
  const matched = normalizedMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const monthNumber = Number(matched[2]);
  if (!Number.isInteger(year) || monthNumber < 1 || monthNumber > 12) return null;

  const previousMonth = addMonths(year, monthNumber, -1);
  const nextMonth = addMonths(year, monthNumber, 1);
  const signedStartDateKey = formatDateKeyFromParts(
    previousMonth.year,
    previousMonth.monthNumber,
    1
  );
  const signedEndDateKey = endDateKeyOfMonth(year, monthNumber);
  const terminationStartDateKey = formatDateKeyFromParts(year, monthNumber, 1);

  return {
    month: normalizedMonth,
    signedStart: shanghaiDateKeyToDate(signedStartDateKey),
    signedEnd: shanghaiDateKeyToDate(
      formatDateKeyFromParts(nextMonth.year, nextMonth.monthNumber, 1)
    ),
    terminationStart: shanghaiDateKeyToDate(terminationStartDateKey),
    terminationEnd: shanghaiDateKeyToDate(
      formatDateKeyFromParts(nextMonth.year, nextMonth.monthNumber, 1)
    ),
    signedMonthRange: {
      startMonth: formatMonthFromParts(previousMonth.year, previousMonth.monthNumber),
      endMonth: normalizedMonth,
      startDate: signedStartDateKey,
      endDate: signedEndDateKey,
    },
    terminationDateRange: {
      startDate: terminationStartDateKey,
      endDate: signedEndDateKey,
    },
  };
}

export function buildRecentSignedTerminationReport(params: {
  month: string;
  shops: RecentSignedTerminationShopSource[];
}): RecentSignedTerminationReport {
  const range = buildRecentSignedTerminationMonthRange(params.month);
  if (!range) {
    throw new Error("month 参数无效");
  }

  const filteredShops = params.shops
    .filter((shop) => {
      if (normalizeText(shop.shopStatus) !== "已解约") return false;

      const contractSignedDate = parseDate(shop.contractSignedDate);
      const terminationDate = parseDate(shop.terminationDate);
      if (!contractSignedDate || !terminationDate) return false;

      const contractSignedDateKey = formatShanghaiDateKey(contractSignedDate);
      const terminationDateKey = formatShanghaiDateKey(terminationDate);

      return (
        isDateKeyInClosedRange(
          contractSignedDateKey,
          range.signedMonthRange.startDate,
          range.signedMonthRange.endDate
        ) &&
        isDateKeyInClosedRange(
          terminationDateKey,
          range.terminationDateRange.startDate,
          range.terminationDateRange.endDate
        )
      );
    })
    .map((shop) => {
      const contractSignedDate = parseDate(shop.contractSignedDate)!;
      const terminationDate = parseDate(shop.terminationDate)!;
      const operatorName = normalizeText(shop.operatorName) || "未分配";

      return {
        id: normalizeText(shop._id) || normalizeText(shop.merchantId),
        shopName: normalizeText(shop.shopName),
        merchantId: normalizeText(shop.merchantId),
        deliveryPlatform: normalizeText(shop.deliveryPlatform),
        operatorName,
        contractSignedDate: formatShanghaiDateKey(contractSignedDate),
        terminationDate: formatShanghaiDateKey(terminationDate),
        terminationCooperationDays:
          typeof shop.terminationCooperationDays === "number"
            ? shop.terminationCooperationDays
            : null,
      };
    })
    .sort((left, right) => {
      const terminationCompare = right.terminationDate.localeCompare(left.terminationDate);
      if (terminationCompare !== 0) return terminationCompare;
      return left.shopName.localeCompare(right.shopName, "zh-CN");
    });

  const operatorCountMap = new Map<string, number>();
  filteredShops.forEach((shop) => {
    operatorCountMap.set(shop.operatorName, (operatorCountMap.get(shop.operatorName) ?? 0) + 1);
  });

  const operatorStats = Array.from(operatorCountMap.entries())
    .map(([operatorName, count]) => ({ operatorName, count }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.operatorName.localeCompare(right.operatorName, "zh-CN")
    );

  return {
    month: range.month,
    signedMonthRange: range.signedMonthRange,
    totalTerminatedCount: filteredShops.length,
    operatorCount: operatorStats.length,
    operatorStats,
    shops: filteredShops,
  };
}
