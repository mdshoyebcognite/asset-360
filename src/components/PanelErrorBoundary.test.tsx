import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PanelErrorBoundary } from './PanelErrorBoundary';

function Exploding(): never {
  throw new Error('panel failed');
}

describe(PanelErrorBoundary.name, () => {
  beforeEach(() => {
    // React logs caught render errors to the console; silence the expected noise.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when nothing throws', () => {
    render(
      <PanelErrorBoundary panelName="documents">
        <div>Panel content</div>
      </PanelErrorBoundary>,
    );

    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('should name the failing panel so other panels stay identifiable', () => {
    render(
      <PanelErrorBoundary panelName="time series">
        <Exploding />
      </PanelErrorBoundary>,
    );

    expect(screen.getByText('Failed to render the time series panel.')).toBeInTheDocument();
  });

  it('should call onRetry and clear the error when retry is pressed', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <PanelErrorBoundary panelName="work orders" onRetry={onRetry}>
        <Exploding />
      </PanelErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    rerender(
      <PanelErrorBoundary panelName="work orders" onRetry={onRetry}>
        <div>Recovered content</div>
      </PanelErrorBoundary>,
    );

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('should recover when new children arrive after a failure', () => {
    const { rerender } = render(
      <PanelErrorBoundary panelName="documents">
        <Exploding />
      </PanelErrorBoundary>,
    );
    expect(screen.getByText('Failed to render the documents panel.')).toBeInTheDocument();

    rerender(
      <PanelErrorBoundary panelName="documents">
        <div>Fresh content</div>
      </PanelErrorBoundary>,
    );

    expect(screen.getByText('Fresh content')).toBeInTheDocument();
  });
});
