import {
  buildWorkflowDailyActionItems,
  isWorkflowFlowTaskCompletedToday,
} from "@/features/workflow/daily-action-monitor";
import { fetchLatestDailyPointShopLookup, matchesLatestDailyPointShop } from "@/lib/latest-daily-point-shops";
import {
  getWorkflowEffectiveCompletedKeys,
  getWorkflowFlowProgressKeys,
  getWorkflowFlowMetrics,
} from "@/lib/workflow-flow-metrics";
import { WORKFLOW_ALL_PROGRESS_KEYS, WORKFLOW_FLOW_PROGRESS_KEYS } from "@/lib/workflow-progress-keys";
import { fetchWorkflowStatusSnapshotByShopIds } from "@/lib/workflow-status-snapshot";
import {
  buildOperatorFilter,
  calcDaysUnpatrolled,
  escapeRegex,
  getTodayRangeShanghai,
  normalizeText,
  resolveEffectiveShopStatus,
  toValidDate,
} from "@/lib/workflow-daily-action-utils";
import { Shop } from "@/models/shop";
import { WorkflowProgressLog } from "@/models/workflow-progress-log";

type ShopLite = {
  _id: unknown;
  shopName?: string;
  operatorName?: string;
  salesName?: string;
  merchantId?: string;
  wechatGroupName?: string;
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  shopStatus?: string;
  terminationDate?: Date | string;
  terminationCooperationDays?: number;
  entryDate?: Date | string;
};

export type WorkflowDailyActionShopItem = ShopLite & {
  _id: string;
  shopStatus: "正常" | "已解约" | "无效店铺" | "新店";
  todayActionType: "flow" | "patrol";
  todayActionLabel: string;
  remainingCount: number;
  daysUnpatrolled: number | null;
};

