import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { computeBaseWidth, useViewport } from './useViewport';

describe(computeBaseWidth.name, () => {
  it('should return explicit width when fitMode is unset', () => {
    expect(
      computeBaseWidth(undefined, 400, { width: 800, height: 600 }, null),
    ).toBe(400);
  });

  it('should fit to container width when fitMode is width', () => {
    expect(
      computeBaseWidth('width', undefined, { width: 640, height: 480 }, null),
    ).toBe(640);
  });

  it('should fit entire page when fitMode is page', () => {
    const width = computeBaseWidth(
      'page',
      undefined,
      { width: 800, height: 600 },
      { width: 400, height: 800 },
    );
    expect(width).toBe(300);
  });
});

describe(useViewport.name, () => {
  it('should clamp zoom to min and max', () => {
    const onZoomChange = vi.fn();
    const { result } = renderHook(() =>
      useViewport({ minZoom: 0.5, maxZoom: 2, onZoomChange }),
    );

    act(() => {
      result.current.handleZoomChange(10);
    });
    expect(onZoomChange).toHaveBeenCalledWith(2);

    act(() => {
      result.current.handleZoomChange(0.1);
    });
    expect(onZoomChange).toHaveBeenLastCalledWith(0.5);
  });
});
