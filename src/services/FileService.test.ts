import { describe, expect, it, vi } from 'vitest';

import { CdfAccessError } from './errors';
import { ApiFileService } from './FileService';

const ASSET_REF = { space: 'cdf_cdm', externalId: 'PUMP-101' };
const FILE_REF = { space: 'cdf_cdm', externalId: 'file-1' };

describe(ApiFileService.name, () => {
  describe('listForAsset', () => {
    it('should query the CogniteFile view filtered by the asset relation', async () => {
      const list = vi.fn().mockResolvedValue({ items: [] });
      const service = new ApiFileService({ instances: { list } } as never);

      await service.listForAsset(ASSET_REF);

      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceType: 'node',
          sources: [
            {
              source: {
                type: 'view',
                space: 'cdf_cdm',
                externalId: 'CogniteFile',
                version: 'v1',
              },
            },
          ],
          filter: {
            containsAny: {
              property: ['cdf_cdm', 'CogniteFile/v1', 'assets'],
              values: [ASSET_REF],
            },
          },
        }),
      );
    });

    it('should map name, mime type, and last modified date', async () => {
      const service = new ApiFileService(
        {
          instances: {
            list: vi.fn().mockResolvedValue({
              items: [
                makeNode('file-1', 1_700_000_000_000, {
                  name: 'Manual.pdf',
                  mimeType: 'application/pdf',
                }),
              ],
            }),
          },
        } as never,
      );

      const results = await service.listForAsset(ASSET_REF);

      expect(results).toEqual([
        {
          ref: FILE_REF,
          name: 'Manual.pdf',
          mimeType: 'application/pdf',
          lastModified: new Date(1_700_000_000_000),
        },
      ]);
    });

    it('should sort files by most recently modified first', async () => {
      const service = new ApiFileService(
        {
          instances: {
            list: vi.fn().mockResolvedValue({
              items: [
                makeNode('older', 1_600_000_000_000, { name: 'Older.pdf' }),
                makeNode('newer', 1_700_000_000_000, { name: 'Newer.pdf' }),
              ],
            }),
          },
        } as never,
      );

      const results = await service.listForAsset(ASSET_REF);

      expect(results.map((file) => file.name)).toEqual(['Newer.pdf', 'Older.pdf']);
    });

    it('should fall back to the external id when the file has no name', async () => {
      const service = new ApiFileService(
        {
          instances: { list: vi.fn().mockResolvedValue({ items: [makeNode('file-9', 1, {})] }) },
        } as never,
      );

      const results = await service.listForAsset(ASSET_REF);

      expect(results[0]?.name).toBe('file-9');
      expect(results[0]?.mimeType).toBeUndefined();
    });

    it('should translate a 403 response into a no-access error', async () => {
      const denied = Object.assign(new Error('Forbidden'), { status: 403 });
      const service = new ApiFileService(
        { instances: { list: vi.fn().mockRejectedValue(denied) } } as never,
      );

      await expect(service.listForAsset(ASSET_REF)).rejects.toBeInstanceOf(CdfAccessError);
    });

    it('should rethrow a non-OK response as an error', async () => {
      const service = new ApiFileService(
        { instances: { list: vi.fn().mockRejectedValue(new Error('500 server error')) } } as never,
      );

      await expect(service.listForAsset(ASSET_REF)).rejects.toThrow('500 server error');
    });
  });

  describe('getDownloadUrl', () => {
    it('should request the download link by instance id', async () => {
      const getDownloadUrls = vi
        .fn()
        .mockResolvedValue([{ downloadUrl: 'https://example.test/file' }]);
      const service = new ApiFileService({ files: { getDownloadUrls } } as never);

      await service.getDownloadUrl(FILE_REF);

      expect(getDownloadUrls).toHaveBeenCalledWith([{ instanceId: FILE_REF }]);
    });

    it('should resolve the download url', async () => {
      const service = new ApiFileService(
        {
          files: {
            getDownloadUrls: vi
              .fn()
              .mockResolvedValue([{ downloadUrl: 'https://example.test/file' }]),
          },
        } as never,
      );

      await expect(service.getDownloadUrl(FILE_REF)).resolves.toBe('https://example.test/file');
    });

    it('should throw when the response carries no link', async () => {
      const service = new ApiFileService(
        { files: { getDownloadUrls: vi.fn().mockResolvedValue([]) } } as never,
      );

      await expect(service.getDownloadUrl(FILE_REF)).rejects.toThrow(
        'Download URL not available for this file',
      );
    });

    it('should throw when the link entry has no url', async () => {
      const service = new ApiFileService(
        { files: { getDownloadUrls: vi.fn().mockResolvedValue([{}]) } } as never,
      );

      await expect(service.getDownloadUrl(FILE_REF)).rejects.toThrow(
        'Download URL not available for this file',
      );
    });

    it('should translate a 403 response into a no-access error', async () => {
      const denied = Object.assign(new Error('Forbidden'), { status: 403 });
      const service = new ApiFileService(
        { files: { getDownloadUrls: vi.fn().mockRejectedValue(denied) } } as never,
      );

      await expect(service.getDownloadUrl(FILE_REF)).rejects.toBeInstanceOf(CdfAccessError);
    });
  });
});

function makeNode(externalId: string, lastUpdatedTime: number, properties: Record<string, unknown>) {
  return {
    instanceType: 'node',
    space: 'cdf_cdm',
    externalId,
    lastUpdatedTime,
    properties: { cdf_cdm: { 'CogniteFile/v1': properties } },
  };
}
