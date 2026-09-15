import type { HostAppAPI, ConnectToHostAppResult } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

type AppApi = Pick<HostAppAPI, 'syncInternalState' | 'navigateExternal'>;

function makeApi(): AppApi {
  return {
    syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
    navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
  };
}

function makeConnectedFn(api: AppApi = makeApi()) {
  return vi.fn(() => Promise.resolve({ api }));
}

function makeDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
          syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
          navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function makeLoadingDeps(): AppDeps {
  return {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() => new Promise<ConnectToHostAppResult>(() => undefined)),
    createClient: vi.fn<AppDeps['createClient']>((config) => new CogniteClient(config)),
  };
}

function renderApp(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show host connection error when connectToHostApp rejects', async () => {
    renderApp(
      <App
        deps={makeDeps()}
        connectToHostApp={() => Promise.reject(new Error('host down'))}
      />,
    );

    expect(await screen.findByText('Failed to connect to Fusion host')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderApp(<App deps={makeLoadingDeps()} connectToHostApp={() => new Promise<never>(() => undefined)} />);
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders home view with search and recently viewed sections', async () => {
    renderApp(<App deps={makeDeps()} connectToHostApp={makeConnectedFn()} />);
    await waitFor(() =>
      expect(screen.getByText('Asset 360 Investigation Workspace')).toBeInTheDocument(),
    );
    expect(screen.getByText('Search assets')).toBeInTheDocument();
    expect(screen.getByText('Recently viewed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by tag, name, or description...')).toBeInTheDocument();
  });

  it('syncs internal state when navigating to an asset page', async () => {
    const api = makeApi();
    renderApp(
      <App
        deps={makeDeps()}
        connectToHostApp={() =>
          Promise.resolve({
            api,
            initialState: JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:test-asset' }),
          })
        }
      />,
    );

    await waitFor(() => expect(screen.getByText('Back to search')).toBeInTheDocument());
  });

  it('restores home page from initial state', async () => {
    renderApp(
      <App
        deps={makeDeps()}
        connectToHostApp={() =>
          Promise.resolve({
            api: makeApi(),
            initialState: JSON.stringify({ page: 'home' }),
          })
        }
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Asset 360 Investigation Workspace')).toBeInTheDocument(),
    );
  });

  it('navigates home from asset page', async () => {
    const api = makeApi();
    renderApp(
      <App
        deps={makeDeps()}
        connectToHostApp={() =>
          Promise.resolve({
            api,
            initialState: JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:test-asset' }),
          })
        }
      />,
    );

    await waitFor(() => expect(screen.getByText('Back to search')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Back to search'));

    expect(api.syncInternalState).toHaveBeenCalledWith(JSON.stringify({ page: 'home' }));
  });
});
