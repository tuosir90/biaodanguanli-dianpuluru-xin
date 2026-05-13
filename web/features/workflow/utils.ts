export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function monthStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function monthEnd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPagedDaysRange(page: number, days: number) {
  const safePage = Math.max(page, 1);
  const offsetDays = (safePage - 1) * days;
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));
  return {
    startDate: formatDateValue(start),
    endDate: formatDateValue(end),
  };
}

export function statusKey(shopId: string, progressKey: string) {
  return `${shopId}__${progressKey}`;
}

export function platformClass(platform: string) {
  if (platform.includes("美团")) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  if (platform.includes("饿了么")) {
    return "text-blue-600 dark:text-blue-400";
  }
  if (platform.includes("京东")) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-text-200";
}

export function statusBadgeClass(status: string) {
  if (status === "已解约") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (status === "无效店铺") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  if (status === "新店") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
}

export function patrolWarningClass(daysUnpatrolled: number | null | undefined) {
  const days = Number.isFinite(daysUnpatrolled) ? Number(daysUnpatrolled) : 0;
  if (days >= 3) {
    return "text-red-600 dark:text-red-400";
  }
  if (days === 2) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  return "text-green-600 dark:text-green-400";
}

export function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function chunkArray<T>(source: T[], chunkSize: number) {
  if (chunkSize <= 0) return [source];
  const chunks: T[][] = [];
  for (let index = 0; index < source.length; index += chunkSize) {
    chunks.push(source.slice(index, index + chunkSize));
  }
  return chunks;
}
