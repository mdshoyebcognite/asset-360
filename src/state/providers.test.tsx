import { act, render, renderHook, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeRecentlyViewedAsset } from '../__mocks__/domainFixtures';

import { AppStateProvider } from './AppStateProvider';
import { RecentlyViewedProvider } from './RecentlyViewedProvider';
import type { RecentlyViewedStorage } from './RecentlyViewedStorage';
import { useAppState } from './useAppState';
import { useRecentlyViewed } from './useRecentlyViewed';
import { useServices } from './useServices';

describe(AppStateProvider.name, () => {
  it('should seed state from the host initialState', () => {
    const { result } = renderAppState({
      initialState: JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' }),
    });

    expect(result.current.state).toEqual({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' });
  });

  it('should default to the home page when the host supplies no state', () => {
    const { result } = renderAppState();

    expect(result.current.state).toEqual({ page: 'home' });
  });

  it('should push asset navigation back to the host', () => {
    const syncInternalState = vi.fn(() => Promise.resolve(true));
    const { result } = renderAppState({ api: { syncInternalState } });

    act(() => result.current.navigateToAsset('cdf_cdm:PUMP-101'));

    expect(result.current.state).toEqual({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' });
    expect(syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' }),
    );
  });

  it('should push home navigation back to the host', () => {
    const syncInternalState = vi.fn(() => Promise.resolve(true));
    const { result } = renderAppState({
      api: { syncInternalState },
      initialState: JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' }),
    });

    act(() => result.current.navigateHome());

    expect(result.current.state).toEqual({ page: 'home' });
    expect(syncInternalState).toHaveBeenCalledWith(JSON.stringify({ page: 'home' }));
  });

  it('should still navigate when no host api is available', () => {
    const { result } = renderAppState({ api: null });

    act(() => result.current.navigateToAsset('cdf_cdm:PUMP-101'));

    expect(result.current.state.page).toBe('asset');
  });
});

describe(RecentlyViewedProvider.name, () => {
  it('should seed the list from storage on mount', () => {
    const storage = makeStorage([makeRecentlyViewedAsset()]);
    const { result } = renderRecentlyViewed(storage);

    expect(result.current.items).toHaveLength(1);
  });

  it('should re-read storage after recording a view', () => {
    const storage = makeStorage([]);
    const { result } = renderRecentlyViewed(storage);

    act(() =>
      result.current.recordView({
        ref: { space: 'cdf_cdm', externalId: 'PUMP-101' },
        tag: 'PUMP-101',
        name: 'Feed water pump',
      }),
    );

    expect(storage.add).toHaveBeenCalledOnce();
    expect(result.current.items).toHaveLength(1);
  });
});

describe('context guards', () => {
  it('should fail loudly when useAppState is used outside its provider', () => {
    expect(() => renderHook(() => useAppState())).toThrow(
      'useAppState must be used within AppStateProvider',
    );
  });

  it('should fail loudly when useRecentlyViewed is used outside its provider', () => {
    expect(() => renderHook(() => useRecentlyViewed())).toThrow(
      'useRecentlyViewed must be used within RecentlyViewedProvider',
    );
  });

  it('should fail loudly when useServices is used outside its provider', () => {
    expect(() => renderHook(() => useServices())).toThrow(
      'useServices must be used within ServicesProvider',
    );
  });
});

describe('provider composition', () => {
  it('should render children inside both providers', () => {
    render(
      <AppStateProvider api={null}>
        <RecentlyViewedProvider storage={makeStorage([])}>
          <div>Composed content</div>
        </RecentlyViewedProvider>
      </AppStateProvider>,
    );

    expect(screen.getByText('Composed content')).toBeInTheDocument();
  });
});

function renderAppState(
  props: Partial<{
    api: { syncInternalState: (state: string) => Promise<boolean> } | null;
    initialState: string;
  }> = {},
) {
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <AppStateProvider api={props.api ?? null} initialState={props.initialState}>
      {children}
    </AppStateProvider>
  );
  return renderHook(() => useAppState(), { wrapper });
}

function renderRecentlyViewed(storage: RecentlyViewedStorage) {
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <RecentlyViewedProvider storage={storage}>{children}</RecentlyViewedProvider>
  );
  return renderHook(() => useRecentlyViewed(), { wrapper });
}

function makeStorage(initial: ReturnType<typeof makeRecentlyViewedAsset>[]) {
  let items = [...initial];
  return {
    list: vi.fn(() => items),
    add: vi.fn(() => {
      items = [makeRecentlyViewedAsset(), ...items];
    }),
  };
}
