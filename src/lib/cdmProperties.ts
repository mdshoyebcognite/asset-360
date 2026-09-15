import { CDM_SPACE } from '../types/cdm';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getViewProperties(
  properties: unknown,
  viewKey: string,
): Record<string, unknown> {
  if (!isRecord(properties)) {
    return {};
  }
  const spaceProps = properties[CDM_SPACE];
  if (!isRecord(spaceProps)) {
    return {};
  }
  const viewProps = spaceProps[viewKey];
  if (!isRecord(viewProps)) {
    return {};
  }
  return viewProps;
}

export function getStringProperty(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getNumberProperty(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

export function getDirectRelationLabel(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const externalId = value.externalId;
  if (typeof externalId === 'string' && externalId.length > 0) {
    return externalId;
  }
  return undefined;
}

export function getDirectRelationListLabels(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => getDirectRelationLabel(item))
    .filter((label): label is string => label !== undefined);
}

export function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return undefined;
}
