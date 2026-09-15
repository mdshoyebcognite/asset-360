import { describe, expect, it } from 'vitest';

import { CdfAccessError, isAccessDeniedError, toServiceError } from './errors';

describe('errors', () => {
  it('should detect access denied errors', () => {
    expect(isAccessDeniedError({ status: 403 })).toBe(true);
    expect(isAccessDeniedError(new Error('access denied'))).toBe(true);
    expect(isAccessDeniedError(new Error('other'))).toBe(false);
  });

  it('should wrap unknown errors', () => {
    expect(toServiceError('boom').message).toBe('An unexpected error occurred');
    expect(toServiceError(new CdfAccessError('denied'))).toBeInstanceOf(CdfAccessError);
  });
});
