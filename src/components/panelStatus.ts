import { CdfAccessError } from '../services';

export type PanelStatus = 'loading' | 'success' | 'empty' | 'error' | 'no-access';

export function resolvePanelStatus(params: {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
}): PanelStatus {
  if (params.isLoading) {
    return 'loading';
  }
  if (params.error instanceof CdfAccessError) {
    return 'no-access';
  }
  if (params.error) {
    return 'error';
  }
  if (params.isEmpty) {
    return 'empty';
  }
  return 'success';
}
