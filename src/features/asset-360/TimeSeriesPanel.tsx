import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PanelState } from '../../components/PanelState';
import { resolvePanelStatus } from '../../components/panelStatus';
import type { TimeSeriesDatapoints, TimeSeriesSummary } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

type TimeSeriesPanelProps = {
  timeSeries: TimeSeriesSummary[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  fetchChartData: (
    selectedSeries: TimeSeriesSummary[],
    window: { start: Date; end: Date } | null,
  ) => Promise<TimeSeriesDatapoints[]>;
  resolveChartWindow: (selectedSeries: TimeSeriesSummary[]) => Promise<{ start: Date; end: Date }>;
};

function seriesKey(ref: { space: string; externalId: string }): string {
  return encodeInstanceRef(ref);
}

export function TimeSeriesPanel({
  timeSeries,
  isLoading,
  error,
  onRetry,
  fetchChartData,
  resolveChartWindow,
}: TimeSeriesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chartWindow, setChartWindow] = useState<{ start: Date; end: Date } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedSeries = useMemo(
    () => timeSeries.filter((item) => selectedIds.includes(seriesKey(item.ref))),
    [selectedIds, timeSeries],
  );

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

  const toggleSeries = useCallback((id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      return [...current, id];
    });
    setChartWindow(null);
  }, []);

  const refreshChart = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const listStatus = resolvePanelStatus({
    isLoading,
    error,
    isEmpty: timeSeries.length === 0,
  });

  const chartPoints = useMemo(() => buildChartPoints(chartQuery.data ?? []), [chartQuery.data]);

  const chartStatus = selectedSeries.length === 0
    ? 'empty'
    : resolvePanelStatus({
        isLoading: chartQuery.isLoading,
        error: chartQuery.error instanceof Error ? chartQuery.error : null,
        isEmpty: chartPoints.length === 0 && !chartQuery.isLoading && !chartQuery.error,
      });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time series</CardTitle>
        <CardDescription>
          Select series to plot. The chart anchors to the latest datapoint and refreshes manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PanelState
          status={listStatus}
          emptyTitle="No linked time series"
          emptyDescription="This asset has no time series connected in CDF."
          errorMessage={error?.message}
          onRetry={onRetry}
        >
          <div className="grid gap-3">
            <CheckboxGroup>
              {timeSeries.map((item) => {
              const id = seriesKey(item.ref);
              const checked = selectedIds.includes(id);
              return (
                <CheckboxItem key={id}>
                  <CheckboxItemControl
                    id={id}
                    checked={checked}
                    onCheckedChange={() => toggleSeries(id)}
                  />
                  <div className="grid gap-1">
                    <CheckboxItemLabel>{item.name}</CheckboxItemLabel>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    {item.unit ? (
                      <p className="text-xs text-muted-foreground">Unit: {item.unit}</p>
                    ) : null}
                  </div>
                </CheckboxItem>
              );
            })}
            </CheckboxGroup>
          </div>
        </PanelState>

        <PanelState
          status={chartStatus}
          loadingLabel="Loading chart data..."
          emptyTitle={selectedSeries.length === 0 ? 'No series selected' : 'No datapoints available'}
          emptyDescription={
            selectedSeries.length === 0
              ? 'Select one or more time series above to plot a chart.'
              : 'The selected series have no datapoints in the requested time window.'
          }
          errorMessage={chartQuery.error instanceof Error ? chartQuery.error.message : undefined}
          onRetry={() => void chartQuery.refetch()}
        >
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={refreshChart}>Refresh chart</Button>
            </div>
            <div className="h-[460px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    minTickGap={48}
                    tickFormatter={formatAxisTimestamp}
                  />
                  <YAxis width={56} />
                  <Tooltip labelFormatter={formatTimestampLabel} />
                  <Legend />
                  {selectedSeries.map((item, index) => (
                    <Line
                      key={seriesKey(item.ref)}
                      type="monotone"
                      dataKey={seriesKey(item.ref)}
                      name={item.name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                  <Brush
                    dataKey="timestamp"
                    height={28}
                    travellerWidth={10}
                    stroke={CHART_COLORS[0]}
                    tickFormatter={formatBrushTimestamp}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag the handles on the slider below the chart to zoom into a time range, or drag the
              middle of the slider to pan across time.
            </p>
          </div>
        </PanelState>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = ['#486AED', '#0F766E', '#C2410C', '#7C3AED', '#BE123C'];

function formatAxisTimestamp(value: number): string {
  return new Date(value).toLocaleString();
}

function formatBrushTimestamp(value: number): string {
  return new Date(value).toLocaleDateString();
}

function formatTimestampLabel(value: ReactNode): string {
  if (typeof value === 'number' || typeof value === 'string') {
    return new Date(value).toLocaleString();
  }
  return '';
}

function buildChartPoints(seriesData: TimeSeriesDatapoints[]) {
  const timestampMap = new Map<number, Record<string, number>>();

  for (const series of seriesData) {
    const key = seriesKey(series.ref);
    for (const point of series.datapoints) {
      const timestamp = point.timestamp.getTime();
      const existing = timestampMap.get(timestamp) ?? { timestamp };
      existing[key] = point.value;
      timestampMap.set(timestamp, existing);
    }
  }

  return Array.from(timestampMap.values()).sort((left, right) => left.timestamp - right.timestamp);
}
