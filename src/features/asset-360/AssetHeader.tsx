import { Badge } from '@cognite/aura/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';

import type { AssetDetail } from '../../types/domain';

type AssetHeaderProps = {
  asset: AssetDetail;
};

export function AssetHeader({ asset }: AssetHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl">{asset.name}</CardTitle>
          <Badge variant="nordic" background>{asset.tag}</Badge>
          {asset.typeName ? <Badge variant="mountain">{asset.typeName}</Badge> : null}
        </div>
        {asset.description ? (
          <CardDescription className="text-base">{asset.description}</CardDescription>
        ) : null}
        {asset.parentName ? (
          <CardDescription>Location: {asset.parentName}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent />
    </Card>
  );
}
