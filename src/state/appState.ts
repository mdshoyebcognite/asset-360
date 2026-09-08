export type AppPage = 'home' | 'asset';

export type AppState = {
  page: AppPage;
  assetId?: string;
};

export const DEFAULT_APP_STATE: AppState = {
  page: 'home',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAppState(initialState: string | undefined): AppState {
  if (!initialState) {
    return DEFAULT_APP_STATE;
  }

  try {
    const parsed: unknown = JSON.parse(initialState);
    if (!isRecord(parsed)) {
      return DEFAULT_APP_STATE;
    }

    const page = parsed.page;
    const assetId = parsed.assetId;

    if (page === 'home') {
      return { page: 'home' };
    }

    if (page === 'asset' && typeof assetId === 'string' && assetId.length > 0) {
      return { page: 'asset', assetId };
    }

    return DEFAULT_APP_STATE;
  } catch {
    return DEFAULT_APP_STATE;
  }
}
