export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type CdmNode = {
  instanceType: 'node';
  space: string;
  externalId: string;
  properties?: Record<string, unknown>;
  lastUpdatedTime: number;
};

export function isCdmNode(value: unknown): value is CdmNode {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.instanceType === 'node' &&
    typeof value.space === 'string' &&
    typeof value.externalId === 'string' &&
    typeof value.lastUpdatedTime === 'number'
  );
}

export function collectCdmNodes(items: unknown[]): CdmNode[] {
  const nodes: CdmNode[] = [];
  for (const item of items) {
    if (isCdmNode(item)) {
      nodes.push(item);
    }
  }
  return nodes;
}
