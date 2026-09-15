import { describe, expect, it } from 'vitest';

import { parseAppState } from './appState';

describe(parseAppState.name, () => {
  it('should return home by default', () => {
    expect(parseAppState(undefined)).toEqual({ page: 'home' });
  });

  it('should parse asset page state', () => {
    expect(
      parseAppState(JSON.stringify({ page: 'asset', assetId: 'cdf_cdm:PUMP-101' })),
    ).toEqual({
      page: 'asset',
      assetId: 'cdf_cdm:PUMP-101',
    });
  });

  it('should ignore malformed state', () => {
    expect(parseAppState('{bad json')).toEqual({ page: 'home' });
  });
});
