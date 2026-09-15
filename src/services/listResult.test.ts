import { describe, expect, it } from 'vitest';

import { listResultFromResponse, RELATED_LIST_LIMIT } from './listResult';

describe(listResultFromResponse.name, () => {
  it('should mark truncated when the item count reaches the limit', () => {
    const items = Array.from({ length: RELATED_LIST_LIMIT }, (_, index) => index);
    expect(listResultFromResponse(items, RELATED_LIST_LIMIT).truncated).toBe(true);
  });

  it('should not mark truncated below the limit', () => {
    expect(listResultFromResponse([1, 2], RELATED_LIST_LIMIT).truncated).toBe(false);
  });
});
