import { createContext } from 'react';

import type { RecentlyViewedAsset } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

export type RecentlyViewedContextValue = {
  items: RecentlyViewedAsset[];
  recordView: (asset: { ref: InstanceRef; tag: string; name: string }) => void;
};

export const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);
