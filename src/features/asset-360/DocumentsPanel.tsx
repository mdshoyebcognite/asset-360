import { useCogniteSdk } from '@cognite/app-sdk/react';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import { Loader } from '@cognite/aura/components/loader';
import { useState } from 'react';

import { CogniteFileViewer } from '../../cognite-file-viewer';
import { getViewerType } from '../../cognite-file-viewer/mimeTypes';
import { PanelState } from '../../components/PanelState';
import { resolvePanelStatus } from '../../components/panelStatus';
import { useServices } from '../../state/useServices';
import type { FileSummary } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

type DocumentsPanelProps = {
  files: FileSummary[];
  isLoading: boolean;
  error: Error | null;
  selectedFileId: string | null;
  onSelectFile: (fileId: string | null) => void;
  onRetry: () => void;
  onOpenExternal: (url: string) => void;
};

export function DocumentsPanel({
  files,
  isLoading,
  error,
  selectedFileId,
  onSelectFile,
  onRetry,
  onOpenExternal,
}: DocumentsPanelProps) {
  const client = useCogniteSdk();
  const { fileService } = useServices();
  const status = resolvePanelStatus({
    isLoading,
    error,
    isEmpty: files.length === 0,
  });

  const selectedFile = files.find((file) => encodeInstanceRef(file.ref) === selectedFileId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Files linked to this asset, with inline preview where supported.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PanelState
          status={status}
          emptyTitle="No linked documents"
          emptyDescription="This asset has no CogniteFile records in CDF."
          errorMessage={error?.message}
          onRetry={onRetry}
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Last modified</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const id = encodeInstanceRef(file.ref);
                  const isSelected = selectedFileId === id;
                  return (
                    <tr key={id} className="border-b align-top">
                      <td className="px-3 py-3">{file.name}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {file.mimeType ?? 'Unknown'}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {file.lastModified ? file.lastModified.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          variant={isSelected ? 'default' : 'secondary'}
                          onClick={() => onSelectFile(isSelected ? null : id)}
                        >
                          {isSelected ? 'Close' : 'Open'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PanelState>

        {selectedFile ? (
          <DocumentPreview
            file={selectedFile}
            client={client}
            fileService={fileService}
            onOpenExternal={onOpenExternal}
            onClose={() => onSelectFile(null)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

type DocumentPreviewProps = {
  file: FileSummary;
  client: ReturnType<typeof useCogniteSdk>;
  fileService: { getDownloadUrl: (ref: { space: string; externalId: string }) => Promise<string> };
  onOpenExternal: (url: string) => void;
  onClose: () => void;
};

function DocumentPreview({
  file,
  client,
  fileService,
  onOpenExternal,
  onClose,
}: DocumentPreviewProps) {
  const viewerType = getViewerType(file.mimeType);
  const supportsInline = viewerType === 'pdf' || viewerType === 'image';

  if (supportsInline) {
    return (
      <div className="w-full space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium">{file.name}</h3>
          <Button variant="secondary" onClick={onClose}>Close preview</Button>
        </div>
        <CogniteFileViewer
          client={client}
          source={{
            type: 'instanceId',
            space: file.ref.space,
            externalId: file.ref.externalId,
          }}
          width={720}
        />
      </div>
    );
  }

  return (
    <UnsupportedFilePreview
      file={file}
      onOpenExternal={onOpenExternal}
      onClose={onClose}
      getDownloadUrl={() => fileService.getDownloadUrl(file.ref)}
    />
  );
}

type UnsupportedFilePreviewProps = {
  file: FileSummary;
  onOpenExternal: (url: string) => void;
  onClose: () => void;
  getDownloadUrl: () => Promise<string>;
};

function UnsupportedFilePreview({
  file,
  onOpenExternal,
  onClose,
  getDownloadUrl,
}: UnsupportedFilePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const url = await getDownloadUrl();
      onOpenExternal(url);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{file.name}</h3>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Inline preview is not available for {file.mimeType ?? 'this file type'}. Open or download
        the file externally instead.
      </p>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      <Button onClick={() => void handleOpen()} disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size={16} />
            Opening...
          </span>
        ) : (
          'Open externally'
        )}
      </Button>
    </div>
  );
}
