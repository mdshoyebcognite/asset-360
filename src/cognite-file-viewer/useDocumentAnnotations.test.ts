import type { CogniteClient } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as core from './documentAnnotationsCore';
import {
  clearAnnotationCache,
  useDocumentAnnotations,
} from './useDocumentAnnotations';

describe(useDocumentAnnotations.name, () => {
  afterEach(() => {
    clearAnnotationCache();
    vi.restoreAllMocks();
  });

  it('should return empty state when disabled', () => {
    const { result } = renderHook(() =>
      useDocumentAnnotations(undefined, undefined, 1, { enabled: false }),
    );

    expect(result.current.annotations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should load annotations for the current page', async () => {
    vi.spyOn(core, 'fetchAnnotationsForPage').mockResolvedValue({
      annotations: [
        {
          id: 'a1',
          x: 0,
          y: 0,
          width: 0.1,
          height: 0.1,
          page: 1,
          resourceType: 'asset',
          annotationType: 'diagrams.AssetLink',
        },
      ],
      capped: false,
    });

    const client = { project: 'proj' } as CogniteClient;
    const { result } = renderHook(() =>
      useDocumentAnnotations(client, { space: 'sp', externalId: 'file-1' }, 1),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.annotations).toHaveLength(1);
    expect(core.fetchAnnotationsForPage).toHaveBeenCalledWith(
      client,
      'sp',
      'file-1',
      1,
    );
  });

  it('should refetch when the page changes', async () => {
    const fetchSpy = vi.spyOn(core, 'fetchAnnotationsForPage').mockResolvedValue({
      annotations: [],
      capped: false,
    });

    const client = { project: 'proj' } as CogniteClient;
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useDocumentAnnotations(client, { space: 'sp', externalId: 'file-1' }, page),
      { initialProps: { page: 1 } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    rerender({ page: 2 });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenLastCalledWith(client, 'sp', 'file-1', 2),
    );
  });

  it('should surface capped flag from fetch result', async () => {
    vi.spyOn(core, 'fetchAnnotationsForPage').mockResolvedValue({
      annotations: [],
      capped: true,
    });

    const client = { project: 'proj' } as CogniteClient;
    const { result } = renderHook(() =>
      useDocumentAnnotations(client, { space: 'sp', externalId: 'file-1' }, 1),
    );

    await waitFor(() => expect(result.current.annotationsCapped).toBe(true));
  });
});
