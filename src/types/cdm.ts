export const CDM_SPACE = 'cdf_cdm';

export const CDM_VIEWS = {
  asset: { space: CDM_SPACE, externalId: 'CogniteAsset', version: 'v1' },
  timeSeries: { space: CDM_SPACE, externalId: 'CogniteTimeSeries', version: 'v1' },
  activity: { space: CDM_SPACE, externalId: 'CogniteActivity', version: 'v1' },
  file: { space: CDM_SPACE, externalId: 'CogniteFile', version: 'v1' },
} as const;

export type CdmViewKey = keyof typeof CDM_VIEWS;

export function viewPropertyKey(view: { externalId: string; version: string }): string {
  return `${view.externalId}/${view.version}`;
}

export const CDM_VIEW_KEYS = {
  asset: viewPropertyKey(CDM_VIEWS.asset),
  timeSeries: viewPropertyKey(CDM_VIEWS.timeSeries),
  activity: viewPropertyKey(CDM_VIEWS.activity),
  file: viewPropertyKey(CDM_VIEWS.file),
} as const;
