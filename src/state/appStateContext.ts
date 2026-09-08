import { createContext } from 'react';

import type { AppState } from './appState';

export type AppStateContextValue = {
  state: AppState;
  navigateHome: () => void;
  navigateToAsset: (assetId: string) => void;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);
