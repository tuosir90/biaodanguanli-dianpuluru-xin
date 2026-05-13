import { SALES_INVALID_SHOPS_WINDOW_DAYS } from "./constants";
import { addDays } from "./shared";

type SalesInvalidShopsMonthRange = {
  queryStart: Date;
  start: Date;
  end: Date;
  startDateKey: string;
  windowEndDateKey: string;
};

export function buildSalesInvalidShopsMonthRange(
  month: string
): SalesInvalidShopsMonthRange | null {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const queryStart = new Date(Date.UTC(year, monthIndex, 0, 0, 0, 0));
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0));
  const endDateKey = `${matched[1]}-${matched[2]}-${String(lastDay.getUTCDate()).padStart(2, "0")}`;

  return {
    queryStart,
    start,
    end,
    startDateKey: `${matched[1]}-${matched[2]}-01`,
    windowEndDateKey: addDays(
      endDateKey,
      SALES_INVALID_SHOPS_WINDOW_DAYS - 1
    ),
  };
}
