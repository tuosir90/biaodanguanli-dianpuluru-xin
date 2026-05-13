const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(dateKey: string) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(dateValue: Date) {
  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: string) {
  return DATE_KEY_PATTERN.test(value);
}

export function buildConsecutiveDateKeys(latestDateKey: string, dayCount: number) {
  const latestDate = parseDateKey(latestDateKey);
  if (!latestDate || dayCount <= 0) {
    return [] as string[];
  }

  const output: string[] = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const dateValue = new Date(latestDate.getTime());
    dateValue.setUTCDate(dateValue.getUTCDate() - offset);
    output.push(formatDateKey(dateValue));
  }
  return output;
}
