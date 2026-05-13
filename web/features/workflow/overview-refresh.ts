export type OverviewRefreshSource = "manual" | "passive";

type ShouldThrottleOverviewRefreshParams = {
  refreshSource: OverviewRefreshSource;
  lastFetchAt: number;
  now: number;
  throttleMs: number;
};

type ShouldCommitOverviewRefreshFetchParams = {
  active: boolean;
};

export function shouldThrottleOverviewRefresh({
  refreshSource,
  lastFetchAt,
  now,
  throttleMs,
}: ShouldThrottleOverviewRefreshParams) {
  if (refreshSource === "manual") {
    return false;
  }

  if (lastFetchAt <= 0) {
    return false;
  }

  return now - lastFetchAt < throttleMs;
}

export function shouldCommitOverviewRefreshFetch({
  active,
}: ShouldCommitOverviewRefreshFetchParams) {
  return active;
}
