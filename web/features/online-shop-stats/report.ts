import type {
  OnlineShopCountLatestCard,
  OnlineShopCountPlatform,
  OnlineShopCountReport,
  OnlineShopCountSnapshotItem,
  OnlineShopCountTableRow,
} from "./types";

const PLATFORM_ORDER: OnlineShopCountPlatform[] = ["meituan", "eleme"];

function toIsoString(value: Date | string) {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
}

function compareSnapshotTime(left: OnlineShopCountSnapshotItem, right: OnlineShopCountSnapshotItem) {
  return (
    new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime()
  );
}

function buildDailyLatestSnapshotMap(snapshots: OnlineShopCountSnapshotItem[]) {
  const latestSnapshotMap = new Map<string, OnlineShopCountSnapshotItem>();

  snapshots.forEach((snapshot) => {
    const mapKey = `${snapshot.statDateKey}:${snapshot.platform}`;
    const existing = latestSnapshotMap.get(mapKey);
    if (!existing || compareSnapshotTime(existing, snapshot) <= 0) {
      latestSnapshotMap.set(mapKey, snapshot);
    }
  });

  return latestSnapshotMap;
}

function buildRows(latestSnapshotMap: Map<string, OnlineShopCountSnapshotItem>) {
  const rowMap = new Map<string, OnlineShopCountTableRow>();

  latestSnapshotMap.forEach((snapshot) => {
    const current = rowMap.get(snapshot.statDateKey) ?? {
      date: snapshot.statDateKey,
      meituanCount: null,
      meituanCapturedAt: "",
      elemeCount: null,
      elemeCapturedAt: "",
    };

    if (snapshot.platform === "meituan") {
      current.meituanCount = snapshot.count;
      current.meituanCapturedAt = toIsoString(snapshot.capturedAt);
    } else {
      current.elemeCount = snapshot.count;
      current.elemeCapturedAt = toIsoString(snapshot.capturedAt);
    }

    rowMap.set(snapshot.statDateKey, current);
  });

  return Array.from(rowMap.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  );
}

function buildLatestCards(rows: OnlineShopCountTableRow[]): OnlineShopCountLatestCard[] {
  return PLATFORM_ORDER.flatMap((platform) => {
    const latestRow = [...rows]
      .reverse()
      .find((row) =>
        platform === "meituan" ? row.meituanCount !== null : row.elemeCount !== null
      );

    if (!latestRow) {
      return [];
    }

    return [
      {
        platform,
        statDate: latestRow.date,
        count:
          platform === "meituan"
            ? Number(latestRow.meituanCount ?? 0)
            : Number(latestRow.elemeCount ?? 0),
        capturedAt:
          platform === "meituan"
            ? latestRow.meituanCapturedAt
            : latestRow.elemeCapturedAt,
      },
    ];
  });
}

export function buildOnlineShopCountReport(params: {
  month: string;
  snapshots: OnlineShopCountSnapshotItem[];
}): OnlineShopCountReport {
  const latestSnapshotMap = buildDailyLatestSnapshotMap(params.snapshots);
  const rowsAsc = buildRows(latestSnapshotMap);

  return {
    month: params.month,
    latestCards: buildLatestCards(rowsAsc),
    trendSeries: [
      {
        name: "美团",
        values: rowsAsc.map((row) => ({
          date: row.date,
          value: Number(row.meituanCount ?? 0),
        })),
      },
      {
        name: "饿了么",
        values: rowsAsc.map((row) => ({
          date: row.date,
          value: Number(row.elemeCount ?? 0),
        })),
      },
    ],
    rows: [...rowsAsc].reverse(),
  };
}
