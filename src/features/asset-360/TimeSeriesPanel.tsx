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
import {
  IconCalendarTime,
  IconRestore,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
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

/** Inclusive [start, end] of the visible chart window, in epoch milliseconds. */
type TimeDomain = [number, number];

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
  const [zoomDomain, setZoomDomain] = useState<TimeDomain | null>(null);

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
    setZoomDomain(null);
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

  const fullDomain = useMemo<TimeDomain | null>(() => {
    const first = chartPoints[0]?.timestamp;
    const last = chartPoints[chartPoints.length - 1]?.timestamp;
    if (first === undefined || last === undefined) {
      return null;
    }
    return [first, last];
  }, [chartPoints]);

  const activeDomain = zoomDomain ?? fullDomain;

  const visiblePoints = useMemo(() => {
    if (!activeDomain) {
      return chartPoints;
    }
    const [start, end] = activeDomain;
    return chartPoints.filter((point) => point.timestamp >= start && point.timestamp <= end);
  }, [activeDomain, chartPoints]);

  const applyZoom = useCallback(
    (factor: number) => {
      if (!fullDomain) {
        return;
      }
      setZoomDomain(zoomTowardCenter(zoomDomain ?? fullDomain, fullDomain, factor));
    },
    [fullDomain, zoomDomain],
  );

  const axisTickFormatter = useMemo(() => {
    const span = activeDomain ? activeDomain[1] - activeDomain[0] : 0;
    return (value: number) => formatAxisTick(value, span);
  }, [activeDomain]);

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <IconCalendarTime size={16} className="text-muted-foreground" />
                <span>{activeDomain ? formatDomainLabel(activeDomain) : 'No time range'}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Button
                  variant="secondary"
                  aria-label="Zoom out"
                  onClick={() => applyZoom(ZOOM_OUT_FACTOR)}
                  disabled={zoomDomain === null}
                >
                  <IconZoomOut size={18} />
                </Button>
                <Button
                  variant="secondary"
                  aria-label="Reset zoom"
                  onClick={() => setZoomDomain(null)}
                  disabled={zoomDomain === null}
                >
                  <IconRestore size={18} />
                </Button>
                <Button
                  variant="secondary"
                  aria-label="Zoom in"
                  onClick={() => applyZoom(ZOOM_IN_FACTOR)}
                >
                  <IconZoomIn size={18} />
                </Button>
                <Button variant="secondary" onClick={refreshChart}>Refresh chart</Button>
              </div>
            </div>
            <div className="h-[460px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visiblePoints} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={activeDomain ?? ['dataMin', 'dataMax']}
                    allowDataOverflow
                    minTickGap={48}
                    tickFormatter={axisTickFormatter}
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </PanelState>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = ['#486AED', '#0F766E', '#C2410C', '#7C3AED', '#BE123C'];

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_SPAN_MS = 60 * 1000;
const ZOOM_IN_FACTOR = 0.5;
const ZOOM_OUT_FACTOR = 2;

/** Shrinks or grows the visible window around its midpoint, clamped to the full data range. */
function zoomTowardCenter(
  domain: TimeDomain,
  fullDomain: TimeDomain,
  factor: number,
): TimeDomain | null {
  const [fullStart, fullEnd] = fullDomain;
  const [start, end] = domain;
  const center = (start + end) / 2;
  const maxSpan = fullEnd - fullStart;
  const nextSpan = Math.min(Math.max((end - start) * factor, MIN_SPAN_MS), maxSpan);

  if (nextSpan >= maxSpan) {
    return null;
  }

  let nextStart = center - nextSpan / 2;
  let nextEnd = center + nextSpan / 2;
  if (nextStart < fullStart) {
    nextStart = fullStart;
    nextEnd = fullStart + nextSpan;
  }
  if (nextEnd > fullEnd) {
    nextEnd = fullEnd;
    nextStart = fullEnd - nextSpan;
  }
  return [nextStart, nextEnd];
}

function formatAxisTick(value: number, spanMs: number): string {
  const date = new Date(value);
  if (spanMs > 180 * DAY_MS) {
    return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
  }
  if (spanMs > 2 * DAY_MS) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDomainBoundary(value: number): string {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDomainLabel(domain: TimeDomain): string {
  return `${formatDomainBoundary(domain[0])} - ${formatDomainBoundary(domain[1])}`;
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
