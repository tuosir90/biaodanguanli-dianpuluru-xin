import { type EmploymentStatus, normalizeEmploymentStatus } from "./employee-status";

const excludedSales = new Set([
  "孙文龙",
  "左冉",
  "朱春玖",
  "蒋序楚",
  "魏祯宇",
  "杨蓉",
  "赵永鸿",
]);

export function filterSalesNameOptions(names: string[]) {
  return names.filter((name) => !excludedSales.has(name)).sort();
}

export function filterActiveSalesNameOptions(
  names: string[],
  statusMap: Record<string, string>
) {
  return filterSalesNameOptions(names).filter((name) => statusMap[name] !== "离职");
}

type EmployeeStatusRecord = {
  name?: string | null;
  status?: string | null;
  count?: number | null;
};

export function buildEmployeeStatusMap(records: EmployeeStatusRecord[]) {
  const statusByName = new Map<string, { status: EmploymentStatus; count: number }>();

  for (const record of records) {
    const name = String(record.name ?? "").trim();
    const status = normalizeEmploymentStatus(record.status);
    if (!name || !status) continue;

    const count = Number(record.count ?? 1);
    const current = statusByName.get(name);
    if (!current || count > current.count || (count === current.count && status === "离职")) {
      statusByName.set(name, { status, count });
    }
  }

  return Object.fromEntries(
    [...statusByName.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "zh-CN"))
      .map(([name, item]) => [name, item.status])
  );
}
