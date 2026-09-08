import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  makeAppState,
  makeRecentlyViewed,
  makeServices,
} from '../../__mocks__/contextFixtures';
import {
  makeActivitySummary,
  makeAssetDetail,
  makeFileSummary,
  makeTimeSeriesSummary,
} from '../../__mocks__/domainFixtures';
import { Harness } from '../../__mocks__/testHarness';
import type { Services } from '../../services';
import type { AppStateContextValue } from '../../state/appStateContext';
import type { RecentlyViewedContextValue } from '../../state/recentlyViewedContext';

import { Asset360View } from './Asset360View';

// The viewer is vendored verbatim from the integrate-file-viewer skill and pulls in
// pdf.js worker setup that cannot run under happy-dom.
vi.mock('../../cognite-file-viewer', () => ({
  CogniteFileViewer: () => <div data-testid="cognite-file-viewer" />,
}));

const ASSET_ID = 'cdf_cdm:PUMP-101';

function makeLoadedServices(): Services {
  const services = makeServices();
  vi.mocked(services.assetService.getAsset).mockResolvedValue(makeAssetDetail());
  vi.mocked(services.timeSeriesService.listForAsset).mockResolvedValue([makeTimeSeriesSummary()]);
  vi.mocked(services.activityService.listForAsset).mockResolvedValue([makeActivitySummary()]);
  vi.mocked(services.fileService.listForAsset).mockResolvedValue([makeFileSummary()]);
  return services;
}

describe(Asset360View.name, () => {
  it('should show a recovery affordance when the asset link is malformed', async () => {
    const appState = makeAppState();
    await renderView({ assetId: 'not-a-valid-ref', appState });

    expect(
      screen.getByText('The asset link is invalid. Return home and search again.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to search' }));

    expect(appState.navigateHome).toHaveBeenCalledOnce();
  });

  it('should render the asset header once the asset resolves', async () => {
    await renderView({ services: makeLoadedServices() });

    expect(await screen.findByText('Feed water pump')).toBeInTheDocument();
    expect(screen.getByText('PUMP-101')).toBeInTheDocument();
  });

  it('should record the opened asset in recently viewed', async () => {
    const recentlyViewed = makeRecentlyViewed();
    await renderView({ services: makeLoadedServices(), recentlyViewed });

    await waitFor(() =>
      expect(recentlyViewed.recordView).toHaveBeenCalledWith({
        ref: { space: 'cdf_cdm', externalId: 'PUMP-101' },
        tag: 'PUMP-101',
        name: 'Feed water pump',
      }),
    );
  });

  it('should open on the time series tab', async () => {
    await renderView({ services: makeLoadedServices() });

    expect(await screen.findByText('Discharge pressure')).toBeInTheDocument();
  });

  it('should switch to the work orders tab', async () => {
    await renderView({ services: makeLoadedServices() });

    await userEvent.click(await screen.findByRole('tab', { name: 'Work orders' }));

    expect(await screen.findByText('Replace mechanical seal')).toBeInTheDocument();
  });

  it('should switch to the documents tab', async () => {
    await renderView({ services: makeLoadedServices() });

    await userEvent.click(await screen.findByRole('tab', { name: 'Documents' }));

    expect(await screen.findByText('PUMP-101 P&ID.pdf')).toBeInTheDocument();
  });

  it('should keep other panels working when one data source fails', async () => {
    const services = makeLoadedServices();
    vi.mocked(services.activityService.listForAsset).mockRejectedValue(new Error('SAP unreachable'));

    await renderView({ services });
    await userEvent.click(await screen.findByRole('tab', { name: 'Work orders' }));

    expect(await screen.findByText('SAP unreachable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Time series' }));
    expect(await screen.findByText('Discharge pressure')).toBeInTheDocument();
  });

  it('should show an error with retry when the asset itself fails to load', async () => {
    const services = makeServices();
    vi.mocked(services.assetService.getAsset).mockRejectedValue(new Error('Asset lookup failed'));
    vi.mocked(services.timeSeriesService.listForAsset).mockResolvedValue([]);
    vi.mocked(services.activityService.listForAsset).mockResolvedValue([]);
    vi.mocked(services.fileService.listForAsset).mockResolvedValue([]);

    await renderView({ services });

    expect(await screen.findByText('Asset lookup failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should navigate home from the asset page', async () => {
    const appState = makeAppState();
    await renderView({ services: makeLoadedServices(), appState });

    await userEvent.click(await screen.findByRole('button', { name: 'Back to search' }));

    expect(appState.navigateHome).toHaveBeenCalledOnce();
  });

  it('should open unsupported documents through the host navigation API', async () => {
    const services = makeLoadedServices();
    vi.mocked(services.fileService.listForAsset).mockResolvedValue([
      makeFileSummary({ name: 'layout.dwg', mimeType: 'application/acad' }),
    ]);
    vi.mocked(services.fileService.getDownloadUrl).mockResolvedValue('https://files.test/dwg');
    const navigateExternal = vi.fn(() => Promise.resolve(true));

    await renderView({ services, api: { navigateExternal } });
    await userEvent.click(await screen.findByRole('tab', { name: 'Documents' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open externally' }));

    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith({
        url: 'https://files.test/dwg',
        openInNewTab: true,
      }),
    );
  });
});

type RenderOptions = {
  assetId?: string;
  services?: Services;
  appState?: AppStateContextValue;
  recentlyViewed?: RecentlyViewedContextValue;
  api?: { navigateExternal: (options: { url: string; openInNewTab?: boolean }) => Promise<boolean> };
};

/** CogniteSdkProvider performs an async handshake, so wait for the view to mount. */
async function renderView({
  assetId = ASSET_ID,
  services = makeServices(),
  appState = makeAppState(),
  recentlyViewed = makeRecentlyViewed(),
  api = { navigateExternal: vi.fn(() => Promise.resolve(true)) },
}: RenderOptions = {}): Promise<ReactNode> {
  render(
    <Harness withSdk services={services} appState={appState} recentlyViewed={recentlyViewed}>
      <Asset360View assetId={assetId} api={api} />
    </Harness>,
  );
  await screen.findByRole('button', { name: 'Back to search' });
  return null;
}
