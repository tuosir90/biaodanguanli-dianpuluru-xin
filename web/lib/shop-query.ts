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

function dayStart(dateInput: Date) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayEnd(dateInput: Date) {
  const date = new Date(dateInput);
  date.setHours(23, 59, 59, 999);
  return date;
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

export function isWithinNewShopCycle(contractSignedDate: unknown, currentDateKey: string) {
  if (!contractSignedDate || !currentDateKey) return false;

  const parsedDate =
    contractSignedDate instanceof Date
      ? contractSignedDate
      : new Date(String(contractSignedDate));

  if (Number.isNaN(parsedDate.getTime())) return false;

  const contractDateKey = formatShanghaiDate(parsedDate);
  const cycleEndDateKey = addDays(contractDateKey, NEW_SHOP_CYCLE_DAYS - 1);
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
    const dates = selectedDateList
      .map((item) => new Date(item))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => dayStart(date));

    if (dates.length > 0) {
      filter.contractSignedDate = { $in: dates };
    }
  }

  if (!filter.contractSignedDate && (startDate || endDate)) {
    const range: { $gte?: Date; $lte?: Date } = {};

    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) {
        range.$gte = dayStart(start);
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        range.$lte = dayEnd(end);
      }
    }

    if (range.$gte || range.$lte) {
      filter.contractSignedDate = range;
    }
  }

  if (month && !filter.contractSignedDate) {
    const start = new Date(`${month}-01T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      filter.contractSignedDate = { $gte: start, $lt: end };
    }
  }

  return filter;
}
