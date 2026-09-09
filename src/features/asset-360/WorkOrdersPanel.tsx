import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import { Separator } from '@cognite/aura/components/separator';

import { PanelState } from '../../components/PanelState';
import { resolvePanelStatus } from '../../components/panelStatus';
import type { ActivitySummary } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

type WorkOrdersPanelProps = {
  activities: ActivitySummary[];
  isLoading: boolean;
  error: Error | null;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string | null) => void;
  onRetry: () => void;
};

export function WorkOrdersPanel({
  activities,
  isLoading,
  error,
  selectedActivityId,
  onSelectActivity,
  onRetry,
}: WorkOrdersPanelProps) {
  const status = resolvePanelStatus({
    isLoading,
    error,
    isEmpty: activities.length === 0,
  });

  const selectedActivity = activities.find(
    (activity) => encodeInstanceRef(activity.ref) === selectedActivityId,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work orders</CardTitle>
        <CardDescription>Recent maintenance activities linked to this asset.</CardDescription>
      </CardHeader>
      <CardContent>
        <PanelState
          status={status}
          emptyTitle="No linked work orders"
          emptyDescription="This asset has no CogniteActivity records in CDF."
          errorMessage={error?.message}
          onRetry={onRetry}
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Identifier</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const id = encodeInstanceRef(activity.ref);
                  const isSelected = selectedActivityId === id;
                  return (
                    <tr key={id} className="border-b align-top">
                      <td className="px-3 py-3 font-mono text-sm">{activity.identifier}</td>
                      <td className="px-3 py-3">{activity.title}</td>
                      <td className="px-3 py-3">
                        {activity.status ? (
                          <Badge variant="mountain">{activity.status}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">
                        {activity.date ? activity.date.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          variant={isSelected ? 'default' : 'secondary'}
                          onClick={() => onSelectActivity(isSelected ? null : id)}
                        >
                          {isSelected ? 'Hide detail' : 'View detail'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedActivity ? (
            <div className="mt-6 w-full space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium">{selectedActivity.title}</h3>
                <Button variant="secondary" onClick={() => onSelectActivity(null)}>
                  Close
                </Button>
              </div>
              <Separator />
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="font-medium">Identifier</dt>
                  <dd>{selectedActivity.identifier}</dd>
                </div>
                {selectedActivity.status ? (
                  <div>
                    <dt className="font-medium">Status</dt>
                    <dd>{selectedActivity.status}</dd>
                  </div>
                ) : null}
                {selectedActivity.date ? (
                  <div>
                    <dt className="font-medium">Date</dt>
                    <dd>{selectedActivity.date.toLocaleString()}</dd>
                  </div>
                ) : null}
                {selectedActivity.description ? (
                  <div>
                    <dt className="font-medium">Description</dt>
                    <dd>{selectedActivity.description}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </PanelState>
      </CardContent>
    </Card>
  );
}
