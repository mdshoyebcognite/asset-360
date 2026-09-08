import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeServices } from '../../__mocks__/contextFixtures';
import { makeFileSummary, makeRef } from '../../__mocks__/domainFixtures';
import { Harness } from '../../__mocks__/testHarness';
import type { Services } from '../../services';
import { CdfAccessError } from '../../services';

import { DocumentsPanel } from './DocumentsPanel';

// The viewer is vendored verbatim from the integrate-file-viewer skill and pulls in
// pdf.js worker setup that cannot run under happy-dom. These tests cover the panel's
// own routing between inline preview and the external-open fallback, not the viewer.
vi.mock('../../cognite-file-viewer', () => ({
  CogniteFileViewer: () => <div data-testid="cognite-file-viewer" />,
}));

const defaultProps = {
  files: [],
  isLoading: false,
  error: null,
  selectedFileId: null,
  onSelectFile: vi.fn(),
  onRetry: vi.fn(),
  onOpenExternal: vi.fn(),
};

describe(DocumentsPanel.name, () => {
  it('should render a loading state while files are being fetched', async () => {
    await renderPanel(<DocumentsPanel {...defaultProps} isLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render an empty state when the asset has no documents', async () => {
    await renderPanel(<DocumentsPanel {...defaultProps} />);

    expect(screen.getByText('No linked documents')).toBeInTheDocument();
  });

  it('should render an error state with a retry control', async () => {
    const onRetry = vi.fn();
    await renderPanel(
      <DocumentsPanel {...defaultProps} error={new Error('Files unavailable')} onRetry={onRetry} />,
    );

    expect(screen.getByText('Files unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should render a no-access state when the token lacks file permission', async () => {
    await renderPanel(<DocumentsPanel {...defaultProps} error={new CdfAccessError('403 forbidden')} />);

    expect(screen.getByText('You do not have access to this data.')).toBeInTheDocument();
  });

  it('should render name, type, and last modified date for each file', async () => {
    await renderPanel(<DocumentsPanel {...defaultProps} files={[makeFileSummary()]} />);

    expect(screen.getByText('PUMP-101 P&ID.pdf')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
  });

  it('should fall back to placeholders when type and date are missing', async () => {
    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[makeFileSummary({ mimeType: undefined, lastModified: undefined })]}
      />,
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should request selection of a file when it is opened', async () => {
    const onSelectFile = vi.fn();
    await renderPanel(
      <DocumentsPanel {...defaultProps} files={[makeFileSummary()]} onSelectFile={onSelectFile} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onSelectFile).toHaveBeenCalledWith('cdf_cdm:DOC-PID-101');
  });

  it('should preview a PDF inline', async () => {
    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[makeFileSummary()]}
        selectedFileId="cdf_cdm:DOC-PID-101"
      />,
    );

    expect(screen.getByTestId('cognite-file-viewer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close preview' })).toBeInTheDocument();
  });

  it('should preview a PNG image inline', async () => {
    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[makeFileSummary({ mimeType: 'image/png', name: 'nameplate.png' })]}
        selectedFileId="cdf_cdm:DOC-PID-101"
      />,
    );

    expect(screen.getByTestId('cognite-file-viewer')).toBeInTheDocument();
  });

  it('should offer an external open action for unsupported file types', async () => {
    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[unsupportedFile()]}
        selectedFileId="cdf_cdm:DOC-CAD-9"
      />,
    );

    expect(screen.queryByTestId('cognite-file-viewer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open externally' })).toBeInTheDocument();
  });

  it('should resolve a download URL and open it externally', async () => {
    const onOpenExternal = vi.fn();
    const services = makeServices();
    vi.mocked(services.fileService.getDownloadUrl).mockResolvedValue('https://files.test/cad');

    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[unsupportedFile()]}
        selectedFileId="cdf_cdm:DOC-CAD-9"
        onOpenExternal={onOpenExternal}
      />,
      services,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open externally' }));

    await waitFor(() => expect(onOpenExternal).toHaveBeenCalledWith('https://files.test/cad'));
  });

  it('should surface an error when the download URL cannot be resolved', async () => {
    const services = makeServices();
    vi.mocked(services.fileService.getDownloadUrl).mockRejectedValue(new Error('Download denied'));

    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[unsupportedFile()]}
        selectedFileId="cdf_cdm:DOC-CAD-9"
      />,
      services,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open externally' }));

    expect(await screen.findByText('Download denied')).toBeInTheDocument();
  });

  it('should clear the selection when the preview is closed', async () => {
    const onSelectFile = vi.fn();
    await renderPanel(
      <DocumentsPanel
        {...defaultProps}
        files={[makeFileSummary()]}
        selectedFileId="cdf_cdm:DOC-PID-101"
        onSelectFile={onSelectFile}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }));

    expect(onSelectFile).toHaveBeenCalledWith(null);
  });
});

function unsupportedFile() {
  return makeFileSummary({
    ref: makeRef('DOC-CAD-9'),
    name: 'layout.dwg',
    mimeType: 'application/acad',
  });
}

/** CogniteSdkProvider performs an async handshake, so wait for the panel to mount. */
async function renderPanel(ui: ReactNode, services: Services = makeServices()) {
  const result = render(
    <Harness withSdk services={services}>
      {ui}
    </Harness>,
  );
  await screen.findByText('Documents');
  return result;
}
