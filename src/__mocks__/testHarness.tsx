import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import type { QueryClient} from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { Services } from '../services';
import { AppStateContext, type AppStateContextValue } from '../state/appStateContext';
import {
  RecentlyViewedContext,
  type RecentlyViewedContextValue,
} from '../state/recentlyViewedContext';
import { ServicesContext } from '../state/servicesContext';

import {
  makeAppState,
  makeQueryClient,
  makeRecentlyViewed,
  makeSdkDeps,
  makeServices,
} from './contextFixtures';

type HarnessProps = {
  children: ReactNode;
  services?: Services;
  appState?: AppStateContextValue;
  recentlyViewed?: RecentlyViewedContextValue;
  queryClient?: QueryClient;
  /** Wrap in CogniteSdkProvider; only needed by components calling useCogniteSdk. */
  withSdk?: boolean;
};

export function Harness({
  children,
  services = makeServices(),
  appState = makeAppState(),
  recentlyViewed = makeRecentlyViewed(),
  queryClient = makeQueryClient(),
  withSdk = false,
}: HarnessProps) {
  const inner = (
    <AppStateContext.Provider value={appState}>
      <ServicesContext.Provider value={services}>
        <RecentlyViewedContext.Provider value={recentlyViewed}>
          {children}
        </RecentlyViewedContext.Provider>
      </ServicesContext.Provider>
    </AppStateContext.Provider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {withSdk ? <CogniteSdkProvider deps={makeSdkDeps()}>{inner}</CogniteSdkProvider> : inner}
    </QueryClientProvider>
  );
}
