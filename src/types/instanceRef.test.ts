import { describe, expect, it } from 'vitest';

import { decodeInstanceRef, encodeInstanceRef } from './instanceRef';

describe('instanceRef', () => {
  it('should round-trip encode and decode instance refs', () => {
    const ref = { space: 'cdf_cdm', externalId: 'PUMP-101' };
    expect(decodeInstanceRef(encodeInstanceRef(ref))).toEqual(ref);
  });

  it('should return null for invalid encoded refs', () => {
    expect(decodeInstanceRef('invalid')).toBeNull();
    expect(decodeInstanceRef('')).toBeNull();
  });
});
