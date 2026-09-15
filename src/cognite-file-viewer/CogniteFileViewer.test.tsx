import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CogniteFileViewer } from './CogniteFileViewer';
import { useFileResolver } from './useFileResolver';

vi.mock('react-pdf', () => ({
  Document: ({ children, loading }: { children: ReactNode; loading: ReactNode }) => (
    <div data-testid="pdf-document">
      {loading}
      {children}
    </div>
  ),
  Page: () => <div data-testid="pdf-page" />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));

vi.mock('./useFileResolver', () => ({
  useFileResolver: vi.fn(),
}));

vi.mock('./useDocumentAnnotations', () => ({
  useDocumentAnnotations: vi.fn(() => ({
    annotations: [],
    isLoading: false,
    error: null,
    annotationsCapped: false,
  })),
}));

describe(CogniteFileViewer.name, () => {
  it('should show loading state while resolving', () => {
    vi.mocked(useFileResolver).mockReturnValue({
      isLoading: true,
      error: null,
    });

    render(
      <CogniteFileViewer
        source={{ type: 'url', url: 'https://example.test/a.pdf', mimeType: 'application/pdf' }}
      />,
    );

    expect(screen.getByText(/Loading file/)).toBeInTheDocument();
  });

  it('should show error when resolution fails', () => {
    vi.mocked(useFileResolver).mockReturnValue({
      isLoading: false,
      error: new Error('boom'),
    });

    render(
      <CogniteFileViewer
        source={{ type: 'url', url: 'https://example.test/a.pdf' }}
      />,
    );

    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('should render text content for plain text files', async () => {
    vi.mocked(useFileResolver).mockReturnValue({
      isLoading: false,
      error: null,
      url: 'https://example.test/readme.txt',
      mimeType: 'text/plain',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('hello world'),
      }),
    );

    render(
      <CogniteFileViewer
        source={{ type: 'url', url: 'https://example.test/readme.txt' }}
      />,
    );

    expect(await screen.findByText('hello world')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('should mount the pdf renderer for pdf mime types', () => {
    vi.mocked(useFileResolver).mockReturnValue({
      isLoading: false,
      error: null,
      url: 'https://example.test/a.pdf',
      mimeType: 'application/pdf',
      instanceId: { space: 'sp', externalId: 'file-1' },
    });

    render(
      <CogniteFileViewer
        source={{ type: 'url', url: 'https://example.test/a.pdf' }}
        client={{ project: 'proj' } as never}
      />,
    );

    expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
  });

  it('should show unsupported message for unknown mime types', () => {
    vi.mocked(useFileResolver).mockReturnValue({
      isLoading: false,
      error: null,
      url: 'https://example.test/blob.bin',
      mimeType: 'application/octet-stream',
    });

    render(
      <CogniteFileViewer
        source={{ type: 'url', url: 'https://example.test/blob.bin' }}
      />,
    );

    expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument();
  });
});
