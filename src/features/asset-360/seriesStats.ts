import type { Datapoint } from '../../types/domain';

export type SeriesStats = {
  min: number;
  max: number;
  average: number;
  latest: number;
  count: number;
};

/** Summarises the datapoints currently visible in the chart window. */
export function computeSeriesStats(datapoints: Datapoint[]): SeriesStats | null {
  const last = datapoints[datapoints.length - 1];
  if (last === undefined) {
    return null;
  }

  let min = last.value;
  let max = last.value;
  let total = 0;
  for (const point of datapoints) {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
    total += point.value;
  }

  return {
    min,
    max,
    average: total / datapoints.length,
    latest: last.value,
    count: datapoints.length,
  };
}
