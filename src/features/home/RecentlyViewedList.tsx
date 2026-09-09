import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';

import type { RecentlyViewedAsset } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

type RecentlyViewedListProps = {
  items: RecentlyViewedAsset[];
  onSelect: (assetId: string) => void;
};

export function RecentlyViewedList({ items, onSelect }: RecentlyViewedListProps) {
  if (items.length === 0) {
    return (
      <EmptyState type="no-results" variant="compact">
        <EmptyStateTitle>No recently viewed assets</EmptyStateTitle>
        <EmptyStateDescription>
          Assets you open will appear here for quick access.
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="grid w-full gap-3">
      {items.map((item) => (
        <Card key={encodeInstanceRef(item.ref)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{item.name}</CardTitle>
            <CardDescription>{item.tag}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              onClick={() => onSelect(encodeInstanceRef(item.ref))}
            >
              Open asset
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
