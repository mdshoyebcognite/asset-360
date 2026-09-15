import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeTimeSeriesDatapoints, makeTimeSeriesSummary } from '../../__mocks__/domainFixtures';

import { useTimeSeriesChartQuery } from './useTimeSeriesChartQuery';

describe(useTimeSeriesChartQuery.name, () => {
  it('should fetch chart data when a series is selected', async () => {
    const series = makeTimeSeriesSummary();
    const fetchChartData = vi.fn().mockResolvedValue([makeTimeSeriesDatapoints()]);
    const resolveChartWindow = vi.fn().mockResolvedValue({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-08'),
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useTimeSeriesChartQuery({
          selectedSeries: [series],
          selectedIds: ['cdf_cdm:ts-1'],
          fetchChartData,
          resolveChartWindow,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.chartQuery.isSuccess).toBe(true));
    expect(fetchChartData).toHaveBeenCalled();
  });
});
