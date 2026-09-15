import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeViewModelContext } from '../../view-models/useHomeViewModel';

import { HomeView } from './HomeView';

function renderHomeView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomeViewModelContext.Provider
        value={{
          useAppState: () => ({
            state: { page: 'home' },
            navigateHome: vi.fn(),
            navigateToAsset: vi.fn(),
          }),
          useRecentlyViewed: () => ({
            items: [],
            recordView: vi.fn(),
          }),
          useServices: () => ({
            assetSearchService: { searchAssets: vi.fn() },
            assetService: { getAsset: vi.fn() },
            timeSeriesService: {
              listForAsset: vi.fn(),
              fetchDatapoints: vi.fn(),
              getLatestDatapointTimestamp: vi.fn(),
            },
            activityService: { listForAsset: vi.fn() },
            fileService: { listForAsset: vi.fn(), getDownloadUrl: vi.fn() },
          }),
        }}
      >
        <HomeView />
      </HomeViewModelContext.Provider>
    </QueryClientProvider>,
  );
}

describe(HomeView.name, () => {
  it('should render search and recently viewed sections', () => {
    renderHomeView();

    expect(screen.getByText('Search assets')).toBeInTheDocument();
    expect(screen.getByText('Recently viewed')).toBeInTheDocument();
  });
});
