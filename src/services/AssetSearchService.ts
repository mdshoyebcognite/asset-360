import type { CogniteClient } from '@cognite/sdk';

import {
  getDirectRelationLabel,
  getStringProperty,
  getViewProperties,
} from '../lib/cdmProperties';
import { collectCdmNodes, type CdmNode } from '../lib/nodeGuards';
import { CDM_VIEW_KEYS, CDM_VIEWS } from '../types/cdm';
import type { AssetSummary } from '../types/domain';

import { toServiceError } from './errors';

export interface AssetSearchService {
  searchAssets(query: string): Promise<AssetSummary[]>;
}

function mapNodeToAssetSummary(node: CdmNode): AssetSummary {
  const viewProps = getViewProperties(node.properties, CDM_VIEW_KEYS.asset);
  const name = getStringProperty(viewProps, 'name') ?? node.externalId;
  const description = getStringProperty(viewProps, 'description');
  const parentName = getDirectRelationLabel(viewProps.parent);
  const typeName = getDirectRelationLabel(viewProps.type);

  return {
    ref: { space: node.space, externalId: node.externalId },
    tag: node.externalId,
    name,
    description,
    parentName,
    typeName,
  };
}

export class ApiAssetSearchService implements AssetSearchService {
  constructor(private readonly client: CogniteClient) {}

  async searchAssets(query: string): Promise<AssetSummary[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return [];
    }

    try {
      const response = await this.client.instances.search({
        instanceType: 'node',
        view: {
          type: 'view',
          space: CDM_VIEWS.asset.space,
          externalId: CDM_VIEWS.asset.externalId,
          version: CDM_VIEWS.asset.version,
        },
        query: trimmed,
        limit: 25,
      });

      return collectCdmNodes(response.items).map(mapNodeToAssetSummary);
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }
}
