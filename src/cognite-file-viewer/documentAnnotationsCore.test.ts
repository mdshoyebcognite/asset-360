import type { CogniteClient, EdgeDefinition } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import {
  ANNOTATION_PAGE_LIMIT,
  fetchAnnotationsForPage,
  getResourceType,
  mapEdgeToAnnotation,
  MAX_ANNOTATION_QUERY_PAGES,
  pageCacheKey,
} from './documentAnnotationsCore';

function makeEdge(overrides: Partial<EdgeDefinition> = {}): EdgeDefinition {
  return {
    instanceType: 'edge',
    version: 1,
    space: 'sp',
    externalId: 'edge-1',
    createdTime: 0,
    lastUpdatedTime: 0,
    type: { space: 'cdf_cdm', externalId: 'diagrams.AssetLink' },
    startNode: { space: 'f', externalId: 'file-1' },
    endNode: { space: 'a', externalId: 'asset-1' },
    properties: {
      cdf_cdm: {
        'CogniteDiagramAnnotation/v1': {
          status: 'Approved',
          startNodeXMin: 0.1,
          startNodeXMax: 0.2,
          startNodeYMin: 0.3,
          startNodeYMax: 0.4,
          startNodePageNumber: 2,
          startNodeText: 'P-101',
        },
      },
    },
    ...overrides,
  };
}

describe(getResourceType.name, () => {
  it('should map asset link types to asset', () => {
    expect(getResourceType('diagrams.AssetLink')).toBe('asset');
  });

  it('should return unknown for unrecognized types', () => {
    expect(getResourceType('custom.Thing')).toBe('unknown');
  });
});

describe(mapEdgeToAnnotation.name, () => {
  it('should skip rejected annotations', () => {
    const edge = makeEdge({
      properties: {
        cdf_cdm: {
          'CogniteDiagramAnnotation/v1': { status: 'Rejected' },
        },
      },
    });
    expect(mapEdgeToAnnotation(edge, 'f:file-1')).toEqual([]);
  });

  it('should map approved edges to document annotations', () => {
    const [annotation] = mapEdgeToAnnotation(makeEdge(), 'f:file-1');
    expect(annotation.page).toBe(2);
    expect(annotation.text).toBe('P-101');
    expect(annotation.resourceType).toBe('asset');
  });
});

describe(pageCacheKey.name, () => {
  it('should include page in the cache key', () => {
    expect(pageCacheKey('proj', 'sp', 'file', 1)).not.toBe(
      pageCacheKey('proj', 'sp', 'file', 2),
    );
  });
});

describe(fetchAnnotationsForPage.name, () => {
  it('should filter annotations to the requested page', async () => {
    const page1Edge = makeEdge({
      properties: {
        cdf_cdm: {
          'CogniteDiagramAnnotation/v1': {
            status: 'Approved',
            startNodeXMin: 0,
            startNodeXMax: 0.1,
            startNodeYMin: 0,
            startNodeYMax: 0.1,
            startNodePageNumber: 1,
          },
        },
      },
    });
    const page2Edge = makeEdge();

    const query = vi.fn().mockResolvedValue({
      items: { annotations: [page1Edge, page2Edge] },
      nextCursor: undefined,
    });

    const client = {
      project: 'proj',
      instances: { query },
    } as unknown as CogniteClient;

    const result = await fetchAnnotationsForPage(client, 'f', 'file-1', 2);

    expect(result.annotations).toHaveLength(1);
    expect(result.annotations[0]?.page).toBe(2);
    expect(result.capped).toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('should stop after max query pages and set capped', async () => {
    const fullPage = Array.from({ length: ANNOTATION_PAGE_LIMIT }, (_, i) =>
      makeEdge({ externalId: `e-${i}` }),
    );

    const query = vi
      .fn()
      .mockResolvedValue({
        items: { annotations: fullPage },
        nextCursor: { annotations: 'cursor-1' },
      });

    const client = {
      project: 'proj',
      instances: { query },
    } as unknown as CogniteClient;

    const result = await fetchAnnotationsForPage(client, 'f', 'file-1', 2);

    expect(query).toHaveBeenCalledTimes(MAX_ANNOTATION_QUERY_PAGES);
    expect(result.capped).toBe(true);
  });
});
