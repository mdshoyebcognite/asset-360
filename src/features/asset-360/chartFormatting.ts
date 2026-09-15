import type { ReactNode } from 'react';

/** Inclusive [start, end] of the visible chart window, in epoch milliseconds. */
export type TimeDomain = [number, number];

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_STAT = '—';
const MAX_STAT_DECIMALS = 2;

/** Drops the tick resolution as the visible window widens, so labels stay readable. */
export function formatAxisTick(value: number, spanMs: number): string {
  const date = new Date(value);
  if (spanMs > 180 * DAY_MS) {
    return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
  }
  if (spanMs > 2 * DAY_MS) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDomainBoundary(value: number): string {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDomainLabel(domain: TimeDomain): string {
  return `${formatDomainBoundary(domain[0])} - ${formatDomainBoundary(domain[1])}`;
}

export function formatStatValue(value: number | undefined): string {
  if (value === undefined) {
    return EMPTY_STAT;
  }
  return value.toLocaleString([], { maximumFractionDigits: MAX_STAT_DECIMALS });
}

/**
 * Aura's tooltip resolves its heading from the chart config, so the timestamp has to be read
 * off the hovered row rather than the x-axis value it passes in.
 */
export function formatTooltipLabel(
  _value: ReactNode,
  payload: { payload?: Record<string, unknown> }[],
): ReactNode {
  const timestamp = payload[0]?.payload?.timestamp;
  if (typeof timestamp !== 'number') {
    return null;
  }
  return new Date(timestamp).toLocaleString();
}
