import type { ChartConfig } from '@cognite/aura/chart';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@cognite/aura/chart';
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
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import {
  IconCalendarTime,
  IconRestore,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useId, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { PanelState } from '../../components/PanelState';
import { resolvePanelStatus } from '../../components/panelStatus';
import type { Datapoint, TimeSeriesDatapoints, TimeSeriesSummary } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

import type { TimeDomain } from './chartFormatting';
import {
  formatAxisTick,
  formatDomainBoundary,
  formatDomainLabel,
  formatStatValue,
  formatTooltipLabel,
} from './chartFormatting';
import type { SeriesStats } from './seriesStats';
import { computeSeriesStats } from './seriesStats';

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

/**
 * A selected series plus the CSS-safe key it is plotted under. Instance refs contain
 * characters that cannot appear in a custom property name, so they cannot be used directly.
 */
type SeriesSlot = {
  slot: string;
  refKey: string;
  name: string;
  unit?: string;
  color: string;
};

function seriesKey(ref: { space: string; externalId: string }): string {
  return encodeInstanceRef(ref);
}

function buildSeriesDescription(series: TimeSeriesSummary): string {
  return [series.description, series.unit ? `Unit: ${series.unit}` : undefined]
    .filter((part) => part !== undefined && part !== '')
    .join(' · ');
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
  const instanceId = useId();
  // React ids contain colons, which are not safe inside an SVG `url(#...)` reference.
  const gradientPrefix = `gradient${instanceId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const selectedSeries = useMemo(
    () => timeSeries.filter((item) => selectedIds.includes(seriesKey(item.ref))),
    [selectedIds, timeSeries],
  );

  const seriesSlots = useMemo<SeriesSlot[]>(
    () =>
      selectedSeries.map((item, index) => ({
        slot: `series-${index}`,
        refKey: seriesKey(item.ref),
        name: item.name,
        unit: item.unit,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      })),
    [selectedSeries],
  );

  const chartConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        seriesSlots.map((series) => [series.slot, { label: series.name, color: series.color }]),
      ),
    [seriesSlots],
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

  const chartPoints = useMemo(
    () => buildChartPoints(chartQuery.data ?? [], seriesSlots),
    [chartQuery.data, seriesSlots],
  );

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

  const visibleStats = useMemo(
    () =>
      seriesSlots.map((series) => {
        const datapoints = chartQuery.data?.find(
          (entry) => seriesKey(entry.ref) === series.refKey,
        )?.datapoints;
        return {
          series,
          stats: computeSeriesStats(clampToDomain(datapoints ?? [], activeDomain)),
        };
      }),
    [activeDomain, chartQuery.data, seriesSlots],
  );

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
          <div className="grid w-full gap-3">
            <CheckboxGroup>
              {timeSeries.map((item) => {
                const id = seriesKey(item.ref);
                const checked = selectedIds.includes(id);
                const descriptionText = buildSeriesDescription(item);
                return (
                  <CheckboxItem key={id}>
                    <CheckboxItemControl
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggleSeries(id)}
                    />
                    <CheckboxItemLabel>{item.name}</CheckboxItemLabel>
                    {descriptionText ? (
                      <CheckboxItemDescription>{descriptionText}</CheckboxItemDescription>
                    ) : null}
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
          <div className="w-full space-y-3">
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
            <div className="grid w-full gap-3">
              {visibleStats.map(({ series, stats }) => (
                <SeriesStatRow key={series.slot} series={series} stats={stats} />
              ))}
            </div>

            <ChartContainer
              config={chartConfig}
              aria-label="Selected time series datapoints"
              className="aspect-auto h-[460px] w-full min-w-0"
            >
              <AreaChart data={visiblePoints} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                <defs>
                  {seriesSlots.map((series) => (
                    <linearGradient
                      key={series.slot}
                      id={`${gradientPrefix}-${series.slot}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={series.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={series.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
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
                <ChartTooltip content={<ChartTooltipContent labelFormatter={formatTooltipLabel} />} />
                <ChartLegend content={<ChartLegendContent />} />
                {seriesSlots.map((series) => (
                  <Area
                    key={series.slot}
                    type="monotone"
                    dataKey={series.slot}
                    name={series.name}
                    stroke={series.color}
                    fill={`url(#${gradientPrefix}-${series.slot})`}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ChartContainer>

            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <span>{activeDomain ? formatDomainBoundary(activeDomain[0]) : ''}</span>
              <span>Hover the chart to inspect individual datapoints.</span>
              <span>{activeDomain ? formatDomainBoundary(activeDomain[1]) : ''}</span>
            </div>
          </div>
        </PanelState>
      </CardContent>
    </Card>
  );
}

function SeriesStatRow({ series, stats }: { series: SeriesSlot; stats: SeriesStats | null }) {
  return (
    <div className="w-full rounded-md border p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 self-center rounded-full"
          style={{ backgroundColor: series.color }}
        />
        <span className="text-sm font-medium">{series.name}</span>
        {series.unit ? (
          <span className="text-xs text-muted-foreground">{series.unit}</span>
        ) : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SeriesStat label="Min" value={formatStatValue(stats?.min)} />
        <SeriesStat label="Max" value={formatStatValue(stats?.max)} />
        <SeriesStat label="Average" value={formatStatValue(stats?.average)} />
        <SeriesStat label="Latest" value={formatStatValue(stats?.latest)} />
        <SeriesStat label="Datapoints" value={formatStatValue(stats?.count)} />
      </dl>
    </div>
  );
}

function SeriesStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-base font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** Distinct Aura chart palette hues, so series stay distinguishable in light and dark themes. */
const SERIES_COLORS = [
  'var(--chart-fjord-color-1)',
  'var(--chart-aurora-color-1)',
  'var(--chart-orange-color-1)',
  'var(--chart-nordic-color-1)',
  'var(--chart-dusk-color-1)',
];

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

function clampToDomain(datapoints: Datapoint[], domain: TimeDomain | null): Datapoint[] {
  if (!domain) {
    return datapoints;
  }
  const [start, end] = domain;
  return datapoints.filter((point) => {
    const timestamp = point.timestamp.getTime();
    return timestamp >= start && timestamp <= end;
  });
}

function buildChartPoints(seriesData: TimeSeriesDatapoints[], seriesSlots: SeriesSlot[]) {
  const slotByRefKey = new Map(seriesSlots.map((series) => [series.refKey, series.slot]));
  const timestampMap = new Map<number, Record<string, number>>();

  for (const series of seriesData) {
    const slot = slotByRefKey.get(seriesKey(series.ref));
    if (slot === undefined) {
      continue;
    }
    for (const point of series.datapoints) {
      const timestamp = point.timestamp.getTime();
      const existing = timestampMap.get(timestamp) ?? { timestamp };
      existing[slot] = point.value;
      timestampMap.set(timestamp, existing);
    }
  }

  return Array.from(timestampMap.values()).sort((left, right) => left.timestamp - right.timestamp);
}
