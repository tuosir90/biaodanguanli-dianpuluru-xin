export function groupRecentSignedMonitorRows<T extends { operatorName: string }>(
  items: T[],
  columnCount = 2
) {
  if (columnCount <= 0) {
    return [items];
  }

  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += columnCount) {
    rows.push(items.slice(index, index + columnCount));
  }

  return rows;
}
