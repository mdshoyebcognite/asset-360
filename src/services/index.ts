import type { ActivityService } from './ActivityService';
import type { AssetSearchService } from './AssetSearchService';
import type { AssetService } from './AssetService';
import type { FileService } from './FileService';
import type { TimeSeriesService } from './TimeSeriesService';

export type Services = {
  assetSearchService: AssetSearchService;
  assetService: AssetService;
  timeSeriesService: TimeSeriesService;
  activityService: ActivityService;
  fileService: FileService;
};

export type { ActivityService } from './ActivityService';
export type { AssetSearchService } from './AssetSearchService';
export type { AssetService } from './AssetService';
export type { FileService } from './FileService';
export type { TimeSeriesService } from './TimeSeriesService';
export { ApiActivityService } from './ActivityService';
export { ApiAssetSearchService } from './AssetSearchService';
export { ApiAssetService } from './AssetService';
export { ApiFileService } from './FileService';
export { ApiTimeSeriesService } from './TimeSeriesService';
export { CdfAccessError, isAccessDeniedError, toServiceError } from './errors';
