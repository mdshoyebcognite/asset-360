import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider, useCogniteSdk } from '@cognite/app-sdk/react';
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Card, CardContent } from '@cognite/aura/components/card';
import { Loader } from '@cognite/aura/components/loader';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

import { AppErrorBoundary } from './components/AppErrorBoundary';
import { Asset360View } from './features/asset-360/Asset360View';
import { HomeView } from './features/home/HomeView';
import { AppStateProvider } from './state/AppStateProvider';
import { RecentlyViewedProvider } from './state/RecentlyViewedProvider';
import { ServicesProvider } from './state/ServicesProvider';
import { useAppState } from './state/useAppState';

type AppApi = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

type AppConnectResult = {
  api: AppApi;
  initialState?: string;
};

const loadingFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Card aria-label="Loading project" aria-live="polite">
          <CardContent>
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader size={20} />
              <span>Loading project...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </main>
);

const errorFallback = (
  <main className="min-h-screen bg-muted/50 text-foreground">
    <section className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-4 sm:p-8">
      <div className="mx-auto w-full max-w-sm">
        <Alert>
          <AlertDescription>Failed to connect to Fusion host</AlertDescription>
        </Alert>
      </div>
    </section>
  </main>
);

type RoutedContentProps = {
  api: AppApi | null;
};

function RoutedContent({ api }: RoutedContentProps) {
  const { state } = useAppState();

  if (state.page === 'asset' && state.assetId) {
    return <Asset360View assetId={state.assetId} api={api} />;
  }

  return <HomeView />;
}

type AppContentProps = {
  api: AppApi | null;
  initialState?: string;
};

function AppContent({ api, initialState }: AppContentProps) {
  useCogniteSdk();

  return (
    <AppStateProvider api={api} initialState={initialState}>
      <ServicesProvider>
        <RecentlyViewedProvider>
          <AppErrorBoundary>
            <RoutedContent api={api} />
          </AppErrorBoundary>
        </RecentlyViewedProvider>
      </ServicesProvider>
    </AppStateProvider>
  );
}

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
  connectToHostApp?: () => Promise<AppConnectResult>;
};

function App({
  deps,
  connectToHostApp = deps?.connectToHostApp ?? connectToHostAppImpl,
}: AppProps) {
  const [connection, setConnection] = useState<AppConnectResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void connectToHostApp().then((result) => {
      if (!cancelled) {
        setConnection({
          api: {
            syncInternalState: result.api.syncInternalState,
            navigateExternal: result.api.navigateExternal,
          },
          initialState: result.initialState,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [connectToHostApp]);

  return (
    <CogniteSdkProvider loadingFallback={loadingFallback} errorFallback={errorFallback} deps={deps}>
      <AppContent api={connection?.api ?? null} initialState={connection?.initialState} />
    </CogniteSdkProvider>
  );
}

export default App;
