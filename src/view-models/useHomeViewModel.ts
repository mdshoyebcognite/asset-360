import { createContext, useCallback, useContext, useMemo } from 'react';

import { useAppState } from '../state/useAppState';
import { useRecentlyViewed } from '../state/useRecentlyViewed';
import { useServices } from '../state/useServices';
import type { AssetSummary } from '../types/domain';
import { encodeInstanceRef } from '../types/instanceRef';

export type HomeViewModel = {
  recentlyViewed: ReturnType<typeof useRecentlyViewed>['items'];
  searchAssets: (query: string) => Promise<AssetSummary[]>;
  selectAsset: (asset: AssetSummary) => void;
  openRecentAsset: (assetId: string) => void;
};

const defaultDeps = {
  useAppState,
  useRecentlyViewed,
  useServices,
};

export type HomeViewModelContextType = typeof defaultDeps;

export const HomeViewModelContext = createContext<HomeViewModelContextType>(defaultDeps);

export function useHomeViewModel(): HomeViewModel {
  const { useAppState: useAppStateDep, useRecentlyViewed: useRecentlyViewedDep, useServices: useServicesDep } =
    useContext(HomeViewModelContext);

  const { navigateToAsset } = useAppStateDep();
  const { items, recordView } = useRecentlyViewedDep();
  const { assetSearchService } = useServicesDep();

  const searchAssets = useCallback(
    (query: string) => assetSearchService.searchAssets(query),
    [assetSearchService],
  );

  const selectAsset = useCallback(
    (asset: AssetSummary) => {
      recordView({ ref: asset.ref, tag: asset.tag, name: asset.name });
      navigateToAsset(encodeInstanceRef(asset.ref));
    },
    [navigateToAsset, recordView],
  );

  const openRecentAsset = useCallback(
    (assetId: string) => {
      navigateToAsset(assetId);
    },
    [navigateToAsset],
  );

  return useMemo(
    () => ({
      recentlyViewed: items,
      searchAssets,
      selectAsset,
      openRecentAsset,
    }),
    [items, searchAssets, selectAsset, openRecentAsset],
  );
}
