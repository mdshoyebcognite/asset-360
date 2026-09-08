import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import {
  ApiActivityService,
  ApiAssetSearchService,
  ApiAssetService,
  ApiFileService,
  ApiTimeSeriesService,
  type Services,
} from '../services';

import { ServicesContext } from './servicesContext';

type ServicesProviderProps = {
  children: ReactNode;
  services?: Services;
};

export function ServicesProvider({ children, services }: ServicesProviderProps) {
  const client = useCogniteSdk();

  const resolvedServices = useMemo(() => {
    if (services) {
      return services;
    }
    return {
      assetSearchService: new ApiAssetSearchService(client),
      assetService: new ApiAssetService(client),
      timeSeriesService: new ApiTimeSeriesService(client),
      activityService: new ApiActivityService(client),
      fileService: new ApiFileService(client),
    };
  }, [client, services]);

  return (
    <ServicesContext.Provider value={resolvedServices}>{children}</ServicesContext.Provider>
  );
}
