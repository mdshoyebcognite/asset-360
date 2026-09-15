import type { HostAppAPI } from '@cognite/app-sdk';
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AppState } from './appState';
import { parseAppState } from './appState';
import { AppStateContext } from './appStateContext';

type AppStateProviderProps = {
  api: Pick<HostAppAPI, 'syncInternalState'> | null;
  initialState?: string;
  children: ReactNode;
};

export function AppStateProvider({ api, initialState, children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(() => parseAppState(initialState));

  const syncState = useCallback(
    (next: AppState) => {
      setState(next);
      void api?.syncInternalState(JSON.stringify(next));
    },
    [api],
  );

  const navigateHome = useCallback(() => {
    syncState({ page: 'home' });
  }, [syncState]);

  const navigateToAsset = useCallback(
    (assetId: string) => {
      syncState({ page: 'asset', assetId });
    },
    [syncState],
  );

  const value = useMemo(
    () => ({
      state,
      navigateHome,
      navigateToAsset,
    }),
    [state, navigateHome, navigateToAsset],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
