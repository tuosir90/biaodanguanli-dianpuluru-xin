import {
  extractDailyPointAmount,
  normalizeDateKey,
  type DailyPointPlatform,
} from "@/lib/daily-point-derived";
import { DailyPointDetail } from "@/models/daily-point-detail";

type DailyPointDerivedSourceRow = {
  _id?: unknown;
  recordDate?: string;
  rowData?: Record<string, unknown>;
};

const DERIVED_PREPARED_TTL_MS = 30 * 60 * 1000;
const monthlyDerivedPreparedCache = new Map<string, number>();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMonthRecordDateRegex(month: string) {
  const matched = month.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    return new RegExp(`^${escapeRegex(month)}`);
  }

  const year = matched[1];
  const monthNoPad = String(Number(matched[2]));
  return new RegExp(`^${year}(?:[-/年\\s]+)0?${monthNoPad}(?:月|[-/\\s]|$)`);
}

export function buildDailyPointDerivedBulkOperations(params: {
  platform: DailyPointPlatform;
  docs: DailyPointDerivedSourceRow[];
}) {
  return params.docs
    .filter((doc) => Boolean(doc._id))
    .map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            recordDateKey: normalizeDateKey(doc.recordDate),
            amountValue: extractDailyPointAmount(
              (doc.rowData ?? {}) as Record<string, unknown>,
              params.platform
            ),
          },
        },
      },
    }));
}

export async function ensureMonthlyDailyPointDerivedPrepared(
  platform: DailyPointPlatform,
  month: string
) {
  const cacheKey = `${platform}:${month}`;
  const cachedUntil = monthlyDerivedPreparedCache.get(cacheKey);
  if (cachedUntil && cachedUntil > Date.now()) {
    return;
  }

  const monthRecordDateRegex = buildMonthRecordDateRegex(month);
  const missingDocs = await DailyPointDetail.find({
    platform,
    recordDate: { $regex: monthRecordDateRegex },
    $or: [
      { recordDateKey: { $exists: false } },
      { recordDateKey: "" },
      { amountValue: { $exists: false } },
      { amountValue: null },
    ],
  })
    .select({ _id: 1, recordDate: 1, rowData: 1 })
    .lean<DailyPointDerivedSourceRow[]>();

  const operations = buildDailyPointDerivedBulkOperations({
    platform,
    docs: missingDocs,
  });

  if (operations.length > 0) {
    await DailyPointDetail.bulkWrite(operations, { ordered: false });
  }

  monthlyDerivedPreparedCache.set(cacheKey, Date.now() + DERIVED_PREPARED_TTL_MS);
}
