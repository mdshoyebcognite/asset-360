import { describe, expect, it, vi } from 'vitest';

import { ApiAssetService } from './AssetService';

describe(ApiAssetService.name, () => {
  it('should retrieve and map an asset', async () => {
    const client = {
      instances: {
        retrieve: vi.fn().mockResolvedValue({
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
    const service = new ApiAssetService(client as never);

    const asset = await service.getAsset({ space: 'cdf_cdm', externalId: 'PUMP-101' });

    expect(asset?.tag).toBe('PUMP-101');
    expect(asset?.name).toBe('Pump 101');
  });

  it('should return null when asset is missing', async () => {
    const client = {
      instances: {
        retrieve: vi.fn().mockResolvedValue({ items: [] }),
      },
    };
    const service = new ApiAssetService(client as never);

    await expect(
      service.getAsset({ space: 'cdf_cdm', externalId: 'missing' }),
    ).resolves.toBeNull();
  });
});
