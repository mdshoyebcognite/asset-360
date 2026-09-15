import type { CogniteClient } from '@cognite/sdk';
import { useState, useEffect, useRef } from 'react';

import {
  fetchAnnotationsForPage,
  pageCacheKey,
} from './documentAnnotationsCore';
import type { DocumentAnnotation, UseDocumentAnnotationsResult } from './types';

const STALE_TIME = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 50;

interface CacheEntry {
  data: DocumentAnnotation[];
  capped: boolean;
  timestamp: number;
}

const annotationCache = new Map<string, CacheEntry>();

function evictStaleAnnotations(): void {
  const now = Date.now();
  for (const [key, entry] of annotationCache) {
    if (now - entry.timestamp > STALE_TIME) {
      annotationCache.delete(key);
    }
  }
  if (annotationCache.size > MAX_CACHE_SIZE) {
    for (const key of Array.from(annotationCache.keys()).slice(
      0,
      annotationCache.size - MAX_CACHE_SIZE,
    )) {
      annotationCache.delete(key);
    }
  }
}

export function clearAnnotationCache(): void {
  annotationCache.clear();
}

interface AnnotationState {
  annotations: DocumentAnnotation[];
  capped: boolean;
  isLoading: boolean;
  error: Error | null;
}

const INITIAL_STATE: AnnotationState = {
  annotations: [],
  capped: false,
  isLoading: false,
  error: null,
};

export function useDocumentAnnotations(
  client: CogniteClient | undefined,
  instanceId: { space: string; externalId: string } | undefined,
  currentPage: number = 1,
  options?: { enabled?: boolean },
): UseDocumentAnnotationsResult {
  const enabled = options?.enabled ?? true;
  const [state, setState] = useState<AnnotationState>(INITIAL_STATE);
  const cancelRef = useRef(0);

  const space = instanceId?.space;
  const extId = instanceId?.externalId;
  const project = client?.project;

  useEffect(() => {
    if (!enabled || !client || !space || !extId || !project) {
      setState(INITIAL_STATE);
      return;
    }

    const id = ++cancelRef.current;
    const cancelled = () => id !== cancelRef.current;

    const key = pageCacheKey(project, space, extId, currentPage);
    const cached = annotationCache.get(key);
    if (cached && Date.now() - cached.timestamp < STALE_TIME) {
      setState({
        annotations: cached.data,
        capped: cached.capped,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    fetchAnnotationsForPage(client, space, extId, currentPage)
      .then(({ annotations, capped }) => {
        if (cancelled()) {
          return;
        }
        annotationCache.set(key, {
          data: annotations,
          capped,
          timestamp: Date.now(),
        });
        evictStaleAnnotations();
        setState({
          annotations,
          capped,
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled()) {
          return;
        }
        setState({
          annotations: [],
          capped: false,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, [client, project, space, extId, currentPage, enabled]);

  return {
    annotations: state.annotations,
    isLoading: state.isLoading,
    error: state.error,
    annotationsCapped: state.capped,
  };
}
