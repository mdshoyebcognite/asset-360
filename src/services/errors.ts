export class CdfAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CdfAccessError';
  }
}

export function isAccessDeniedError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }
  const status = error.status;
  if (status === 403) {
    return true;
  }
  const message = error.message;
  return typeof message === 'string' && message.toLowerCase().includes('access');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function toServiceError(error: unknown): Error {
  if (error instanceof Error) {
    if (isAccessDeniedError(error)) {
      return new CdfAccessError(error.message);
    }
    return error;
  }
  return new Error('An unexpected error occurred');
}
