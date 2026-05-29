export type ShopStatus = "正常" | "已解约" | "无效店铺" | "新店";

export type ShopItem = {
  _id: string;
  shopName: string;
  operatorName: string;
  salesName?: string;
  merchantId?: string;
  wechatGroupName?: string;
  contractSignedDate?: string;
  deliveryPlatform?: string;
  shopStatus?: ShopStatus;
  terminationDate?: string;
  terminationCooperationDays?: number;
  todayActionType?: "flow" | "patrol";
  todayActionLabel?: string;
  remainingCount?: number;
  daysUnpatrolled?: number | null;
  flowLockedProgressKeys?: string[];
  flowLockReasonText?: string;
  flowLockAmount?: number;
  flowLockDateKeys?: string[];
  dailyPointTotalAmount?: number;
  dailyPointTotalUpdatedDateKey?: string;
};

export type PatrolStatusItem = {
  shopId: string;
  latestPatrolDate: string | null;
  latestUpdatedDate: string | null;
  daysUnpatrolled: number | null;
};

export type WorkflowLogItem = {
  shopId: string;
  progressKey: string;
  completed: boolean;
};

export type WorkflowTodayCompletedItem = {
  shopId: string;
  progressKey: string;
};

export type OperatorShopCountItem = {
  operatorName: string;
  shopCount: number;
};

export type ProgressCountItem = {
  progressKey: string;
  progressLabel: string;
  count: number;
};

export type WorkflowTrendPoint = {
  date: string;
  value: number;
};

export type WorkflowTrendSeries = {
  name: string;
  values: WorkflowTrendPoint[];
};

export type WorkflowSummary = {
  month: string;
  startDate?: string;
  endDate?: string;
  shopCountByOperator: OperatorShopCountItem[];
  progressCountByItem: ProgressCountItem[];
  operatorTerminationTrend: WorkflowTrendSeries[];
};

export type CompletionMonitorItem = {
  operatorName: string;
  pendingShopCount: number;
};

export type CompletionMonitorResponse = {
  operatorStats?: CompletionMonitorItem[];
  totalPendingShops?: number;
};

export type RecentSignedMonitorItem = {
  operatorName: string;
  recentSignedShopCount: number;
};

export type RecentSignedMonitorResponse = {
  operatorStats?: RecentSignedMonitorItem[];
  totalRecentSignedShops?: number;
};

export type CompletionMonitorShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export type RecentSignedMonitorShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export type PatrolAlertItem = {
  operatorName: string;
  alertCount: number;
};

export type PatrolAlertResponse = {
  alerts?: PatrolAlertItem[];
  totalAlertShops?: number;
};

export type WorkflowDailyActionMonitorItem = {
  operatorName: string;
  pendingShopCount: number;
  flowPendingShopCount: number;
  patrolPendingShopCount: number;
};

export type WorkflowDailyActionMonitorResponse = {
  operatorStats?: WorkflowDailyActionMonitorItem[];
  totalPendingShops?: number;
};

export type WorkflowDailyActionMonitorShopsResponse = {
  data?: ShopItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export type PatrolHistoryItem = {
  shopId: string;
  merchantId: string;
  shopName: string;
  operatorName: string;
  patrolDate: string;
  markedAt: string;
  progressLabel?: string;
};

export type PatrolHistoryResponse = {
  items?: PatrolHistoryItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export type ShopFlowMetrics = {
  completedCount: number;
  totalProgressCount: number;
  remainingCount: number;
};

export type ProgressItem = {
  key: string;
  label: string;
};
