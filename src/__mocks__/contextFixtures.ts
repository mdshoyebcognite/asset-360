import type { HostAppAPI } from '@cognite/app-sdk';
import type { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { vi } from 'vitest';

import type { Services } from '../services';
import type { AppStateContextValue } from '../state/appStateContext';
import type { RecentlyViewedContextValue } from '../state/recentlyViewedContext';

export type SdkDeps = NonNullable<ComponentProps<typeof CogniteSdkProvider>['deps']>;

export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/**
 * Every service method rejects by default, so a test that forgets to stub a
 * call fails loudly instead of silently resolving to undefined.
 */
export function makeServices(overrides: Partial<Services> = {}): Services {
  const notStubbed = (name: string) => () =>
    Promise.reject(new Error(`${name} was not stubbed for this test`));

  return {
    assetSearchService: { searchAssets: vi.fn(notStubbed('searchAssets')) },
    assetService: { getAsset: vi.fn(notStubbed('getAsset')) },
    timeSeriesService: {
      listForAsset: vi.fn(notStubbed('timeSeries.listForAsset')),
      fetchDatapoints: vi.fn(notStubbed('fetchDatapoints')),
      getLatestDatapointTimestamp: vi.fn(notStubbed('getLatestDatapointTimestamp')),
    },
    activityService: { listForAsset: vi.fn(notStubbed('activity.listForAsset')) },
    fileService: {
      listForAsset: vi.fn(notStubbed('file.listForAsset')),
      getDownloadUrl: vi.fn(notStubbed('getDownloadUrl')),
    },
    ...overrides,
  };
}

export function makeAppState(overrides: Partial<AppStateContextValue> = {}): AppStateContextValue {
  return {
    state: { page: 'home' },
    navigateHome: vi.fn(),
    navigateToAsset: vi.fn(),
    ...overrides,
  };
}

export function makeRecentlyViewed(
  overrides: Partial<RecentlyViewedContextValue> = {},
): RecentlyViewedContextValue {
  return {
    items: [],
    recordView: vi.fn(),
    ...overrides,
  };
}

export function makeSdkDeps(): SdkDeps {
  return {
    connectToHostApp: vi.fn<SdkDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api: {
          getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('publicdatacdm')),
          getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
          getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
          getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
          syncInternalState: vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true)),
          navigateExternal: vi.fn<HostAppAPI['navigateExternal']>(() => Promise.resolve(true)),
        } as Partial<HostAppAPI> as HostAppAPI,
      }),
    ),
    createClient: vi.fn<SdkDeps['createClient']>((config) => new CogniteClient(config)),
  };
}
