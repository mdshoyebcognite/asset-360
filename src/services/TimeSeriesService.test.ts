import { describe, expect, it, vi } from 'vitest';

import { CdfAccessError } from './errors';
import { ApiTimeSeriesService } from './TimeSeriesService';

const ASSET_REF = { space: 'cdf_cdm', externalId: 'PUMP-101' };
const SERIES = [{ ref: { space: 'cdf_cdm', externalId: 'ts-1' }, name: 'Temperature' }];

describe(ApiTimeSeriesService.name, () => {
  describe('listForAsset', () => {
    it('should query the CogniteTimeSeries view filtered by the asset relation', async () => {
      const list = vi.fn().mockResolvedValue({ items: [] });
      const service = new ApiTimeSeriesService({ instances: { list } } as never);

      await service.listForAsset(ASSET_REF);

      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceType: 'node',
          sources: [
            {
              source: {
                type: 'view',
                space: 'cdf_cdm',
                externalId: 'CogniteTimeSeries',
                version: 'v1',
              },
            },
          ],
          filter: {
            containsAny: {
              property: ['cdf_cdm', 'CogniteTimeSeries/v1', 'assets'],
              values: [ASSET_REF],
            },
          },
        }),
      );
    });

    it('should map name, description, and unit from view properties', async () => {
      const service = new ApiTimeSeriesService(
        {
          instances: {
            list: vi.fn().mockResolvedValue({
              items: [
                makeNode('ts-1', {
                  name: 'Temperature',
                  description: 'Bearing temperature',
                  unit: { space: 'cdf_cdm', externalId: 'degC' },
                }),
              ],
            }),
          },
        } as never,
      );

      const results = await service.listForAsset(ASSET_REF);

      expect(results).toEqual([
        {
          ref: { space: 'cdf_cdm', externalId: 'ts-1' },
          name: 'Temperature',
          description: 'Bearing temperature',
          unit: 'degC',
        },
      ]);
    });

    it('should fall back to the external id when the series has no name', async () => {
      const service = new ApiTimeSeriesService(
        {
          instances: { list: vi.fn().mockResolvedValue({ items: [makeNode('ts-2', {})] }) },
        } as never,
      );

      const results = await service.listForAsset(ASSET_REF);

      expect(results[0]?.name).toBe('ts-2');
      expect(results[0]?.unit).toBeUndefined();
    });

    it('should translate a 403 response into a no-access error', async () => {
      const denied = Object.assign(new Error('Forbidden'), { status: 403 });
      const service = new ApiTimeSeriesService(
        { instances: { list: vi.fn().mockRejectedValue(denied) } } as never,
      );

      await expect(service.listForAsset(ASSET_REF)).rejects.toBeInstanceOf(CdfAccessError);
    });

    it('should rethrow a non-OK response as an error', async () => {
      const service = new ApiTimeSeriesService(
        { instances: { list: vi.fn().mockRejectedValue(new Error('500 server error')) } } as never,
      );

      await expect(service.listForAsset(ASSET_REF)).rejects.toThrow('500 server error');
    });
  });

  describe('fetchDatapoints', () => {
    it('should skip the request entirely when no series are selected', async () => {
      const retrieve = vi.fn();
      const service = new ApiTimeSeriesService({ datapoints: { retrieve } } as never);

      await expect(service.fetchDatapoints([], new Date(), new Date())).resolves.toEqual([]);

      expect(retrieve).not.toHaveBeenCalled();
    });

    it('should request datapoints by instance id within the given window', async () => {
      const retrieve = vi.fn().mockResolvedValue([]);
      const service = new ApiTimeSeriesService({ datapoints: { retrieve } } as never);
      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-01-08T00:00:00.000Z');

      await service.fetchDatapoints(SERIES, start, end);

      expect(retrieve).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ instanceId: { space: 'cdf_cdm', externalId: 'ts-1' } }],
          start,
          end,
        }),
      );
    });

    it('should parse returned datapoints into timestamps and values', async () => {
      const service = new ApiTimeSeriesService(
        {
          datapoints: {
            retrieve: vi
              .fn()
              .mockResolvedValue([{ datapoints: [{ timestamp: 1_700_000_000_000, value: 42 }] }]),
          },
        } as never,
      );

      const results = await service.fetchDatapoints(SERIES, new Date(), new Date());

      expect(results[0]?.datapoints).toEqual([
        { timestamp: new Date(1_700_000_000_000), value: 42 },
      ]);
    });

    it('should parse datapoints whose timestamps are Date objects (as the SDK returns them)', async () => {
      // The CogniteClient converts datapoint timestamps to Date instances, not raw numbers.
      const timestamp = new Date('2024-05-01T00:00:00.000Z');
      const service = new ApiTimeSeriesService(
        {
          datapoints: {
            retrieve: vi.fn().mockResolvedValue([{ datapoints: [{ timestamp, value: 7 }] }]),
          },
        } as never,
      );

      const results = await service.fetchDatapoints(SERIES, new Date(), new Date());

      expect(results[0]?.datapoints).toEqual([{ timestamp, value: 7 }]);
    });

    it('should drop malformed datapoints rather than failing the whole series', async () => {
      const service = new ApiTimeSeriesService(
        {
          datapoints: {
            retrieve: vi.fn().mockResolvedValue([
              {
                datapoints: [
                  { timestamp: 1, value: 1 },
                  { timestamp: 'later', value: 2 },
                  { timestamp: 3 },
                  null,
                ],
              },
            ]),
          },
        } as never,
      );

      const results = await service.fetchDatapoints(SERIES, new Date(), new Date());

      expect(results[0]?.datapoints).toEqual([{ timestamp: new Date(1), value: 1 }]);
    });

    it('should return an empty series when the response has no matching entry', async () => {
      const service = new ApiTimeSeriesService(
        { datapoints: { retrieve: vi.fn().mockResolvedValue([]) } } as never,
      );

      const results = await service.fetchDatapoints(SERIES, new Date(), new Date());

      expect(results).toEqual([
        { ref: { space: 'cdf_cdm', externalId: 'ts-1' }, name: 'Temperature', datapoints: [] },
      ]);
    });

    it('should return empty datapoints when the response is not a list', async () => {
      const service = new ApiTimeSeriesService(
        { datapoints: { retrieve: vi.fn().mockResolvedValue({ items: [] }) } } as never,
      );

      const results = await service.fetchDatapoints(SERIES, new Date(), new Date());

      expect(results[0]?.datapoints).toEqual([]);
    });

    it('should translate a 403 response into a no-access error', async () => {
      const denied = Object.assign(new Error('Forbidden'), { status: 403 });
      const service = new ApiTimeSeriesService(
        { datapoints: { retrieve: vi.fn().mockRejectedValue(denied) } } as never,
      );

      await expect(
        service.fetchDatapoints(SERIES, new Date(), new Date()),
      ).rejects.toBeInstanceOf(CdfAccessError);
    });
  });

  describe('getLatestDatapointTimestamp', () => {
    it('should return null when no series are selected', async () => {
      const service = new ApiTimeSeriesService({} as never);

      await expect(service.getLatestDatapointTimestamp([])).resolves.toBeNull();
    });

    it('should return the most recent timestamp across all series', async () => {
      const service = new ApiTimeSeriesService(
        {
          datapoints: {
            retrieveLatest: vi.fn().mockResolvedValue([
              { datapoints: [{ timestamp: 1_600_000_000_000 }] },
              { datapoints: [{ timestamp: 1_700_000_000_000 }] },
            ]),
          },
        } as never,
      );

      const latest = await service.getLatestDatapointTimestamp(SERIES);

      expect(latest).toEqual(new Date(1_700_000_000_000));
    });

    it('should ignore series that have no datapoints at all', async () => {
      const service = new ApiTimeSeriesService(
        {
          datapoints: {
            retrieveLatest: vi
              .fn()
              .mockResolvedValue([
                { datapoints: [] },
                { datapoints: [{ timestamp: 1_650_000_000_000 }] },
              ]),
          },
        } as never,
      );

      const latest = await service.getLatestDatapointTimestamp(SERIES);

      expect(latest).toEqual(new Date(1_650_000_000_000));
    });

    it('should return null when every series is empty', async () => {
      const service = new ApiTimeSeriesService(
        { datapoints: { retrieveLatest: vi.fn().mockResolvedValue([{ datapoints: [] }]) } } as never,
      );

      await expect(service.getLatestDatapointTimestamp(SERIES)).resolves.toBeNull();
    });

    it('should translate a 403 response into a no-access error', async () => {
      const denied = Object.assign(new Error('Forbidden'), { status: 403 });
      const service = new ApiTimeSeriesService(
        { datapoints: { retrieveLatest: vi.fn().mockRejectedValue(denied) } } as never,
      );

      await expect(service.getLatestDatapointTimestamp(SERIES)).rejects.toBeInstanceOf(
        CdfAccessError,
      );
    });
  });
});

function makeNode(externalId: string, properties: Record<string, unknown>) {
  return {
    instanceType: 'node',
    space: 'cdf_cdm',
    externalId,
    lastUpdatedTime: 1,
    properties: { cdf_cdm: { 'CogniteTimeSeries/v1': properties } },
  };
}
