import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeActivitySummary, makeRef } from '../../__mocks__/domainFixtures';
import { CdfAccessError } from '../../services';

import { WorkOrdersPanel } from './WorkOrdersPanel';

const defaultProps = {
  activities: [],
  isLoading: false,
  error: null,
  selectedActivityId: null,
  onSelectActivity: vi.fn(),
  onRetry: vi.fn(),
};

describe(WorkOrdersPanel.name, () => {
  it('should render a loading state while activities are being fetched', () => {
    render(<WorkOrdersPanel {...defaultProps} isLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should expose an accessible name on the work orders table', () => {
    render(<WorkOrdersPanel {...defaultProps} activities={[makeActivitySummary()]} />);

    expect(
      screen.getByRole('table', { name: 'Work orders linked to this asset' }),
    ).toBeInTheDocument();
  });

  it('should render an empty state when the asset has no activities', () => {
    render(<WorkOrdersPanel {...defaultProps} />);

    expect(screen.getByText('No linked work orders')).toBeInTheDocument();
  });

  it('should render an error state with a retry control', async () => {
    const onRetry = vi.fn();
    render(
      <WorkOrdersPanel
        {...defaultProps}
        error={new Error('Activities unavailable')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Activities unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should render a no-access state when the token lacks permission', () => {
    render(<WorkOrdersPanel {...defaultProps} error={new CdfAccessError('403 forbidden')} />);

    expect(screen.getByText('You do not have access to this data.')).toBeInTheDocument();
  });

  it('should render identifier, title, status, and date for each work order', () => {
    render(<WorkOrdersPanel {...defaultProps} activities={[makeActivitySummary()]} />);

    expect(screen.getByText('WO-5001')).toBeInTheDocument();
    expect(screen.getByText('Replace mechanical seal')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should preserve the order the activities were supplied in', () => {
    const activities = [
      makeActivitySummary({ ref: makeRef('WO-9001'), identifier: 'WO-9001', title: 'Newest' }),
      makeActivitySummary({ ref: makeRef('WO-9000'), identifier: 'WO-9000', title: 'Older' }),
    ];

    render(<WorkOrdersPanel {...defaultProps} activities={activities} />);
    const rows = screen.getAllByRole('row').slice(1);

    expect(within(rows[0]).getByText('WO-9001')).toBeInTheDocument();
    expect(within(rows[1]).getByText('WO-9000')).toBeInTheDocument();
  });

  it('should request selection of a work order when its detail is opened', async () => {
    const onSelectActivity = vi.fn();
    render(
      <WorkOrdersPanel
        {...defaultProps}
        activities={[makeActivitySummary()]}
        onSelectActivity={onSelectActivity}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'View detail' }));

    expect(onSelectActivity).toHaveBeenCalledWith('cdf_cdm:WO-5001');
  });

  it('should show full detail inline for the selected work order', () => {
    render(
      <WorkOrdersPanel
        {...defaultProps}
        activities={[makeActivitySummary()]}
        selectedActivityId="cdf_cdm:WO-5001"
      />,
    );

    expect(screen.getByText('Seal replaced during planned shutdown.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide detail' })).toBeInTheDocument();
  });

  it('should clear the selection when the detail panel is closed', async () => {
    const onSelectActivity = vi.fn();
    render(
      <WorkOrdersPanel
        {...defaultProps}
        activities={[makeActivitySummary()]}
        selectedActivityId="cdf_cdm:WO-5001"
        onSelectActivity={onSelectActivity}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onSelectActivity).toHaveBeenCalledWith(null);
  });

  it('should fall back to a placeholder when status and date are missing', () => {
    render(
      <WorkOrdersPanel
        {...defaultProps}
        activities={[makeActivitySummary({ status: undefined, date: undefined })]}
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
