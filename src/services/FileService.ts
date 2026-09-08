import type { CogniteClient } from '@cognite/sdk';

import {
  getStringProperty,
  getViewProperties,
} from '../lib/cdmProperties';
import { collectCdmNodes, type CdmNode } from '../lib/nodeGuards';
import { CDM_VIEW_KEYS, CDM_VIEWS } from '../types/cdm';
import type { FileSummary } from '../types/domain';
import type { InstanceRef } from '../types/instanceRef';

import { toServiceError } from './errors';

export interface FileService {
  listForAsset(assetRef: InstanceRef): Promise<FileSummary[]>;
  getDownloadUrl(ref: InstanceRef): Promise<string>;
}

function mapNodeToFileSummary(node: CdmNode): FileSummary {
  const viewProps = getViewProperties(node.properties, CDM_VIEW_KEYS.file);
  const name = getStringProperty(viewProps, 'name') ?? node.externalId;
  const mimeType = getStringProperty(viewProps, 'mimeType');

  return {
    ref: { space: node.space, externalId: node.externalId },
    name,
    mimeType,
    lastModified: new Date(node.lastUpdatedTime),
  };
}

function fileRecency(file: FileSummary): number {
  return file.lastModified?.getTime() ?? 0;
}

function assetRelationFilter(assetRef: InstanceRef) {
  return {
    containsAny: {
      property: [CDM_VIEWS.file.space, CDM_VIEW_KEYS.file, 'assets'],
      values: [
        {
          space: assetRef.space,
          externalId: assetRef.externalId,
        },
      ],
    },
  };
}

export class ApiFileService implements FileService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetRef: InstanceRef): Promise<FileSummary[]> {
    try {
      const response = await this.client.instances.list({
        instanceType: 'node',
        sources: [
          {
            source: {
              type: 'view',
              space: CDM_VIEWS.file.space,
              externalId: CDM_VIEWS.file.externalId,
              version: CDM_VIEWS.file.version,
            },
          },
        ],
        filter: assetRelationFilter(assetRef),
        limit: 100,
      });

      return collectCdmNodes(response.items)
        .map(mapNodeToFileSummary)
        .sort((left, right) => fileRecency(right) - fileRecency(left));
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }

  async getDownloadUrl(ref: InstanceRef): Promise<string> {
    try {
      const links = await this.client.files.getDownloadUrls([
        {
          instanceId: {
            space: ref.space,
            externalId: ref.externalId,
          },
        },
      ]);

      const url = links[0]?.downloadUrl;
      if (!url) {
        throw new Error('Download URL not available for this file');
      }
      return url;
    } catch (error: unknown) {
      throw toServiceError(error);
    }
  }
}
