import type { CogniteClient } from '@cognite/sdk';

import {
  getDirectRelationLabel,
  getStringProperty,
  getViewProperties,
} from '../lib/cdmProperties';
import { collectCdmNodes, type CdmNode } from '../lib/nodeGuards';
import { CDM_VIEW_KEYS, CDM_VIEWS } from '../types/cdm';
import type { Datapoint, TimeSeriesDatapoints, TimeSeriesSummary } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

import { toServiceError } from './errors';

export interface TimeSeriesService {
  listForAsset(assetRef: InstanceRef): Promise<TimeSeriesSummary[]>;
  fetchDatapoints(
    series: TimeSeriesSummary[],
    start: Date,
    end: Date,
  ): Promise<TimeSeriesDatapoints[]>;
  getLatestDatapointTimestamp(series: TimeSeriesSummary[]): Promise<Date | null>;
}

function mapNodeToTimeSeriesSummary(node: CdmNode): TimeSeriesSummary {
  const viewProps = getViewProperties(node.properties, CDM_VIEW_KEYS.timeSeries);
  const name = getStringProperty(viewProps, 'name') ?? node.externalId;
  const description = getStringProperty(viewProps, 'description');
  const unit = getDirectRelationLabel(viewProps.unit);

  return {
    ref: { space: node.space, externalId: node.externalId },
    name,
    description,
    unit,
  };
}

function assetRelationFilter(assetRef: InstanceRef) {
  return {
    containsAny: {
      property: [CDM_VIEWS.timeSeries.space, CDM_VIEW_KEYS.timeSeries, 'assets'],
      values: [
        {
          space: assetRef.space,
          externalId: assetRef.externalId,
        },
      ],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTimestampMillis(timestamp: unknown): number | null {
  if (timestamp instanceof Date) {
    const millis = timestamp.getTime();
    return Number.isNaN(millis) ? null : millis;
  }
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  return null;
}

function mapDatapointItems(datapoints: unknown): Datapoint[] {
  if (!Array.isArray(datapoints)) {
    return [];
  }

  const result: Datapoint[] = [];
  for (const item of datapoints) {
    if (!isRecord(item)) {
      continue;
    }
    // The CogniteClient returns datapoint timestamps as Date objects, but tolerate raw epoch
    // millis too so parsing does not depend on SDK serialization details.
    const millis = toTimestampMillis(item.timestamp);
    const value = item.value;
    if (millis !== null && typeof value === 'number') {
      result.push({
        timestamp: new Date(millis),
        value,
      });
    }
  }
  return result;
}

export class ApiTimeSeriesService implements TimeSeriesService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetRef: InstanceRef): Promise<TimeSeriesSummary[]> {
    try {
      const response = await this.client.instances.list({
        instanceType: 'node',
        sources: [
          {
            source: {
              type: 'view',
              space: CDM_VIEWS.timeSeries.space,
              externalId: CDM_VIEWS.timeSeries.externalId,
              version: CDM_VIEWS.timeSeries.version,
            },
          },
        ],
        filter: assetRelationFilter(assetRef),
        limit: 100,
      });

      return collectCdmNodes(response.items).map(mapNodeToTimeSeriesSummary);
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }

  async fetchDatapoints(
    series: TimeSeriesSummary[],
    start: Date,
    end: Date,
  ): Promise<TimeSeriesDatapoints[]> {
    if (series.length === 0) {
      return [];
    }

    try {
      const response = await this.client.datapoints.retrieve({
        items: series.map((item) => ({
          instanceId: {
            space: item.ref.space,
            externalId: item.ref.externalId,
          },
        })),
        start,
        end,
        limit: 1000,
      });

      const seriesResults = Array.isArray(response) ? response : [];

      return series.map((item, index) => {
        const seriesData = seriesResults[index];
        const datapoints = seriesData ? mapDatapointItems(seriesData.datapoints) : [];
        return {
          ref: item.ref,
          name: item.name,
          datapoints,
        };
      });
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }

  async getLatestDatapointTimestamp(series: TimeSeriesSummary[]): Promise<Date | null> {
    if (series.length === 0) {
      return null;
    }

    try {
      const response = await this.client.datapoints.retrieveLatest(
        series.map((item) => ({
          instanceId: {
            space: item.ref.space,
            externalId: item.ref.externalId,
          },
        })),
      );

      let latest: Date | null = null;
      for (const item of response) {
        const firstPoint = item.datapoints[0];
        if (!firstPoint) {
          continue;
        }
        const date = new Date(firstPoint.timestamp);
        if (!latest || date > latest) {
          latest = date;
        }
      }
      return latest;
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }
}
