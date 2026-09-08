import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cognite/aura/components/command';
import { Loader } from '@cognite/aura/components/loader';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import type { AssetSummary } from '../../types/domain';
import { encodeInstanceRef } from '../../types/instanceRef';

type AssetSearchComboboxProps = {
  onSearch: (query: string) => Promise<AssetSummary[]>;
  onSelect: (asset: AssetSummary) => void;
};

export function AssetSearchCombobox({ onSearch, onSelect }: AssetSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<number | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  const searchQuery = useQuery({
    queryKey: ['asset-search', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    queryFn: () => onSearch(debouncedQuery),
  });

  const results = debouncedQuery.length >= 2 ? (searchQuery.data ?? []) : [];
  const isSearching = searchQuery.isFetching;
  const searchError = searchQuery.error instanceof Error ? searchQuery.error.message : null;

  const options = results.map((asset) => ({
    asset,
    value: encodeInstanceRef(asset.ref),
    label: `${asset.tag} — ${asset.name}`,
  }));

  return (
    <div className="w-full">
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search by tag, name, or description..."
          value={query}
          onValueChange={handleQueryChange}
        />
        <CommandList>
          {isSearching ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <Loader size={16} />
              <span>Searching assets...</span>
            </div>
          ) : null}
          {!isSearching && debouncedQuery.length >= 2 && options.length === 0 && !searchError ? (
            <CommandEmpty>
              No assets matched your search. Try a different tag, name, or description.
            </CommandEmpty>
          ) : null}
          {searchError ? (
            <div className="p-4 text-sm text-destructive">{searchError}</div>
          ) : null}
          <CommandGroup heading="Assets">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => onSelect(option.asset)}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{option.label}</span>
                  {option.asset.description ? (
                    <span className="text-sm text-muted-foreground">{option.asset.description}</span>
                  ) : null}
                  {option.asset.parentName ? (
                    <span className="text-xs text-muted-foreground">
                      Parent: {option.asset.parentName}
                    </span>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
