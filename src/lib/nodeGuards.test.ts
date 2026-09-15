import { describe, expect, it } from 'vitest';

import { isCdmNode, collectCdmNodes } from './nodeGuards';

describe('nodeGuards', () => {
  it('should identify cdm nodes', () => {
    expect(
      isCdmNode({
        instanceType: 'node',
        space: 'cdf_cdm',
        externalId: 'asset-1',
        lastUpdatedTime: 1,
      }),
    ).toBe(true);
  });

  it('should reject edges and invalid values', () => {
    expect(isCdmNode({ instanceType: 'edge', space: 'x', externalId: 'y', lastUpdatedTime: 1 })).toBe(
      false,
    );
    expect(isCdmNode(null)).toBe(false);
  });

  it('should collect only nodes from mixed lists', () => {
    const nodes = collectCdmNodes([
      { instanceType: 'node', space: 'cdf_cdm', externalId: 'a', lastUpdatedTime: 1 },
      { instanceType: 'edge', space: 'cdf_cdm', externalId: 'b', lastUpdatedTime: 1 },
    ]);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.externalId).toBe('a');
  });
});
