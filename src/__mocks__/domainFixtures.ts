import type {
  ActivitySummary,
  AssetDetail,
  AssetSummary,
  FileSummary,
  RecentlyViewedAsset,
  TimeSeriesDatapoints,
  TimeSeriesSummary,
} from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

export const TEST_SPACE = 'cdf_cdm';

export function makeRef(externalId: string, space: string = TEST_SPACE): InstanceRef {
  return { space, externalId };
}

export function makeAssetSummary(overrides: Partial<AssetSummary> = {}): AssetSummary {
  return {
    ref: makeRef('PUMP-101'),
    tag: 'PUMP-101',
    name: 'Feed water pump',
    description: 'Primary feed water pump on train A',
    parentName: 'Utilities area',
    typeName: 'Pump',
    ...overrides,
  };
}

export function makeAssetDetail(overrides: Partial<AssetDetail> = {}): AssetDetail {
  return { ...makeAssetSummary(), ...overrides };
}

export function makeTimeSeriesSummary(
  overrides: Partial<TimeSeriesSummary> = {},
): TimeSeriesSummary {
  return {
    ref: makeRef('PUMP-101-DISCHARGE-PRESSURE'),
    name: 'Discharge pressure',
    description: 'Pump discharge pressure',
    unit: 'bar',
    ...overrides,
  };
}

export function makeTimeSeriesDatapoints(
  overrides: Partial<TimeSeriesDatapoints> = {},
): TimeSeriesDatapoints {
  return {
    ref: makeRef('PUMP-101-DISCHARGE-PRESSURE'),
    name: 'Discharge pressure',
    datapoints: [
      { timestamp: new Date('2024-05-01T00:00:00.000Z'), value: 4.1 },
      { timestamp: new Date('2024-05-01T01:00:00.000Z'), value: 4.4 },
    ],
    ...overrides,
  };
}

export function makeActivitySummary(overrides: Partial<ActivitySummary> = {}): ActivitySummary {
  return {
    ref: makeRef('WO-5001'),
    identifier: 'WO-5001',
    title: 'Replace mechanical seal',
    status: 'Completed',
    date: new Date('2024-04-18T09:30:00.000Z'),
    description: 'Seal replaced during planned shutdown.',
    ...overrides,
  };
}

export function makeFileSummary(overrides: Partial<FileSummary> = {}): FileSummary {
  return {
    ref: makeRef('DOC-PID-101'),
    name: 'PUMP-101 P&ID.pdf',
    mimeType: 'application/pdf',
    lastModified: new Date('2024-03-02T12:00:00.000Z'),
    ...overrides,
  };
}

export function makeRecentlyViewedAsset(
  overrides: Partial<RecentlyViewedAsset> = {},
): RecentlyViewedAsset {
  return {
    ref: makeRef('PUMP-101'),
    tag: 'PUMP-101',
    name: 'Feed water pump',
    viewedAt: Date.parse('2024-05-01T08:00:00.000Z'),
    ...overrides,
  };
}
