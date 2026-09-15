import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Loader } from '@cognite/aura/components/loader';
import { Skeleton } from '@cognite/aura/components/skeleton';
import type { ReactNode } from 'react';

import type { PanelStatus } from './panelStatus';

type PanelStateProps = {
  status: PanelStatus;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage?: string;
  noAccessMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function PanelState({
  status,
  loadingLabel = 'Loading...',
  emptyTitle,
  emptyDescription,
  errorMessage,
  noAccessMessage = 'You do not have access to this data.',
  onRetry,
  children,
}: PanelStateProps): ReactNode {
  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader size={18} />
          <span>{loadingLabel}</span>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (status === 'no-access') {
    return (
      <EmptyState type="no-access" variant="compact">
        <EmptyStateTitle>{noAccessMessage}</EmptyStateTitle>
        <EmptyStateDescription>
          Contact your CDF administrator if you need access to this data.
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  if (status === 'error') {
    return (
      <Alert>
        <AlertDescription>{errorMessage ?? 'Failed to load data.'}</AlertDescription>
        {onRetry ? (
          <Button className="mt-3" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </Alert>
    );
  }

  if (status === 'empty') {
    return (
      <EmptyState type="no-results" variant="compact">
        <EmptyStateTitle>{emptyTitle}</EmptyStateTitle>
        <EmptyStateDescription>{emptyDescription}</EmptyStateDescription>
      </EmptyState>
    );
  }

  return children;
}
