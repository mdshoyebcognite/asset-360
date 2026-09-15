import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeServices } from '../__mocks__/contextFixtures';
import {
  makeActivitySummary,
  makeAssetDetail,
  makeFileSummary,
  makeRef,
  makeTimeSeriesDatapoints,
  makeTimeSeriesSummary,
} from '../__mocks__/domainFixtures';
import { Harness } from '../__mocks__/testHarness';
import { CdfAccessError } from '../services';
import type { Services } from '../services';

import { useAsset360DataViewModel } from './useAsset360DataViewModel';

const ASSET_REF = makeRef('PUMP-101');
const DAY_MS = 24 * 60 * 60 * 1000;

describe(useAsset360DataViewModel.name, () => {
  let services: Services;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    services = makeServices();
    wrapper = ({ children }) => <Harness services={services}>{children}</Harness>;
  });

  it('should report loading while the panels are being fetched', () => {
    stubAllResolved();
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    expect(result.current.assetLoading).toBe(true);
    expect(result.current.timeSeriesLoading).toBe(true);
  });

  it('should expose the loaded asset and its related records', async () => {
    stubAllResolved();
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    await waitFor(() => expect(result.current.assetLoading).toBe(false));

    expect(result.current.asset?.tag).toBe('PUMP-101');
    expect(result.current.timeSeries).toHaveLength(1);
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.files).toHaveLength(1);
    expect(result.current.assetError).toBeNull();
  });

  it('should not query CDF when there is no asset reference', () => {
    stubAllResolved();
    renderHook(() => useAsset360DataViewModel(null), { wrapper });

    expect(services.assetService.getAsset).not.toHaveBeenCalled();
    expect(services.timeSeriesService.listForAsset).not.toHaveBeenCalled();
  });

  it('should default related collections to empty arrays before they load', () => {
    stubAllResolved();
    const { result } = renderHook(() => useAsset360DataViewModel(null), { wrapper });

    expect(result.current.timeSeries).toEqual([]);
    expect(result.current.activities).toEqual([]);
    expect(result.current.files).toEqual([]);
  });

  it('should surface a panel error without failing the other panels', async () => {
    stubAllResolved();
    vi.mocked(services.activityService.listForAsset).mockRejectedValue(new Error('SAP unreachable'));
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    await waitFor(() => expect(result.current.activitiesError).not.toBeNull());

    expect(result.current.activitiesError?.message).toBe('SAP unreachable');
    expect(result.current.asset?.tag).toBe('PUMP-101');
  });

  it('should map a 403 failure to a no-access error', async () => {
    stubAllResolved();
    vi.mocked(services.fileService.listForAsset).mockRejectedValue(
      new Error('Request failed with 403'),
    );
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    await waitFor(() => expect(result.current.filesError).not.toBeNull());

    expect(result.current.filesError).toBeInstanceOf(CdfAccessError);
  });

  it('should anchor the default chart window to the latest datapoint', async () => {
    stubAllResolved();
    const latest = new Date('2024-05-01T00:00:00.000Z');
    vi.mocked(services.timeSeriesService.getLatestDatapointTimestamp).mockResolvedValue(latest);
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    const window = await result.current.resolveChartWindow([makeTimeSeriesSummary()]);

    expect(window.end).toEqual(latest);
    expect(window.start).toEqual(new Date(latest.getTime() - 7 * DAY_MS));
  });

  it('should fall back to wall-clock now when no datapoint timestamp exists', async () => {
    stubAllResolved();
    vi.mocked(services.timeSeriesService.getLatestDatapointTimestamp).mockResolvedValue(null);
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    const before = Date.now();
    const window = await result.current.resolveChartWindow([makeTimeSeriesSummary()]);

    expect(window.end.getTime()).toBeGreaterThanOrEqual(before);
    expect(window.end.getTime() - window.start.getTime()).toBe(7 * DAY_MS);
  });

  it('should fetch datapoints for an explicitly supplied window', async () => {
    stubAllResolved();
    const series = [makeTimeSeriesSummary()];
    const window = {
      start: new Date('2024-04-01T00:00:00.000Z'),
      end: new Date('2024-04-08T00:00:00.000Z'),
    };
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    await result.current.fetchChartData(series, window);

    expect(services.timeSeriesService.fetchDatapoints).toHaveBeenCalledWith(
      series,
      window.start,
      window.end,
    );
    expect(services.timeSeriesService.getLatestDatapointTimestamp).not.toHaveBeenCalled();
  });

  it('should resolve a window itself when none is supplied', async () => {
    stubAllResolved();
    const latest = new Date('2024-05-01T00:00:00.000Z');
    vi.mocked(services.timeSeriesService.getLatestDatapointTimestamp).mockResolvedValue(latest);
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });

    await result.current.fetchChartData([makeTimeSeriesSummary()], null);

    expect(services.timeSeriesService.getLatestDatapointTimestamp).toHaveBeenCalled();
    expect(services.timeSeriesService.fetchDatapoints).toHaveBeenCalledWith(
      expect.anything(),
      new Date(latest.getTime() - 7 * DAY_MS),
      latest,
    );
  });

  it('should re-request asset data when retry is invoked', async () => {
    stubAllResolved();
    const { result } = renderHook(() => useAsset360DataViewModel(ASSET_REF), { wrapper });
    await waitFor(() => expect(result.current.assetLoading).toBe(false));

    result.current.retryAsset();
    result.current.retryTimeSeries();
    result.current.retryActivities();
    result.current.retryFiles();

    await waitFor(() => expect(services.assetService.getAsset).toHaveBeenCalledTimes(2));
    expect(services.timeSeriesService.listForAsset).toHaveBeenCalledTimes(2);
    expect(services.activityService.listForAsset).toHaveBeenCalledTimes(2);
    expect(services.fileService.listForAsset).toHaveBeenCalledTimes(2);
  });

  function stubAllResolved() {
    vi.mocked(services.assetService.getAsset).mockResolvedValue(makeAssetDetail());
    vi.mocked(services.timeSeriesService.listForAsset).mockResolvedValue({
      items: [makeTimeSeriesSummary()],
      truncated: false,
    });
    vi.mocked(services.activityService.listForAsset).mockResolvedValue({
      items: [makeActivitySummary()],
      truncated: false,
    });
    vi.mocked(services.fileService.listForAsset).mockResolvedValue({
      items: [makeFileSummary()],
      truncated: false,
    });
    vi.mocked(services.timeSeriesService.getLatestDatapointTimestamp).mockResolvedValue(null);
    vi.mocked(services.timeSeriesService.fetchDatapoints).mockResolvedValue([
      makeTimeSeriesDatapoints(),
    ]);
  }
});
