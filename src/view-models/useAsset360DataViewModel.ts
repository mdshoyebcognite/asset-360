import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { CdfAccessError } from '../services';
import { useServices } from '../state/useServices';
import type {
  ActivitySummary,
  AssetDetail,
  FileSummary,
  TimeSeriesDatapoints,
  TimeSeriesSummary,
} from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

const DEFAULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type Asset360DataViewModel = {
  asset: AssetDetail | null | undefined;
  assetLoading: boolean;
  assetError: Error | null;
  timeSeries: TimeSeriesSummary[];
  timeSeriesLoading: boolean;
  timeSeriesError: Error | null;
  activities: ActivitySummary[];
  activitiesLoading: boolean;
  activitiesError: Error | null;
  files: FileSummary[];
  filesLoading: boolean;
  filesError: Error | null;
  fetchChartData: (
    selectedSeries: TimeSeriesSummary[],
    window: { start: Date; end: Date } | null,
  ) => Promise<TimeSeriesDatapoints[]>;
  resolveChartWindow: (selectedSeries: TimeSeriesSummary[]) => Promise<{ start: Date; end: Date }>;
  retryAsset: () => void;
  retryTimeSeries: () => void;
  retryActivities: () => void;
  retryFiles: () => void;
};

export function useAsset360DataViewModel(assetRef: InstanceRef | null): Asset360DataViewModel {
  const services = useServices();

  const assetQuery = useQuery({
    queryKey: ['asset', assetRef?.space, assetRef?.externalId],
    enabled: assetRef !== null,
    queryFn: () => services.assetService.getAsset(assetRef!),
  });

  const timeSeriesQuery = useQuery({
    queryKey: ['time-series-list', assetRef?.space, assetRef?.externalId],
    enabled: assetRef !== null,
    queryFn: () => services.timeSeriesService.listForAsset(assetRef!),
  });

  const activitiesQuery = useQuery({
    queryKey: ['activities', assetRef?.space, assetRef?.externalId],
    enabled: assetRef !== null,
    queryFn: () => services.activityService.listForAsset(assetRef!),
  });

  const filesQuery = useQuery({
    queryKey: ['files', assetRef?.space, assetRef?.externalId],
    enabled: assetRef !== null,
    queryFn: () => services.fileService.listForAsset(assetRef!),
  });

  const resolveChartWindow = useCallback(
    async (selectedSeries: TimeSeriesSummary[]) => {
      const latest = await services.timeSeriesService.getLatestDatapointTimestamp(selectedSeries);
      const end = latest ?? new Date();
      const start = new Date(end.getTime() - DEFAULT_WINDOW_MS);
      return { start, end };
    },
    [services.timeSeriesService],
  );

  const fetchChartData = useCallback(
    async (
      selectedSeries: TimeSeriesSummary[],
      window: { start: Date; end: Date } | null,
    ) => {
      const resolvedWindow = window ?? await resolveChartWindow(selectedSeries);
      return services.timeSeriesService.fetchDatapoints(
        selectedSeries,
        resolvedWindow.start,
        resolvedWindow.end,
      );
    },
    [resolveChartWindow, services.timeSeriesService],
  );

  return {
    asset: assetQuery.data,
    assetLoading: assetQuery.isLoading,
    assetError: normalizeError(assetQuery.error),
    timeSeries: timeSeriesQuery.data ?? [],
    timeSeriesLoading: timeSeriesQuery.isLoading,
    timeSeriesError: normalizeError(timeSeriesQuery.error),
    activities: activitiesQuery.data ?? [],
    activitiesLoading: activitiesQuery.isLoading,
    activitiesError: normalizeError(activitiesQuery.error),
    files: filesQuery.data ?? [],
    filesLoading: filesQuery.isLoading,
    filesError: normalizeError(filesQuery.error),
    fetchChartData,
    resolveChartWindow,
    retryAsset: () => void assetQuery.refetch(),
    retryTimeSeries: () => void timeSeriesQuery.refetch(),
    retryActivities: () => void activitiesQuery.refetch(),
    retryFiles: () => void filesQuery.refetch(),
  };
}

function normalizeError(error: unknown): Error | null {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    if (error.message.includes('403')) {
      return new CdfAccessError(error.message);
    }
    return error;
  }
  return new Error('An unexpected error occurred');
}
