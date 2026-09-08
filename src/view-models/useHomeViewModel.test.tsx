import { renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAppState, makeRecentlyViewed, makeServices } from '../__mocks__/contextFixtures';
import { makeAssetSummary, makeRecentlyViewedAsset } from '../__mocks__/domainFixtures';
import type { AppStateContextValue } from '../state/appStateContext';
import type { RecentlyViewedContextValue } from '../state/recentlyViewedContext';

import { HomeViewModelContext, useHomeViewModel } from './useHomeViewModel';

describe(useHomeViewModel.name, () => {
  let appState: AppStateContextValue;
  let recentlyViewed: RecentlyViewedContextValue;
  let services: ReturnType<typeof makeServices>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    appState = makeAppState();
    recentlyViewed = makeRecentlyViewed({ items: [makeRecentlyViewedAsset()] });
    services = makeServices();
    wrapper = ({ children }) => (
      <HomeViewModelContext.Provider
        value={{
          useAppState: () => appState,
          useRecentlyViewed: () => recentlyViewed,
          useServices: () => services,
        }}
      >
        {children}
      </HomeViewModelContext.Provider>
    );
  });

  it('should expose the recently viewed list from shared storage', () => {
    const { result } = renderHook(() => useHomeViewModel(), { wrapper });

    expect(result.current.recentlyViewed).toHaveLength(1);
    expect(result.current.recentlyViewed[0].tag).toBe('PUMP-101');
  });

  it('should delegate searching to the asset search service', async () => {
    const asset = makeAssetSummary();
    vi.mocked(services.assetSearchService.searchAssets).mockResolvedValue([asset]);
    const { result } = renderHook(() => useHomeViewModel(), { wrapper });

    await expect(result.current.searchAssets('PUMP')).resolves.toEqual([asset]);

    expect(services.assetSearchService.searchAssets).toHaveBeenCalledWith('PUMP');
  });

  it('should propagate a search failure to the caller', async () => {
    vi.mocked(services.assetSearchService.searchAssets).mockRejectedValue(new Error('Search down'));
    const { result } = renderHook(() => useHomeViewModel(), { wrapper });

    await expect(result.current.searchAssets('PUMP')).rejects.toThrow('Search down');
  });

  it('should record the view and navigate when an asset is selected', () => {
    const asset = makeAssetSummary();
    const { result } = renderHook(() => useHomeViewModel(), { wrapper });

    result.current.selectAsset(asset);

    expect(recentlyViewed.recordView).toHaveBeenCalledWith({
      ref: asset.ref,
      tag: 'PUMP-101',
      name: 'Feed water pump',
    });
    expect(appState.navigateToAsset).toHaveBeenCalledWith('cdf_cdm:PUMP-101');
  });

  it('should navigate straight to an already-recorded recent asset', () => {
    const { result } = renderHook(() => useHomeViewModel(), { wrapper });

    result.current.openRecentAsset('cdf_cdm:VALVE-202');

    expect(appState.navigateToAsset).toHaveBeenCalledWith('cdf_cdm:VALVE-202');
    expect(recentlyViewed.recordView).not.toHaveBeenCalled();
  });
});
