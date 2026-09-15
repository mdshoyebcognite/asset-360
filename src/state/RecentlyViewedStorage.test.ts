import { describe, expect, it, beforeEach, vi } from 'vitest';

import { RECENTLY_VIEWED_KEY } from './recentlyViewedConstants';
import { addRecentlyViewedAsset, LocalRecentlyViewedStorage } from './RecentlyViewedStorage';

describe(LocalRecentlyViewedStorage.name, () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeMemoryStorage();
  });

  it('should cap recently viewed assets at 10', () => {
    const recentlyViewed = new LocalRecentlyViewedStorage(storage);

    for (let index = 0; index < 12; index += 1) {
      recentlyViewed.add({
        ref: { space: 'cdf_cdm', externalId: `asset-${index}` },
        tag: `asset-${index}`,
        name: `Asset ${index}`,
      });
    }

    expect(recentlyViewed.list()).toHaveLength(10);
    expect(recentlyViewed.list()[0]?.tag).toBe('asset-11');
  });

  it('should dedupe assets when re-opened', () => {
    const recentlyViewed = new LocalRecentlyViewedStorage(storage);

    recentlyViewed.add(PUMP_101);
    recentlyViewed.add(PUMP_101);

    expect(recentlyViewed.list()).toHaveLength(1);
  });

  it('should move a re-opened asset back to the front of the list', () => {
    const recentlyViewed = new LocalRecentlyViewedStorage(storage);
    const valve = {
      ref: { space: 'cdf_cdm', externalId: 'VALVE-202' },
      tag: 'VALVE-202',
      name: 'Discharge valve',
    };

    recentlyViewed.add(PUMP_101);
    recentlyViewed.add(valve);
    recentlyViewed.add(PUMP_101);

    expect(recentlyViewed.list().map((item) => item.tag)).toEqual(['PUMP-101', 'VALVE-202']);
  });

  it('should record when each asset was viewed', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const recentlyViewed = new LocalRecentlyViewedStorage(storage);

    recentlyViewed.add(PUMP_101);

    expect(recentlyViewed.list()[0]?.viewedAt).toBe(1_700_000_000_000);
    vi.restoreAllMocks();
  });

  it('should return an empty list when nothing has been stored', () => {
    expect(new LocalRecentlyViewedStorage(storage).list()).toEqual([]);
  });

  it('should return an empty list when the stored value is not valid JSON', () => {
    storage.setItem(RECENTLY_VIEWED_KEY, 'not json');

    expect(new LocalRecentlyViewedStorage(storage).list()).toEqual([]);
  });

  it('should return an empty list when the stored value is not an array', () => {
    storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify({ tag: 'PUMP-101' }));

    expect(new LocalRecentlyViewedStorage(storage).list()).toEqual([]);
  });

  it('should drop stored entries that do not match the expected shape', () => {
    storage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify([
        { ...PUMP_101, viewedAt: 1 },
        { ...PUMP_101, viewedAt: 'yesterday' },
        { ref: 'not-a-ref', tag: 'X', name: 'X', viewedAt: 1 },
        { ref: { space: 1, externalId: 2 }, tag: 'X', name: 'X', viewedAt: 1 },
        { ref: PUMP_101.ref, tag: 5, name: 'X', viewedAt: 1 },
        null,
      ]),
    );

    const items = new LocalRecentlyViewedStorage(storage).list();

    expect(items).toHaveLength(1);
    expect(items[0]?.tag).toBe('PUMP-101');
  });

  it('should fall back to an in-memory store when localStorage is unavailable', () => {
    const recentlyViewed = new LocalRecentlyViewedStorage();

    recentlyViewed.add(PUMP_101);

    expect(recentlyViewed.list()[0]?.tag).toBe('PUMP-101');
  });
});

describe(addRecentlyViewedAsset.name, () => {
  it('should add the asset and return the refreshed list', () => {
    const recentlyViewed = new LocalRecentlyViewedStorage(makeMemoryStorage());

    const items = addRecentlyViewedAsset(recentlyViewed, PUMP_101);

    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Pump 101');
  });
});

const PUMP_101 = {
  ref: { space: 'cdf_cdm', externalId: 'PUMP-101' },
  tag: 'PUMP-101',
  name: 'Pump 101',
};

function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: () => null,
    length: 0,
  };
}
