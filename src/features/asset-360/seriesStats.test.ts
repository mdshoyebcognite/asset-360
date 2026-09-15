import { describe, expect, it } from 'vitest';

import { computeSeriesStats } from './seriesStats';

describe(computeSeriesStats.name, () => {
  it('should summarise a series with several datapoints', () => {
    const stats = computeSeriesStats([
      makeDatapoint('2024-05-01T00:00:00.000Z', 4),
      makeDatapoint('2024-05-01T01:00:00.000Z', 10),
      makeDatapoint('2024-05-01T02:00:00.000Z', 7),
    ]);

    expect(stats).toEqual({ min: 4, max: 10, average: 7, latest: 7, count: 3 });
  });

  it('should take the latest value from the last datapoint rather than the highest', () => {
    const stats = computeSeriesStats([
      makeDatapoint('2024-05-01T00:00:00.000Z', 9),
      makeDatapoint('2024-05-01T01:00:00.000Z', 1),
    ]);

    expect(stats?.latest).toBe(1);
  });

  it('should report identical bounds for a single datapoint', () => {
    const stats = computeSeriesStats([makeDatapoint('2024-05-01T00:00:00.000Z', 4.2)]);

    expect(stats).toEqual({ min: 4.2, max: 4.2, average: 4.2, latest: 4.2, count: 1 });
  });

  it('should handle negative values', () => {
    const stats = computeSeriesStats([
      makeDatapoint('2024-05-01T00:00:00.000Z', -5),
      makeDatapoint('2024-05-01T01:00:00.000Z', 5),
    ]);

    expect(stats).toEqual({ min: -5, max: 5, average: 0, latest: 5, count: 2 });
  });

  it('should return null for an empty series', () => {
    expect(computeSeriesStats([])).toBeNull();
  });
});

function makeDatapoint(timestamp: string, value: number) {
  return { timestamp: new Date(timestamp), value };
}
