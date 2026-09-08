import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';

import { useHomeViewModel } from '../../view-models/useHomeViewModel';

import { AssetSearchCombobox } from './AssetSearchCombobox';
import { RecentlyViewedList } from './RecentlyViewedList';

export function HomeView() {
  const { recentlyViewed, searchAssets, selectAsset, openRecentAsset } = useHomeViewModel();

  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10 sm:p-8">
        <div>
          <h1 className="text-3xl font-semibold">Asset 360 Investigation Workspace</h1>
          <p className="mt-2 text-muted-foreground">
            Search for equipment to view time series, work orders, and documents in one place.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search assets</CardTitle>
            <CardDescription>
              Enter a tag, name, or description to find equipment flagged for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetSearchCombobox onSearch={searchAssets} onSelect={selectAsset} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently viewed</CardTitle>
            <CardDescription>Jump back to assets you opened on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentlyViewedList items={recentlyViewed} onSelect={openRecentAsset} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
