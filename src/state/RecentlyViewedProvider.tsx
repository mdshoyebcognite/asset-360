import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { RecentlyViewedAsset } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

import { RecentlyViewedContext } from './recentlyViewedContext';
import {
  LocalRecentlyViewedStorage,
  type RecentlyViewedStorage,
} from './RecentlyViewedStorage';

type RecentlyViewedProviderProps = {
  children: ReactNode;
  storage?: RecentlyViewedStorage;
};

export function RecentlyViewedProvider({
  children,
  storage: storageOverride,
}: RecentlyViewedProviderProps) {
  const storage = useMemo(
    () => storageOverride ?? new LocalRecentlyViewedStorage(),
    [storageOverride],
  );
  const [items, setItems] = useState<RecentlyViewedAsset[]>(() => storage.list());

  const recordView = useCallback(
    (asset: { ref: InstanceRef; tag: string; name: string }) => {
      storage.add(asset);
      setItems(storage.list());
    },
    [storage],
  );

  const value = useMemo(
    () => ({
      items,
      recordView,
    }),
    [items, recordView],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  );
}
