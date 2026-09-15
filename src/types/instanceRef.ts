export type InstanceRef = {
  space: string;
  externalId: string;
};

const REF_SEPARATOR = ':';

export function encodeInstanceRef(ref: InstanceRef): string {
  return `${ref.space}${REF_SEPARATOR}${ref.externalId}`;
}

export function decodeInstanceRef(encoded: string): InstanceRef | null {
  const separatorIndex = encoded.indexOf(REF_SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === encoded.length - 1) {
    return null;
  }
  return {
    space: encoded.slice(0, separatorIndex),
    externalId: encoded.slice(separatorIndex + 1),
  };
}

export function instanceRefKey(ref: InstanceRef): string {
  return encodeInstanceRef(ref);
}
