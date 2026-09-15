export const RELATED_LIST_LIMIT = 100;

export type ListResult<T> = {
  items: T[];
  truncated: boolean;
};

export function listResultFromResponse<T>(
  items: T[],
  limit: number,
): ListResult<T> {
  return {
    items,
    truncated: items.length >= limit,
  };
}
