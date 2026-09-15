import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeRecentlyViewedAsset, makeRef } from '../../__mocks__/domainFixtures';

import { RecentlyViewedList } from './RecentlyViewedList';

describe(RecentlyViewedList.name, () => {
  it('should render an empty state when nothing has been viewed', () => {
    render(<RecentlyViewedList items={[]} onSelect={vi.fn()} />);

    expect(screen.getByText('No recently viewed assets')).toBeInTheDocument();
  });

  it('should render one card per viewed asset', () => {
    const items = [
      makeRecentlyViewedAsset(),
      makeRecentlyViewedAsset({
        ref: makeRef('VALVE-202'),
        tag: 'VALVE-202',
        name: 'Discharge valve',
      }),
    ];

    render(<RecentlyViewedList items={items} onSelect={vi.fn()} />);

    expect(screen.getByText('Feed water pump')).toBeInTheDocument();
    expect(screen.getByText('Discharge valve')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Open asset' })).toHaveLength(2);
  });

  it('should pass the encoded instance ref when an asset is opened', async () => {
    const onSelect = vi.fn();
    render(<RecentlyViewedList items={[makeRecentlyViewedAsset()]} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open asset' }));

    expect(onSelect).toHaveBeenCalledWith('cdf_cdm:PUMP-101');
  });
});
