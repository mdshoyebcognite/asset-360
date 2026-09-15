import { useContext } from 'react';

import { ServicesContext } from './servicesContext';

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
}
