import type { InstanceRef } from './instanceRef';

export type AssetSummary = {
  ref: InstanceRef;
  tag: string;
  name: string;
  description?: string;
  parentName?: string;
  typeName?: string;
};

export type AssetDetail = AssetSummary & {
  typeName?: string;
};

export type TimeSeriesSummary = {
  ref: InstanceRef;
  name: string;
  description?: string;
  unit?: string;
};

export type Datapoint = {
  timestamp: Date;
  value: number;
};

export type TimeSeriesDatapoints = {
  ref: InstanceRef;
  name: string;
  datapoints: Datapoint[];
};

export type ActivitySummary = {
  ref: InstanceRef;
  identifier: string;
  title: string;
  status?: string;
  date?: Date;
  description?: string;
};

export type FileSummary = {
  ref: InstanceRef;
  name: string;
  mimeType?: string;
  lastModified?: Date;
};

export type RecentlyViewedAsset = {
  ref: InstanceRef;
  tag: string;
  name: string;
  viewedAt: number;
};
