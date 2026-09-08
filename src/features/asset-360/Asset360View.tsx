import type { HostAppAPI } from '@cognite/app-sdk';
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { useEffect, useMemo, useState } from 'react';

import { PanelErrorBoundary } from '../../components/PanelErrorBoundary';
import { PanelState } from '../../components/PanelState';
import { useAppState } from '../../state/useAppState';
import { useRecentlyViewed } from '../../state/useRecentlyViewed';
import { decodeInstanceRef } from '../../types/instanceRef';
import { useAsset360DataViewModel } from '../../view-models/useAsset360DataViewModel';

import { AssetHeader } from './AssetHeader';
import { DocumentsPanel } from './DocumentsPanel';
import { TimeSeriesPanel } from './TimeSeriesPanel';
import { WorkOrdersPanel } from './WorkOrdersPanel';

type Asset360ViewProps = {
  assetId: string;
  api: Pick<HostAppAPI, 'navigateExternal'> | null;
};

export function Asset360View({ assetId, api }: Asset360ViewProps) {
  const { navigateHome } = useAppState();
  const { recordView } = useRecentlyViewed();
  const assetRef = useMemo(() => decodeInstanceRef(assetId), [assetId]);
  const data = useAsset360DataViewModel(assetRef);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    if (data.asset) {
      recordView({
        ref: data.asset.ref,
        tag: data.asset.tag,
        name: data.asset.name,
      });
    }
  }, [data.asset, recordView]);

  const openExternal = (url: string) => {
    void api?.navigateExternal({ url, openInNewTab: true });
  };

  if (!assetRef) {
    return (
      <main className="min-h-screen bg-muted/50 p-8">
        <div className="mx-auto max-w-md space-y-4">
          <Alert>
            <AlertDescription>
              The asset link is invalid. Return home and search again.
            </AlertDescription>
          </Alert>
          <Button onClick={navigateHome}>Back to search</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 py-8 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={navigateHome}>Back to search</Button>
        </div>

        <PanelErrorBoundary panelName="asset header">
          <PanelState
            status={data.assetLoading ? 'loading' : data.assetError ? 'error' : data.asset ? 'success' : 'empty'}
            emptyTitle="Asset not found"
            emptyDescription="The selected asset could not be found in CDF."
            errorMessage={data.assetError?.message}
            onRetry={data.retryAsset}
          >
            {data.asset ? <AssetHeader asset={data.asset} /> : null}
          </PanelState>
        </PanelErrorBoundary>

        {data.assetLoading && !data.asset ? (
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader size={18} />
            <span>Loading asset details...</span>
          </div>
        ) : null}

        {data.asset ? (
          <Tabs defaultValue="time-series">
            <TabsList>
              <TabsTrigger value="time-series">Time series</TabsTrigger>
              <TabsTrigger value="work-orders">Work orders</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsPanel value="time-series">
              <PanelErrorBoundary panelName="time series" onRetry={data.retryTimeSeries}>
                <TimeSeriesPanel
                  timeSeries={data.timeSeries}
                  isLoading={data.timeSeriesLoading}
                  error={data.timeSeriesError}
                  onRetry={data.retryTimeSeries}
                  fetchChartData={data.fetchChartData}
                  resolveChartWindow={data.resolveChartWindow}
                />
              </PanelErrorBoundary>
            </TabsPanel>

            <TabsPanel value="work-orders">
              <PanelErrorBoundary panelName="work orders" onRetry={data.retryActivities}>
                <WorkOrdersPanel
                  activities={data.activities}
                  isLoading={data.activitiesLoading}
                  error={data.activitiesError}
                  selectedActivityId={selectedActivityId}
                  onSelectActivity={setSelectedActivityId}
                  onRetry={data.retryActivities}
                />
              </PanelErrorBoundary>
            </TabsPanel>

            <TabsPanel value="documents">
              <PanelErrorBoundary panelName="documents" onRetry={data.retryFiles}>
                <DocumentsPanel
                  files={data.files}
                  isLoading={data.filesLoading}
                  error={data.filesError}
                  selectedFileId={selectedFileId}
                  onSelectFile={setSelectedFileId}
                  onRetry={data.retryFiles}
                  onOpenExternal={openExternal}
                />
              </PanelErrorBoundary>
            </TabsPanel>
          </Tabs>
        ) : null}
      </section>
    </main>
  );
}
