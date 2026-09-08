import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

function Exploding(): never {
  throw new Error('render failed');
}

describe(AppErrorBoundary.name, () => {
  beforeEach(() => {
    // React logs caught render errors to the console; silence the expected noise.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when nothing throws', () => {
    render(
      <AppErrorBoundary>
        <div>App content</div>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('should render a recovery affordance instead of a blank screen', () => {
    render(
      <AppErrorBoundary>
        <Exploding />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByText(
        'Something went wrong while rendering the application. Reload to try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload application' })).toBeInTheDocument();
  });

  it('should reload the page when the recovery button is pressed', async () => {
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload,
    });

    render(
      <AppErrorBoundary>
        <Exploding />
      </AppErrorBoundary>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reload application' }));

    expect(reload).toHaveBeenCalledOnce();
  });
});
