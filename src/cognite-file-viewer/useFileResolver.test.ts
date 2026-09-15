import type { CogniteClient } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as fileResolution from './fileResolution';
import { useFileResolver } from './useFileResolver';

describe(useFileResolver.name, () => {
  it('should resolve url sources without a client', async () => {
    const { result } = renderHook(() =>
      useFileResolver({
        type: 'url',
        url: 'https://example.test/image.png',
        mimeType: 'image/png',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toBe('https://example.test/image.png');
    expect(result.current.mimeType).toBe('image/png');
  });

  it('should error when client is missing for instanceId sources', async () => {
    const { result } = renderHook(() =>
      useFileResolver({
        type: 'instanceId',
        space: 'sp',
        externalId: 'file-1',
      }),
    );

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error?.message).toMatch(/CogniteClient is required/);
  });

  it('should resolve instanceId via files.retrieve and download config', async () => {
    vi.spyOn(fileResolution, 'resolveFileDownloadConfig').mockResolvedValue({
      url: 'https://example.test/dl',
      mimeType: 'application/pdf',
    });

    const retrieve = vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'a.pdf',
        mimeType: 'application/pdf',
        instanceId: { space: 'sp', externalId: 'file-1' },
      },
    ]);

    const client = {
      files: { retrieve },
    } as unknown as CogniteClient;

    const { result } = renderHook(() =>
      useFileResolver(
        { type: 'instanceId', space: 'sp', externalId: 'file-1' },
        client,
      ),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toBe('https://example.test/dl');
    expect(retrieve).toHaveBeenCalled();
  });
});
