import type { CogniteClient, FileInfo } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearAllFileCache,
  clearFileCache,
  resolveFileDownloadConfig,
} from './fileResolution';

function makeFile(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    id: 42,
    name: 'doc.pdf',
    mimeType: 'application/pdf',
    uploaded: true,
    uploadedTime: new Date(),
    createdTime: new Date(),
    lastUpdatedTime: new Date(),
    ...overrides,
  };
}

describe(resolveFileDownloadConfig.name, () => {
  afterEach(() => {
    clearAllFileCache();
  });

  it('should return cached config without calling the API', async () => {
    const post = vi.fn().mockResolvedValue({
      data: { items: [{ downloadUrl: 'https://example.test/cached' }] },
    });
    const client = {
      project: 'proj',
      post,
      documents: { preview: { pdfTemporaryLink: vi.fn() } },
    } as unknown as CogniteClient;

    const file = makeFile();
    const first = await resolveFileDownloadConfig(client, file);
    const second = await resolveFileDownloadConfig(client, file);

    expect(first.url).toBe(second.url);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('should use extended download link for native PDFs', async () => {
    const post = vi.fn().mockResolvedValue({
      data: { items: [{ downloadUrl: 'https://example.test/dl' }] },
    });
    const client = {
      project: 'proj',
      post,
      documents: { preview: { pdfTemporaryLink: vi.fn() } },
    } as unknown as CogniteClient;

    const resolved = await resolveFileDownloadConfig(client, makeFile());

    expect(resolved.url).toBe('https://example.test/dl');
    expect(resolved.mimeType).toBe('application/pdf');
  });

  it('should use document preview for Office files', async () => {
    const pdfTemporaryLink = vi.fn().mockResolvedValue({
      temporaryLink: 'https://example.test/pdf',
    });
    const client = {
      project: 'proj',
      post: vi.fn(),
      documents: { preview: { pdfTemporaryLink } },
    } as unknown as CogniteClient;

    const resolved = await resolveFileDownloadConfig(
      client,
      makeFile({
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: 'doc.docx',
      }),
    );

    expect(pdfTemporaryLink).toHaveBeenCalledWith(42);
    expect(resolved.mimeType).toBe('application/pdf');
  });

  it('should throw for unsupported mime types', async () => {
    const client = {
      project: 'proj',
      post: vi.fn(),
      documents: { preview: { pdfTemporaryLink: vi.fn() } },
    } as unknown as CogniteClient;

    await expect(
      resolveFileDownloadConfig(
        client,
        makeFile({ mimeType: 'application/octet-stream', name: 'blob.bin' }),
      ),
    ).rejects.toThrow(/Unsupported file type/);
  });
});

describe('file cache helpers', () => {
  it('should clear a single file cache entry', async () => {
    clearAllFileCache();
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        data: { items: [{ downloadUrl: 'https://example.test/a' }] },
      })
      .mockResolvedValueOnce({
        data: { items: [{ downloadUrl: 'https://example.test/b' }] },
      });
    const client = {
      project: 'proj',
      post,
      documents: { preview: { pdfTemporaryLink: vi.fn() } },
    } as unknown as CogniteClient;

    const file = makeFile();
    await resolveFileDownloadConfig(client, file);
    clearFileCache(42, 'proj');
    await resolveFileDownloadConfig(client, file);

    expect(post).toHaveBeenCalledTimes(2);
  });
});
