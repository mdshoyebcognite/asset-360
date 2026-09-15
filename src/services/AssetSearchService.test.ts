import { describe, expect, it, vi } from 'vitest';

import { ApiAssetSearchService } from './AssetSearchService';

describe(ApiAssetSearchService.name, () => {
  it('should return empty array for blank query', async () => {
    const client = {
      instances: {
        search: vi.fn(),
      },
    };
    const service = new ApiAssetSearchService(client as never);

    await expect(service.searchAssets('   ')).resolves.toEqual([]);
    expect(client.instances.search).not.toHaveBeenCalled();
  });

  it('should map search results to asset summaries', async () => {
    const client = {
      instances: {
        search: vi.fn().mockResolvedValue({
          items: [
            {
              instanceType: 'node',
              space: 'cdf_cdm',
              externalId: 'PUMP-101',
              lastUpdatedTime: 1,
              properties: {
                cdf_cdm: {
                  'CogniteAsset/v1': {
                    name: 'Pump 101',
                    description: 'Feed pump',
                  },
                },
              },
            },
          ],
        }),
      },
    };
    const service = new ApiAssetSearchService(client as never);

    const results = await service.searchAssets('pump');

    expect(client.instances.search).toHaveBeenCalled();
    expect(results).toEqual([
      {
        ref: { space: 'cdf_cdm', externalId: 'PUMP-101' },
        tag: 'PUMP-101',
        name: 'Pump 101',
        description: 'Feed pump',
        parentName: undefined,
        typeName: undefined,
      },
    ]);
  });

  it('should throw on failed search', async () => {
    const client = {
      instances: {
        search: vi.fn().mockRejectedValue(new Error('search failed')),
      },
    };
    const service = new ApiAssetSearchService(client as never);

    await expect(service.searchAssets('pump')).rejects.toThrow('search failed');
  });
});
