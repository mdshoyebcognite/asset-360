import { describe, expect, it } from 'vitest';

import {
  getDirectRelationLabel,
  getDirectRelationListLabels,
  getNumberProperty,
  getStringProperty,
  getViewProperties,
  isRecord,
  parseTimestamp,
} from './cdmProperties';

describe(isRecord.name, () => {
  it('should accept a plain object', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('should reject null, arrays, and primitives', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord('text')).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe(getViewProperties.name, () => {
  it('should extract view properties nested under the CDM space', () => {
    const properties = {
      cdf_cdm: {
        'CogniteAsset/v1': { name: 'Pump 101', description: 'Main feed pump' },
      },
    };

    const viewProps = getViewProperties(properties, 'CogniteAsset/v1');

    expect(getStringProperty(viewProps, 'name')).toBe('Pump 101');
    expect(getStringProperty(viewProps, 'description')).toBe('Main feed pump');
  });

  it('should return an empty object when properties are not a record', () => {
    expect(getViewProperties(undefined, 'CogniteAsset/v1')).toEqual({});
    expect(getViewProperties('nope', 'CogniteAsset/v1')).toEqual({});
  });

  it('should return an empty object when the CDM space is absent', () => {
    expect(getViewProperties({ other_space: {} }, 'CogniteAsset/v1')).toEqual({});
  });

  it('should return an empty object when the view key is absent', () => {
    expect(getViewProperties({ cdf_cdm: { 'CogniteFile/v1': {} } }, 'CogniteAsset/v1')).toEqual({});
  });
});

describe(getStringProperty.name, () => {
  it('should return a non-empty string value', () => {
    expect(getStringProperty({ name: 'Pump' }, 'name')).toBe('Pump');
  });

  it('should return undefined for empty, missing, or non-string values', () => {
    expect(getStringProperty({ name: '' }, 'name')).toBeUndefined();
    expect(getStringProperty({}, 'name')).toBeUndefined();
    expect(getStringProperty({ name: 42 }, 'name')).toBeUndefined();
  });
});

describe(getNumberProperty.name, () => {
  it('should return a numeric value', () => {
    expect(getNumberProperty({ count: 7 }, 'count')).toBe(7);
    expect(getNumberProperty({ count: 0 }, 'count')).toBe(0);
  });

  it('should return undefined for missing or non-numeric values', () => {
    expect(getNumberProperty({}, 'count')).toBeUndefined();
    expect(getNumberProperty({ count: '7' }, 'count')).toBeUndefined();
  });
});

describe(getDirectRelationLabel.name, () => {
  it('should return the external id of a direct relation', () => {
    expect(getDirectRelationLabel({ space: 'cdf_cdm', externalId: 'AREA-1' })).toBe('AREA-1');
  });

  it('should return undefined when the value is not a direct relation', () => {
    expect(getDirectRelationLabel(null)).toBeUndefined();
    expect(getDirectRelationLabel(['AREA-1'])).toBeUndefined();
  });

  it('should return undefined when the external id is empty or not a string', () => {
    expect(getDirectRelationLabel({ externalId: '' })).toBeUndefined();
    expect(getDirectRelationLabel({ externalId: 12 })).toBeUndefined();
  });
});

describe(getDirectRelationListLabels.name, () => {
  it('should map a list of direct relations to their external ids', () => {
    const value = [{ externalId: 'AREA-1' }, { externalId: 'AREA-2' }];

    expect(getDirectRelationListLabels(value)).toEqual(['AREA-1', 'AREA-2']);
  });

  it('should drop entries that carry no usable external id', () => {
    const value = [{ externalId: 'AREA-1' }, null, { externalId: '' }, 'AREA-3'];

    expect(getDirectRelationListLabels(value)).toEqual(['AREA-1']);
  });

  it('should return an empty array when the value is not a list', () => {
    expect(getDirectRelationListLabels(undefined)).toEqual([]);
    expect(getDirectRelationListLabels({ externalId: 'AREA-1' })).toEqual([]);
  });
});

describe(parseTimestamp.name, () => {
  it('should parse epoch milliseconds', () => {
    expect(parseTimestamp(1714521600000)).toEqual(new Date(1714521600000));
  });

  it('should parse an ISO date string', () => {
    expect(parseTimestamp('2024-05-01T00:00:00.000Z')).toEqual(
      new Date('2024-05-01T00:00:00.000Z'),
    );
  });

  it('should return undefined for unparseable strings and other types', () => {
    expect(parseTimestamp('not a date')).toBeUndefined();
    expect(parseTimestamp(null)).toBeUndefined();
    expect(parseTimestamp({ when: 'now' })).toBeUndefined();
  });
});
