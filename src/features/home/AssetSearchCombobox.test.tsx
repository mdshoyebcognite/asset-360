import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAssetSummary, makeRef } from '../../__mocks__/domainFixtures';
import { Harness } from '../../__mocks__/testHarness';

import { AssetSearchCombobox } from './AssetSearchCombobox';

describe(AssetSearchCombobox.name, () => {
  it('should render the search prompt', () => {
    renderCombobox(<AssetSearchCombobox onSearch={vi.fn()} onSelect={vi.fn()} />);

    expect(
      screen.getByPlaceholderText('Search by tag, name, or description...'),
    ).toBeInTheDocument();
  });

  it('should not search for queries shorter than two characters', async () => {
    const onSearch = vi.fn(() => Promise.resolve([]));
    renderCombobox(<AssetSearchCombobox onSearch={onSearch} onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'P');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('should search once the query is long enough', async () => {
    const onSearch = vi.fn(() => Promise.resolve([makeAssetSummary()]));
    renderCombobox(<AssetSearchCombobox onSearch={onSearch} onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'PUMP');

    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('PUMP'));
  });

  it('should render ranked results with tag, name, and disambiguating context', async () => {
    const onSearch = vi.fn(() =>
      Promise.resolve([
        makeAssetSummary(),
        makeAssetSummary({
          ref: makeRef('PUMP-102'),
          tag: 'PUMP-102',
          name: 'Standby pump',
          description: 'Backup feed water pump',
          parentName: 'Utilities area',
        }),
      ]),
    );
    renderCombobox(<AssetSearchCombobox onSearch={onSearch} onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'PUMP');

    expect(await screen.findByText('PUMP-101 — Feed water pump')).toBeInTheDocument();
    expect(screen.getByText('PUMP-102 — Standby pump')).toBeInTheDocument();
    expect(screen.getAllByText('Parent: Utilities area')).toHaveLength(2);
  });

  it('should show a refine-your-search empty state when nothing matches', async () => {
    const onSearch = vi.fn(() => Promise.resolve([]));
    renderCombobox(<AssetSearchCombobox onSearch={onSearch} onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'ZZZZ');

    expect(
      await screen.findByText(
        'No assets matched your search. Try a different tag, name, or description.',
      ),
    ).toBeInTheDocument();
  });

  it('should surface a search failure inline', async () => {
    const onSearch = vi.fn(() => Promise.reject(new Error('Search backend unavailable')));
    renderCombobox(<AssetSearchCombobox onSearch={onSearch} onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox'), 'PUMP');

    expect(await screen.findByText('Search backend unavailable')).toBeInTheDocument();
  });

  it('should pass the chosen asset to the caller', async () => {
    const asset = makeAssetSummary();
    const onSelect = vi.fn();
    renderCombobox(
      <AssetSearchCombobox onSearch={() => Promise.resolve([asset])} onSelect={onSelect} />,
    );

    await userEvent.type(screen.getByRole('combobox'), 'PUMP');
    await userEvent.click(await screen.findByText('PUMP-101 — Feed water pump'));

    expect(onSelect).toHaveBeenCalledWith(asset);
  });
});

function renderCombobox(ui: ReactNode) {
  return render(<Harness>{ui}</Harness>);
}
