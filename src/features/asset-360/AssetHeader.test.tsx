import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeAssetDetail } from '../../__mocks__/domainFixtures';

import { AssetHeader } from './AssetHeader';

describe(AssetHeader.name, () => {
  it('should render tag, name, type, and description', () => {
    render(<AssetHeader asset={makeAssetDetail()} />);

    expect(screen.getByText('Feed water pump')).toBeInTheDocument();
    expect(screen.getByText('PUMP-101')).toBeInTheDocument();
    expect(screen.getByText('Pump')).toBeInTheDocument();
    expect(screen.getByText('Primary feed water pump on train A')).toBeInTheDocument();
  });

  it('should render parent location context', () => {
    render(<AssetHeader asset={makeAssetDetail({ parentName: 'Utilities area' })} />);

    expect(screen.getByText('Location: Utilities area')).toBeInTheDocument();
  });

  it('should omit optional fields when absent', () => {
    render(
      <AssetHeader
        asset={makeAssetDetail({
          description: undefined,
          parentName: undefined,
          typeName: undefined,
        })}
      />,
    );

    expect(screen.getByText('Feed water pump')).toBeInTheDocument();
    expect(screen.queryByText('Pump')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Location:/)).not.toBeInTheDocument();
  });
});
