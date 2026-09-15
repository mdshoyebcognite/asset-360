import type { CogniteClient, EdgeDefinition } from '@cognite/sdk';

import { cdfTaskRunner } from '../lib/cdfTaskRunner';

import type { AnnotationResourceType, DocumentAnnotation } from './types';

export const CDM_SPACE = 'cdf_cdm';
export const CDM_VERSION = 'v1';
export const DIAGRAM_ANNOTATION_VIEW = 'CogniteDiagramAnnotation';

/** Max edges requested per instances.query call. */
export const ANNOTATION_PAGE_LIMIT = 200;

/** Max cursor pages per visible document page. */
export const MAX_ANNOTATION_QUERY_PAGES = 5;

const PROP_PATH = `${DIAGRAM_ANNOTATION_VIEW}/${CDM_VERSION}`;

export interface CdmAnnotationProps {
  status?: string;
  startNodeText?: string;
  startNodeYMax?: number;
  startNodeYMin?: number;
  startNodeXMax?: number;
  startNodeXMin?: number;
  startNodePageNumber?: number;
}

export type PageAnnotationFetchResult = {
  annotations: DocumentAnnotation[];
  capped: boolean;
};

export function getResourceType(annotationType: string): AnnotationResourceType {
  const lower = annotationType.toLowerCase();
  if (lower.includes('asset')) {
    return 'asset';
  }
  if (lower.includes('file')) {
    return 'file';
  }
  if (lower.includes('timeseries') || lower.includes('time_series')) {
    return 'timeSeries';
  }
  if (lower.includes('sequence')) {
    return 'sequence';
  }
  if (lower.includes('event')) {
    return 'event';
  }
  if (lower.includes('diagram')) {
    return 'diagram';
  }
  return 'unknown';
}

export function mapEdgeToAnnotation(
  edge: EdgeDefinition,
  containerId: string,
): DocumentAnnotation[] {
  const props: CdmAnnotationProps | undefined = edge.properties?.[CDM_SPACE]?.[PROP_PATH];
  if (!props || props.status === 'Rejected') {
    return [];
  }

  const xMin = Number(props.startNodeXMin ?? 0);
  const xMax = Number(props.startNodeXMax ?? 0);
  const yMin = Number(props.startNodeYMin ?? 0);
  const yMax = Number(props.startNodeYMax ?? 0);
  const annotationType = edge.type?.externalId ?? 'diagrams.AssetLink';

  const annotation: DocumentAnnotation = {
    id: `${containerId}-${edge.space}-${edge.externalId}`,
    x: Math.min(xMin, xMax),
    y: Math.min(yMin, yMax),
    width: Math.abs(xMax - xMin),
    height: Math.abs(yMax - yMin),
    page: Number(props.startNodePageNumber ?? 1),
    resourceType: getResourceType(annotationType),
    linkedResource: edge.endNode
      ? { space: edge.endNode.space, externalId: edge.endNode.externalId }
      : undefined,
    text: props.startNodeText ?? undefined,
    annotationType,
  };

  return [annotation];
}

export function pageCacheKey(
  project: string,
  space: string,
  externalId: string,
  page: number,
): string {
  return JSON.stringify([project, space, externalId, page]);
}

export async function fetchAnnotationsForPage(
  client: CogniteClient,
  space: string,
  externalId: string,
  page: number,
): Promise<PageAnnotationFetchResult> {
  const containerId = `${space}:${externalId}`;
  const annotations: DocumentAnnotation[] = [];
  let cursor: string | undefined;
  let capped = false;

  for (let pageIndex = 0; pageIndex < MAX_ANNOTATION_QUERY_PAGES; pageIndex += 1) {
    const response = await cdfTaskRunner.schedule(() =>
      client.instances.query({
        with: {
          files: {
            nodes: {
              filter: {
                and: [
                  {
                    equals: {
                      property: ['node', 'externalId'],
                      value: externalId,
                    },
                  },
                  {
                    equals: {
                      property: ['node', 'space'],
                      value: space,
                    },
                  },
                ],
              },
            },
          },
          annotations: {
            edges: {
              from: 'files',
              direction: 'outwards',
            },
            limit: ANNOTATION_PAGE_LIMIT,
          },
        },
        select: {
          annotations: {
            sources: [
              {
                source: {
                  externalId: DIAGRAM_ANNOTATION_VIEW,
                  space: CDM_SPACE,
                  type: 'view' as const,
                  version: CDM_VERSION,
                },
                properties: [
                  'status',
                  'startNodeText',
                  'startNodeYMax',
                  'startNodeYMin',
                  'startNodeXMax',
                  'startNodeXMin',
                  'startNodePageNumber',
                ],
              },
            ],
            limit: ANNOTATION_PAGE_LIMIT,
          },
        },
        cursors: cursor ? { annotations: cursor } : undefined,
      }),
    );

    const edges = (response.items?.annotations ?? []).filter(
      (item) => item.instanceType === 'edge',
    );

    for (const edge of edges) {
      for (const annotation of mapEdgeToAnnotation(edge, containerId)) {
        if (annotation.page === page) {
          annotations.push(annotation);
        }
      }
    }

    const hasMore = edges.length >= ANNOTATION_PAGE_LIMIT && response.nextCursor?.annotations;
    if (!hasMore) {
      return { annotations, capped };
    }

    cursor = response.nextCursor?.annotations;
    if (pageIndex === MAX_ANNOTATION_QUERY_PAGES - 1) {
      capped = true;
    }
  }

  return { annotations, capped: true };
}
