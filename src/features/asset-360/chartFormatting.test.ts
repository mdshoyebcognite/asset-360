import { describe, expect, it } from 'vitest';

import {
  formatAxisTick,
  formatDomainBoundary,
  formatDomainLabel,
  formatStatValue,
  formatTooltipLabel,
} from './chartFormatting';

const DAY_MS = 24 * 60 * 60 * 1000;
const TICK = Date.parse('2024-05-01T10:30:00.000Z');

describe(formatAxisTick.name, () => {
  it('should label ticks by month and year when the window spans more than half a year', () => {
    expect(formatAxisTick(TICK, 200 * DAY_MS)).toBe(
      new Date(TICK).toLocaleDateString([], { month: 'short', year: 'numeric' }),
    );
  });

  it('should label ticks by month and day when the window spans more than two days', () => {
    expect(formatAxisTick(TICK, 10 * DAY_MS)).toBe(
      new Date(TICK).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    );
  });

  it('should label ticks by time of day for short windows', () => {
    expect(formatAxisTick(TICK, 60 * 60 * 1000)).toBe(
      new Date(TICK).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    );
  });
});

describe(formatDomainLabel.name, () => {
  it('should join both window boundaries with a dash', () => {
    const start = Date.parse('2024-05-01T00:00:00.000Z');
    const end = Date.parse('2024-05-02T00:00:00.000Z');

    expect(formatDomainLabel([start, end])).toBe(
      `${formatDomainBoundary(start)} - ${formatDomainBoundary(end)}`,
    );
  });
});

describe(formatStatValue.name, () => {
  it('should round values to two decimals', () => {
    expect(formatStatValue(4.256789)).toBe('4.26');
  });

  it('should render whole numbers without decimals', () => {
    expect(formatStatValue(12)).toBe('12');
  });

  it('should render a dash when there is no value', () => {
    expect(formatStatValue(undefined)).toBe('—');
  });
});

describe(formatTooltipLabel.name, () => {
  it('should read the timestamp off the hovered row', () => {
    const timestamp = Date.parse('2024-05-01T10:30:00.000Z');

    expect(formatTooltipLabel(null, [{ payload: { timestamp, 'series-0': 4.1 } }])).toBe(
      new Date(timestamp).toLocaleString(),
    );
  });

  it('should render nothing when the row carries no timestamp', () => {
    expect(formatTooltipLabel(null, [{ payload: { 'series-0': 4.1 } }])).toBeNull();
  });

  it('should render nothing when there is no hovered row', () => {
    expect(formatTooltipLabel(null, [])).toBeNull();
  });
});
