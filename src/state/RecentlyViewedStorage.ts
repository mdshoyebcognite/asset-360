import type { RecentlyViewedAsset } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';
import { instanceRefKey } from '../types/instanceRef';

import { MAX_RECENTLY_VIEWED, RECENTLY_VIEWED_KEY } from './recentlyViewedConstants';

export interface RecentlyViewedStorage {
  list(): RecentlyViewedAsset[];
  add(asset: { ref: InstanceRef; tag: string; name: string }): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecentlyViewedAsset(value: unknown): value is RecentlyViewedAsset {
  if (!isRecord(value)) {
    return false;
  }
  const ref = value.ref;
  if (!isRecord(ref)) {
    return false;
  }
  return (
    typeof ref.space === 'string' &&
    typeof ref.externalId === 'string' &&
    typeof value.tag === 'string' &&
    typeof value.name === 'string' &&
    typeof value.viewedAt === 'number'
  );
}

function parseStoredItems(raw: string): RecentlyViewedAsset[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isRecentlyViewedAsset);
  } catch {
    return [];
  }
}

function createDefaultStorage(): Storage {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }

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

export class LocalRecentlyViewedStorage implements RecentlyViewedStorage {
  constructor(private readonly storage: Storage = createDefaultStorage()) {}

  list(): RecentlyViewedAsset[] {
    const raw = this.storage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) {
      return [];
    }
    return parseStoredItems(raw);
  }

  add(asset: { ref: InstanceRef; tag: string; name: string }): void {
    const existing = this.list().filter(
      (item) => instanceRefKey(item.ref) !== instanceRefKey(asset.ref),
    );
    const next: RecentlyViewedAsset[] = [
      {
        ref: asset.ref,
        tag: asset.tag,
        name: asset.name,
        viewedAt: Date.now(),
      },
      ...existing,
    ].slice(0, MAX_RECENTLY_VIEWED);

    this.storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  }
}

export function addRecentlyViewedAsset(
  storage: RecentlyViewedStorage,
  asset: { ref: InstanceRef; tag: string; name: string },
): RecentlyViewedAsset[] {
  storage.add(asset);
  return storage.list();
}
