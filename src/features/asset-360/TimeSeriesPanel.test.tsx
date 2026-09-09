import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  makeRef,
  makeTimeSeriesDatapoints,
  makeTimeSeriesSummary,
} from '../../__mocks__/domainFixtures';
import { Harness } from '../../__mocks__/testHarness';
import { CdfAccessError } from '../../services';

import { TimeSeriesPanel } from './TimeSeriesPanel';

type TimeSeriesPanelProps = ComponentProps<typeof TimeSeriesPanel>;

const WINDOW = {
  start: new Date('2024-04-24T00:00:00.000Z'),
  end: new Date('2024-05-01T00:00:00.000Z'),
};

function makeProps(overrides: Partial<TimeSeriesPanelProps> = {}): TimeSeriesPanelProps {
  return {
    timeSeries: [],
    isLoading: false,
    error: null,
    onRetry: vi.fn(),
    fetchChartData: vi.fn<TimeSeriesPanelProps['fetchChartData']>(() =>
      Promise.resolve([makeTimeSeriesDatapoints()]),
    ),
    resolveChartWindow: vi.fn<TimeSeriesPanelProps['resolveChartWindow']>(() =>
      Promise.resolve(WINDOW),
    ),
    ...overrides,
  };
}

describe(TimeSeriesPanel.name, () => {
  it('should render a loading state while the series list is being fetched', () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ isLoading: true })} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render an empty state when the asset has no linked series', () => {
    renderPanel(<TimeSeriesPanel {...makeProps()} />);

    expect(screen.getByText('No linked time series')).toBeInTheDocument();
  });

  it('should render an error state with a retry control', async () => {
    const onRetry = vi.fn();
    renderPanel(
      <TimeSeriesPanel {...makeProps({ error: new Error('Series unavailable'), onRetry })} />,
    );

    expect(screen.getByText('Series unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]);

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should render a no-access state when the token lacks permission', () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ error: new CdfAccessError('403') })} />);

    expect(screen.getByText('You do not have access to this data.')).toBeInTheDocument();
  });

  it('should list every linked series with its description and unit', () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ timeSeries: [makeTimeSeriesSummary()] })} />);

    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('Pump discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('Unit: bar')).toBeInTheDocument();
  });

  it('should plot no series by default', () => {
    const props = makeProps({ timeSeries: [makeTimeSeriesSummary()] });
    renderPanel(<TimeSeriesPanel {...props} />);

    expect(screen.getByText('No series selected')).toBeInTheDocument();
    expect(props.fetchChartData).not.toHaveBeenCalled();
  });

  it('should fetch chart data once the analyst selects a series', async () => {
    const props = makeProps({ timeSeries: [makeTimeSeriesSummary()] });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();

    await waitFor(() => expect(props.fetchChartData).toHaveBeenCalled());
  });

  it('should anchor the default window to the latest datapoint rather than now', async () => {
    const props = makeProps({ timeSeries: [makeTimeSeriesSummary()] });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();
    await waitFor(() => expect(props.resolveChartWindow).toHaveBeenCalled());

    expect(props.fetchChartData).toHaveBeenCalledWith(expect.anything(), WINDOW);
  });

  it('should show an empty state when the selected series has no datapoints', async () => {
    const props = makeProps({
      timeSeries: [makeTimeSeriesSummary()],
      fetchChartData: vi.fn<TimeSeriesPanelProps['fetchChartData']>(() =>
        Promise.resolve([makeTimeSeriesDatapoints({ datapoints: [] })]),
      ),
    });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();

    expect(await screen.findByText('No datapoints available')).toBeInTheDocument();
  });

  it('should surface a chart error without breaking the series list', async () => {
    const props = makeProps({
      timeSeries: [makeTimeSeriesSummary()],
      fetchChartData: vi.fn<TimeSeriesPanelProps['fetchChartData']>(() =>
        Promise.reject(new Error('Datapoints request failed')),
      ),
    });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();

    expect(await screen.findByText('Datapoints request failed')).toBeInTheDocument();
    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
  });

  it('should re-fetch datapoints when the manual refresh is triggered', async () => {
    const props = makeProps({ timeSeries: [makeTimeSeriesSummary()] });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();
    const refreshButton = await screen.findByRole('button', { name: 'Refresh chart' });
    const callsBeforeRefresh = vi.mocked(props.fetchChartData).mock.calls.length;
    await userEvent.click(refreshButton);

    await waitFor(() =>
      expect(vi.mocked(props.fetchChartData).mock.calls.length).toBeGreaterThan(
        callsBeforeRefresh,
      ),
    );
  });

  it('should stop plotting when the analyst deselects every series', async () => {
    const props = makeProps({ timeSeries: [makeTimeSeriesSummary()] });
    renderPanel(<TimeSeriesPanel {...props} />);

    await selectFirstSeries();
    await waitFor(() => expect(props.fetchChartData).toHaveBeenCalled());
    await selectFirstSeries();

    expect(await screen.findByText('No series selected')).toBeInTheDocument();
  });

  it('should chart multiple series together', async () => {
    const props = makeProps({
      timeSeries: [
        makeTimeSeriesSummary(),
        makeTimeSeriesSummary({ ref: makeRef('PUMP-101-FLOW'), name: 'Flow rate', unit: 'm3/h' }),
      ],
    });
    renderPanel(<TimeSeriesPanel {...props} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    await waitFor(() => {
      const calls = vi.mocked(props.fetchChartData).mock.calls;
      expect(calls[calls.length - 1]?.[0]).toHaveLength(2);
    });
  });

  it('should keep zoom out and reset disabled until the analyst zooms in', async () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ timeSeries: [makeTimeSeriesSummary()] })} />);

    await selectFirstSeries();

    expect(await screen.findByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();
  });

  it('should narrow the visible time range when the analyst zooms in', async () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ timeSeries: [makeTimeSeriesSummary()] })} />);

    await selectFirstSeries();
    const fullRange = (await screen.findByText(TIME_RANGE_PATTERN)).textContent;
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(screen.getByText(TIME_RANGE_PATTERN).textContent).not.toBe(fullRange);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeEnabled();
  });

  it('should restore the full time range when the analyst resets the zoom', async () => {
    renderPanel(<TimeSeriesPanel {...makeProps({ timeSeries: [makeTimeSeriesSummary()] })} />);

    await selectFirstSeries();
    const fullRange = (await screen.findByText(TIME_RANGE_PATTERN)).textContent;
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));

    expect(screen.getByText(TIME_RANGE_PATTERN).textContent).toBe(fullRange);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();
  });
});

const TIME_RANGE_PATTERN = / - /;

async function selectFirstSeries() {
  await userEvent.click(screen.getAllByRole('checkbox')[0]);
}

function renderPanel(ui: ReactNode) {
  return render(<Harness>{ui}</Harness>);
}
