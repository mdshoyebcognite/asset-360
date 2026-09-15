import type { CogniteClient } from '@cognite/sdk';

import { cdfTaskRunner } from '../lib/cdfTaskRunner';
import {
  getDirectRelationLabel,
  getStringProperty,
  getViewProperties,
} from '../lib/cdmProperties';
import { isCdmNode, type CdmNode } from '../lib/nodeGuards';
import { CDM_VIEW_KEYS, CDM_VIEWS } from '../types/cdm';
import type { AssetDetail } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

import { toServiceError } from './errors';

export interface AssetService {
  getAsset(ref: InstanceRef): Promise<AssetDetail | null>;
}

function mapNodeToAssetDetail(node: CdmNode): AssetDetail {
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

export class ApiAssetService implements AssetService {
  constructor(private readonly client: CogniteClient) {}

  async getAsset(ref: InstanceRef): Promise<AssetDetail | null> {
    try {
      const response = await cdfTaskRunner.schedule(() =>
        this.client.instances.retrieve({
        items: [
          {
            instanceType: 'node',
            space: ref.space,
            externalId: ref.externalId,
          },
        ],
        sources: [
          {
            source: {
              type: 'view',
              space: CDM_VIEWS.asset.space,
              externalId: CDM_VIEWS.asset.externalId,
              version: CDM_VIEWS.asset.version,
            },
          },
        ],
        }),
      );

      let node: CdmNode | undefined;
      for (const item of response.items) {
        if (isCdmNode(item)) {
          node = item;
          break;
        }
      }

      return node ? mapNodeToAssetDetail(node) : null;
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }
}
