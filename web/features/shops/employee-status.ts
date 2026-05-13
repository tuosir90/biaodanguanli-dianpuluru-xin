import employeeStatusConfig from "./employee-status-config.json";

export const EMPLOYMENT_STATUS_OPTIONS = ["在职", "离职"] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUS_OPTIONS)[number];
export type EmployeeRole = "sales" | "operator";
type EmployeeStatusConfig = Record<EmployeeRole, { resignedNames: readonly string[] }>;

const typedEmployeeStatusConfig: EmployeeStatusConfig = employeeStatusConfig;

function normalizeName(name: string) {
  return name.trim();
}

export function normalizeEmploymentStatus(status?: string | null): EmploymentStatus | "" {
  const normalizedStatus = String(status ?? "").trim();
  return EMPLOYMENT_STATUS_OPTIONS.includes(normalizedStatus as EmploymentStatus)
    ? (normalizedStatus as EmploymentStatus)
    : "";
}

function resignedNamesByRole(role: EmployeeRole) {
  return typedEmployeeStatusConfig[role].resignedNames;
}

export function resolveEmployeeEmploymentStatus(
  role: EmployeeRole,
  name: string
): EmploymentStatus | "" {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return "";
  }

  return resignedNamesByRole(role).includes(normalizedName) ? "离职" : "在职";
}

export function resolveSalesEmploymentStatus(name: string) {
  return resolveEmployeeEmploymentStatus("sales", name);
}

export function resolveOperatorEmploymentStatus(name: string) {
  return resolveEmployeeEmploymentStatus("operator", name);
}

export function formatEmployeeNameWithStatus(
  role: EmployeeRole,
  name: string,
  storedStatus?: string | null
) {
  const normalizedName = normalizeName(name);
  const status =
    normalizeEmploymentStatus(storedStatus) ||
    resolveEmployeeEmploymentStatus(role, normalizedName);
  return status ? `${normalizedName}（${status}）` : normalizedName;
}

export function formatEmployeeNameWithStoredStatus(name: string, status?: string | null) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return "";
  }

  const normalizedStatus = normalizeEmploymentStatus(status);
  return normalizedStatus ? `${normalizedName}（${normalizedStatus}）` : normalizedName;
}

export function buildShopEmploymentStatusPatch(salesName: string, operatorName: string) {
  return {
    salesEmploymentStatus: resolveSalesEmploymentStatus(salesName),
    operatorEmploymentStatus: resolveOperatorEmploymentStatus(operatorName),
  };
}