export async function fetchWorkflowDailyActionShopItems(params?: {
  operatorName?: string;
  shopNameKeyword?: string;
  merchantIdKeyword?: string;
  statusKeyword?: string;
}) {
  const { todayDateKey, start, end } = getTodayRangeShanghai();
  const statusKeyword = normalizeText(params?.statusKeyword);
  if (statusKeyword === "已解约" || statusKeyword === "无效店铺") {
    return [] as WorkflowDailyActionShopItem[];
  }

  const shopMatch: Record<string, unknown> = {
    ...buildOperatorFilter(normalizeText(params?.operatorName)),
    shopStatus: { $nin: ["已解约", "无效店铺"] },
  };
  if (params?.shopNameKeyword?.trim()) {
    shopMatch.shopName = { $regex: escapeRegex(params.shopNameKeyword.trim()), $options: "i" };
  }
  if (params?.merchantIdKeyword?.trim()) {
    shopMatch.merchantId = { $regex: escapeRegex(params.merchantIdKeyword.trim()), $options: "i" };
  }

  const shops = await Shop.find(shopMatch)
    .select({
      _id: 1,
      shopName: 1,
      operatorName: 1,
      salesName: 1,
      merchantId: 1,
      wechatGroupName: 1,
      contractSignedDate: 1,
      deliveryPlatform: 1,
      shopStatus: 1,
      terminationDate: 1,
      terminationCooperationDays: 1,
      entryDate: 1,
    })
    .lean<ShopLite[]>();

  if (shops.length === 0) {
    return [] as WorkflowDailyActionShopItem[];
  }

  const shopIds = shops.map((shop) => shop._id);
  const [snapshotMap, latestDailyPointLookup, todayFlowCompletedRows, latestLogs] =
    await Promise.all([
      fetchWorkflowStatusSnapshotByShopIds(shopIds, WORKFLOW_FLOW_PROGRESS_KEYS),
      fetchLatestDailyPointShopLookup(),
      WorkflowProgressLog.aggregate<{ shopId?: unknown; progressKey?: string }>([
        {
          $match: {
            shopId: { $in: shopIds },
            completed: true,
            progressKey: { $ne: "daily_patrol" },
            completedAt: { $gte: start, $lte: end },
          },
        },
        {
          $project: {
            _id: 0,
            shopId: 1,
            progressKey: 1,
          },
        },
      ]),
      WorkflowProgressLog.aggregate([
        {
          $match: {
            shopId: { $in: shopIds },
            completed: true,
            progressKey: { $in: [...WORKFLOW_ALL_PROGRESS_KEYS] },
          },
        },
        {
          $group: {
            _id: "$shopId",
            latestDailyPatrolDate: {
              $max: { $cond: [{ $eq: ["$progressKey", "daily_patrol"] }, "$progressDate", null] },
            },
            latestFlowCompletedAt: {
              $max: { $cond: [{ $ne: ["$progressKey", "daily_patrol"] }, "$completedAt", null] },
            },
          },
        },
      ]),
    ]);

  const latestActivityMap = new Map<string, Date>();
  latestLogs.forEach((row) => {
    const latestCandidates = [row.latestDailyPatrolDate, row.latestFlowCompletedAt]
      .filter(Boolean)
      .map((value) => (value instanceof Date ? value : new Date(String(value))))
      .filter((date) => !Number.isNaN(date.getTime()));
    if (latestCandidates.length === 0) return;
    latestActivityMap.set(
      String(row._id),
      latestCandidates.reduce((latest, current) =>
        current.getTime() > latest.getTime() ? current : latest
      )
    );
  });
  const shopMap = new Map(shops.map((shop) => [String(shop._id), shop]));
  const todayCompletedKeyMap = todayFlowCompletedRows.reduce<Record<string, Set<string>>>(
    (map, row) => {
      const shopId = String(row.shopId ?? "");
      const progressKey = normalizeText(row.progressKey);
      if (!shopId || !progressKey) {
        return map;
      }
      if (!map[shopId]) {
        map[shopId] = new Set<string>();
      }
      map[shopId].add(progressKey);
      return map;
    },
    {}
  );

  const items = buildWorkflowDailyActionItems(
    shops.map((shop) => {
      const effectiveStatus = resolveEffectiveShopStatus(
        shop.shopStatus,
        shop.contractSignedDate,
        todayDateKey
      );
      const snapshot = snapshotMap.get(String(shop._id));
      const requiredFlowKeys = new Set<string>(
        getWorkflowFlowProgressKeys(shop.deliveryPlatform)
      );
      const effectiveCompletedKeys = getWorkflowEffectiveCompletedKeys({
        deliveryPlatform: shop.deliveryPlatform,
        shopStatus: effectiveStatus,
        completedKeys: snapshot?.completedKeys,
        loggedKeys: snapshot?.loggedKeys,
      });
      const metrics = getWorkflowFlowMetrics({
        deliveryPlatform: shop.deliveryPlatform,
        shopStatus: effectiveStatus,
        completedKeys: snapshot?.completedKeys,
        loggedKeys: snapshot?.loggedKeys,
      });
      const todayCompletedFlowKeys = Array.from(
        todayCompletedKeyMap[String(shop._id)] ?? []
      ).filter((progressKey) => requiredFlowKeys.has(progressKey));
      const incompleteFlowKeys = Array.from(requiredFlowKeys).filter(
        (progressKey) => !effectiveCompletedKeys.has(progressKey)
      );
      const latestActivityDate =
        latestActivityMap.get(String(shop._id)) ||
        toValidDate(shop.contractSignedDate) ||
        toValidDate(shop.entryDate);

      return {
        shopId: String(shop._id),
        operatorName: shop.operatorName,
        remainingCount: metrics.remainingCount,
        isNewShop: effectiveStatus === "新店",
        isInvalidShop: effectiveStatus === "无效店铺",
        flowCompletedToday: isWorkflowFlowTaskCompletedToday({
          deliveryPlatform: shop.deliveryPlatform,
          incompleteFlowKeys,
          todayCompletedFlowKeys,
        }),
        latestDailyPointMatched: matchesLatestDailyPointShop(latestDailyPointLookup, {
          merchantId: shop.merchantId,
          shopName: shop.shopName,
        }),
        daysUnpatrolled: calcDaysUnpatrolled(latestActivityDate),
      };
    })
  );

  return items
    .map((item) => {
      const shop = shopMap.get(item.shopId)!;
      const effectiveStatus = resolveEffectiveShopStatus(
        shop.shopStatus,
        shop.contractSignedDate,
        todayDateKey
      );
      return {
        ...shop,
        _id: item.shopId,
        shopStatus: effectiveStatus,
        todayActionType: item.actionType,
        todayActionLabel: item.actionType === "flow" ? "今日需推进流程" : "今日需巡店标记",
        remainingCount: item.remainingCount,
        daysUnpatrolled: item.daysUnpatrolled,
      };
    })
    .filter((item) => !statusKeyword || item.shopStatus === statusKeyword)
    .sort((left, right) => {
      if (left.todayActionType !== right.todayActionType) {
        return left.todayActionType === "flow" ? -1 : 1;
      }
      if (left.todayActionType === "flow") {
        const remainingDiff = right.remainingCount - left.remainingCount;
        if (remainingDiff !== 0) return remainingDiff;
      } else {
        const patrolDiff = (right.daysUnpatrolled ?? 0) - (left.daysUnpatrolled ?? 0);
        if (patrolDiff !== 0) return patrolDiff;
      }
      return normalizeText(left.shopName).localeCompare(normalizeText(right.shopName), "zh-CN");
    });
}
