import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { TimeSeriesDatapoints, TimeSeriesSummary } from '../../types/domain';

export type UseTimeSeriesChartQueryParams = {
  selectedSeries: TimeSeriesSummary[];
  selectedIds: string[];
  fetchChartData: (
    selectedSeries: TimeSeriesSummary[],
    window: { start: Date; end: Date } | null,
  ) => Promise<TimeSeriesDatapoints[]>;
  resolveChartWindow: (selectedSeries: TimeSeriesSummary[]) => Promise<{ start: Date; end: Date }>;
};

export function useTimeSeriesChartQuery({
  selectedSeries,
  selectedIds,
  fetchChartData,
  resolveChartWindow,
}: UseTimeSeriesChartQueryParams) {
  const [chartWindow, setChartWindow] = useState<{ start: Date; end: Date } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const chartQuery = useQuery({
    queryKey: [
      'chart',
      selectedIds,
      chartWindow?.start.toISOString(),
      chartWindow?.end.toISOString(),
      refreshKey,
    ],
    enabled: selectedSeries.length > 0,
    queryFn: async () => {
      const window = chartWindow ?? await resolveChartWindow(selectedSeries);
      if (!chartWindow) {
        setChartWindow(window);
      }
      return fetchChartData(selectedSeries, window);
    },
  });

  const refreshChart = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const resetChartWindow = useCallback(() => {
    setChartWindow(null);
  }, []);

  return {
    chartQuery,
    chartWindow,
    setChartWindow,
    refreshChart,
    resetChartWindow,
  };
}
