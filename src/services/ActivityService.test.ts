import { describe, expect, it, vi } from 'vitest';

import { ApiActivityService } from './ActivityService';

describe(ApiActivityService.name, () => {
  it('should list activities sorted by recency', async () => {
    const client = {
      instances: {
        list: vi.fn().mockResolvedValue({
          items: [
            {
              instanceType: 'node',
              space: 'cdf_cdm',
              externalId: 'wo-old',
              lastUpdatedTime: 1,
              properties: {
                cdf_cdm: {
                  'CogniteActivity/v1': {
                    name: 'Older work order',
                    endTime: '2024-01-01T00:00:00.000Z',
                  },
                },
              },
            },
            {
              instanceType: 'node',
              space: 'cdf_cdm',
              externalId: 'wo-new',
              lastUpdatedTime: 2,
              properties: {
                cdf_cdm: {
                  'CogniteActivity/v1': {
                    name: 'Newer work order',
                    endTime: '2024-06-01T00:00:00.000Z',
                  },
                },
              },
            },
          ],
        }),
      },
    };
    const service = new ApiActivityService(client as never);

    const results = await service.listForAsset({ space: 'cdf_cdm', externalId: 'PUMP-101' });

    expect(results.items[0]?.identifier).toBe('wo-new');
    expect(results.items[1]?.identifier).toBe('wo-old');
  });
});
