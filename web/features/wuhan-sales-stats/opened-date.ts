type ShopDateSource = {
  entryDate?: Date | string;
  contractSignedDate?: Date | string;
};

function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveWuhanSalesOpenedDate(source: ShopDateSource) {
  return toValidDate(source.entryDate) ?? toValidDate(source.contractSignedDate);
}

export function resolveWuhanSalesOpenedDateKey(source: ShopDateSource) {
  const date = resolveWuhanSalesOpenedDate(source);
  return date ? formatShanghaiDate(date) : "";
}
