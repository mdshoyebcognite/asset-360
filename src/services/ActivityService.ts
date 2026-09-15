import type { CogniteClient } from '@cognite/sdk';

import { cdfTaskRunner } from '../lib/cdfTaskRunner';
import {
  getStringProperty,
  getViewProperties,
  parseTimestamp,
} from '../lib/cdmProperties';
import { collectCdmNodes, type CdmNode } from '../lib/nodeGuards';
import { CDM_VIEW_KEYS, CDM_VIEWS } from '../types/cdm';
import type { ActivitySummary } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

import { toServiceError } from './errors';
import {
  listResultFromResponse,
  RELATED_LIST_LIMIT,
  type ListResult,
} from './listResult';

export interface ActivityService {
  listForAsset(assetRef: InstanceRef): Promise<ListResult<ActivitySummary>>;
}

function mapNodeToActivitySummary(node: CdmNode): ActivitySummary {
  const viewProps = getViewProperties(node.properties, CDM_VIEW_KEYS.activity);
  const title = getStringProperty(viewProps, 'name') ?? node.externalId;
  const description = getStringProperty(viewProps, 'description');
  const status = getStringProperty(viewProps, 'status');
  const endTime = parseTimestamp(viewProps.endTime);
  const scheduledEndTime = parseTimestamp(viewProps.scheduledEndTime);
  const startTime = parseTimestamp(viewProps.startTime);
  const scheduledStartTime = parseTimestamp(viewProps.scheduledStartTime);
  const date = endTime ?? scheduledEndTime ?? startTime ?? scheduledStartTime;

  return {
    ref: { space: node.space, externalId: node.externalId },
    identifier: node.externalId,
    title,
    description,
    status,
    date,
  };
}

function activityRecency(activity: ActivitySummary): number {
  return activity.date?.getTime() ?? 0;
}

function assetRelationFilter(assetRef: InstanceRef) {
  return {
    containsAny: {
      property: [CDM_VIEWS.activity.space, CDM_VIEW_KEYS.activity, 'assets'],
      values: [
        {
          space: assetRef.space,
          externalId: assetRef.externalId,
        },
      ],
    },
  };
}

export class ApiActivityService implements ActivityService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetRef: InstanceRef): Promise<ListResult<ActivitySummary>> {
    try {
      const response = await cdfTaskRunner.schedule(() =>
        this.client.instances.list({
        instanceType: 'node',
        sources: [
          {
            source: {
              type: 'view',
              space: CDM_VIEWS.activity.space,
              externalId: CDM_VIEWS.activity.externalId,
              version: CDM_VIEWS.activity.version,
            },
          },
        ],
        filter: assetRelationFilter(assetRef),
        limit: RELATED_LIST_LIMIT,
        }),
      );

      const items = collectCdmNodes(response.items)
        .map(mapNodeToActivitySummary)
        .sort((left, right) => activityRecency(right) - activityRecency(left));
      return listResultFromResponse(items, RELATED_LIST_LIMIT);
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }
}
