import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PanelState } from './PanelState';

describe(PanelState.name, () => {
  it('should render loading state', () => {
    render(
      <PanelState status="loading" emptyTitle="" emptyDescription="">
        <div>content</div>
      </PanelState>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <PanelState status="empty" emptyTitle="Nothing here" emptyDescription="Try again">
        <div>content</div>
      </PanelState>,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('should render error state with retry', async () => {
    const onRetry = vi.fn();
    render(
      <PanelState
        status="error"
        emptyTitle=""
        emptyDescription=""
        errorMessage="Boom"
        onRetry={onRetry}
      >
        <div>content</div>
      </PanelState>,
    );

    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('should render children on success', () => {
    render(
      <PanelState status="success" emptyTitle="" emptyDescription="">
        <div>Visible content</div>
      </PanelState>,
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });
});
