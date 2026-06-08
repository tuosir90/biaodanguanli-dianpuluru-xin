import type { WorkflowTrendSeries } from "./types";

export type WorkflowTerminationTrendChartDatum = {
  date: string;
  operatorName: string;
  terminatedShopCount: number;
};

export function buildWorkflowTerminationTrendChartData(
  series: WorkflowTrendSeries[]
): WorkflowTerminationTrendChartDatum[] {
  return series.flatMap((item) => {
    const operatorName = item.name.trim() || "未分配";
    return item.values.map((point) => ({
      date: point.date,
      operatorName,
      terminatedShopCount: Number(point.value ?? 0),
    }));
  });
}

export function hasWorkflowTerminationTrendData(
  data: WorkflowTerminationTrendChartDatum[]
) {
  return data.some((item) => item.terminatedShopCount > 0);
}
