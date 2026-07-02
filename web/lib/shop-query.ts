import {
  addDaysToDateKey,
  addMonthsToMonthKey,
  formatShanghaiDateKey,
  isDateKey,
  isMonthKey,
  shanghaiDateKeyToDate,
} from "@/lib/shanghai-date";

type ShopFilter = Record<string, unknown>;

export const NEW_SHOP_CYCLE_DAYS = 10;

export function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function parseMultiValue(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isWithinNewShopCycle(contractSignedDate: unknown, currentDateKey: string) {
  if (!contractSignedDate || !currentDateKey) return false;

  const parsedDate =
    contractSignedDate instanceof Date
      ? contractSignedDate
      : new Date(String(contractSignedDate));

  if (Number.isNaN(parsedDate.getTime())) return false;

  const contractDateKey = formatShanghaiDateKey(parsedDate);
  const cycleEndDateKey = addDaysToDateKey(contractDateKey, NEW_SHOP_CYCLE_DAYS - 1);
  if (!cycleEndDateKey) return false;

  return currentDateKey >= contractDateKey && currentDateKey <= cycleEndDateKey;
}

export function buildShopFilter(searchParams: URLSearchParams): ShopFilter {
  const operatorList = parseMultiValue(searchParams.get("operator"));
  const operatorStatus = (searchParams.get("operatorStatus") ?? "").trim();
  const salesList = parseMultiValue(searchParams.get("sales"));
  const salesStatus = (searchParams.get("salesStatus") ?? "").trim();
  const salesCityList = parseMultiValue(searchParams.get("salesCity"));
  const platformList = parseMultiValue(searchParams.get("platform"));
  const selectedDateList = parseMultiValue(searchParams.get("entryDate"));
  const startDate = (searchParams.get("startDate") ?? "").trim();
  const endDate = (searchParams.get("endDate") ?? "").trim();
  const month = (searchParams.get("month") ?? "").trim();
  const shopName = (searchParams.get("shopName") ?? "").trim();
  const merchantId = (searchParams.get("merchantId") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();
  const excludeTerminated = (searchParams.get("excludeTerminated") ?? "").trim() === "1";
  const excludeInvalid = (searchParams.get("excludeInvalid") ?? "").trim() === "1";

  const filter: ShopFilter = {};

  if (operatorList.length > 0) {
    filter.operatorName = { $in: operatorList };
  }
  if (operatorStatus) {
    filter.operatorEmploymentStatus = operatorStatus;
  }
  if (salesList.length > 0) {
    filter.salesName = { $in: salesList };
  }
  if (salesStatus) {
    filter.salesEmploymentStatus = salesStatus;
  }
  if (salesCityList.length > 0) {
    filter.salesCity = { $in: salesCityList };
  }
  if (platformList.length > 0) {
    filter.deliveryPlatform = { $in: platformList };
  }
  if (merchantId) {
    filter.merchantId = { $regex: escapeRegex(merchantId), $options: "i" };
  }
  if (shopName) {
    filter.shopName = { $regex: escapeRegex(shopName), $options: "i" };
  }
  if (status) {
    filter.shopStatus = status;
  } else if (excludeTerminated && excludeInvalid) {
    filter.shopStatus = { $nin: ["已解约", "无效店铺"] };
  } else if (excludeTerminated) {
    filter.shopStatus = { $ne: "\u5df2\u89e3\u7ea6" };
  } else if (excludeInvalid) {
    filter.shopStatus = { $ne: "无效店铺" };
  }

  if (selectedDateList.length > 0) {
    const dateRanges = selectedDateList
      .map((item) => {
        const start = shanghaiDateKeyToDate(item);
        const nextDay = isDateKey(item) ? addDaysToDateKey(item, 1) : "";
        const end = nextDay ? shanghaiDateKeyToDate(nextDay) : null;
        if (!start || !end) return null;
        return { contractSignedDate: { $gte: start, $lt: end } };
      })
      .filter((range): range is { contractSignedDate: { $gte: Date; $lt: Date } } =>
        Boolean(range)
      );

    if (dateRanges.length > 0) {
      filter.$or = dateRanges;
    }
  }

  if (!filter.contractSignedDate && (startDate || endDate)) {
    const range: { $gte?: Date; $lt?: Date } = {};

    if (startDate) {
      const start = shanghaiDateKeyToDate(startDate);
      if (start) {
        range.$gte = start;
      }
    }

    if (endDate) {
      const nextDay = isDateKey(endDate) ? addDaysToDateKey(endDate, 1) : "";
      const end = nextDay ? shanghaiDateKeyToDate(nextDay) : null;
      if (end) {
        range.$lt = end;
      }
    }

    if (range.$gte || range.$lt) {
      filter.contractSignedDate = range;
    }
  }

  if (month && !filter.contractSignedDate) {
    if (isMonthKey(month)) {
      const start = shanghaiDateKeyToDate(`${month}-01`);
      const nextMonth = addMonthsToMonthKey(month, 1);
      const end = nextMonth ? shanghaiDateKeyToDate(`${nextMonth}-01`) : null;
      if (!start || !end) return filter;

      filter.contractSignedDate = { $gte: start, $lt: end };
    }
  }

  return filter;
}
