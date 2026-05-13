export type DailyTrendPoint = {
  date: string;
  value: number;
};

export type DailyTrendSeries = {
  name: string;
  values: DailyTrendPoint[];
};

type DailyCountItem = {
  date?: string;
  count?: number;
};

export function buildDailyCountTrendSeries(
  name: string,
  dateKeys: string[],
  items: DailyCountItem[]
): DailyTrendSeries[] {
  const countByDate = new Map<string, number>();

  items.forEach((item) => {
    const date = String(item.date ?? "").trim();
    if (!date) {
      return;
    }

    const count = Number(item.count ?? 0);
    countByDate.set(date, Number.isFinite(count) ? count : 0);
  });

  return [
    {
      name,
      values: dateKeys.map((date) => ({
        date,
        value: countByDate.get(date) ?? 0,
      })),
    },
  ];
}
