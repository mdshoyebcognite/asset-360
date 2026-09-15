import { describe, expect, it } from 'vitest';

import { CdfAccessError } from '../services';

import { resolvePanelStatus } from './panelStatus';

describe(resolvePanelStatus.name, () => {
  it('should return loading when loading', () => {
    expect(resolvePanelStatus({ isLoading: true, error: null, isEmpty: false })).toBe('loading');
  });

  it('should return no-access for CdfAccessError', () => {
    expect(
      resolvePanelStatus({
        isLoading: false,
        error: new CdfAccessError('denied'),
        isEmpty: false,
      }),
    ).toBe('no-access');
  });

  it('should return empty when there is no data', () => {
    expect(resolvePanelStatus({ isLoading: false, error: null, isEmpty: true })).toBe('empty');
  });
});
