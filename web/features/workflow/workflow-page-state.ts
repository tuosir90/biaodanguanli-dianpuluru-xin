type WorkflowOperatorShopLite = {
  operatorName?: string | null;
};

const WORKFLOW_RETIRED_OPERATOR_NAMES = new Set(["黄兆微"]);

function isNonEmptyOperatorName(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isActiveWorkflowOperatorName(value: string | null | undefined): value is string {
  return isNonEmptyOperatorName(value) && !WORKFLOW_RETIRED_OPERATOR_NAMES.has(value.trim());
}

type CollectWorkflowOperatorsParams = {
  overviewOperators: string[];
  detailShops: WorkflowOperatorShopLite[];
};

type WorkflowActiveDetailFiltersParams = {
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
  recentSignedFilterOperator: string;
  dailyActionFilterOperator: string;
};

type WorkflowListResetKeyParams = {
  selectedOperator: string;
  detailPage: number;
  shopNameKeyword: string;
  merchantIdKeyword: string;
  statusKeyword: string;
  recentSignedFilterOperator: string;
  dailyActionFilterOperator: string;
};

export function collectWorkflowOperators({
  overviewOperators,
  detailShops,
}: CollectWorkflowOperatorsParams) {
  return Array.from(
    new Set([
      ...overviewOperators.filter(isActiveWorkflowOperatorName),
      ...detailShops.map((item) => item.operatorName).filter(isActiveWorkflowOperatorName),
    ])
  );
}

export function hasWorkflowActiveDetailFilters({
  shopNameKeyword,
  merchantIdKeyword,
  statusKeyword,
  recentSignedFilterOperator,
  dailyActionFilterOperator,
}: WorkflowActiveDetailFiltersParams) {
  return Boolean(
    shopNameKeyword ||
      merchantIdKeyword ||
      statusKeyword ||
      recentSignedFilterOperator ||
      dailyActionFilterOperator
  );
}

export function buildWorkflowListResetKey({
  selectedOperator,
  detailPage,
  shopNameKeyword,
  merchantIdKeyword,
  statusKeyword,
  recentSignedFilterOperator,
  dailyActionFilterOperator,
}: WorkflowListResetKeyParams) {
  return [
    selectedOperator,
    detailPage,
    shopNameKeyword,
    merchantIdKeyword,
    statusKeyword,
    recentSignedFilterOperator,
    dailyActionFilterOperator || "all",
  ].join("|");
}
