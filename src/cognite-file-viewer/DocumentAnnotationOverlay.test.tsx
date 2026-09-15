import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DocumentAnnotationOverlay,
  getAnnotationColor,
} from './DocumentAnnotationOverlay';
import type { DocumentAnnotation } from './types';

const annotation: DocumentAnnotation = {
  id: 'ann-1',
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.4,
  page: 1,
  resourceType: 'asset',
  annotationType: 'diagrams.AssetLink',
  text: 'P-101',
};

describe(DocumentAnnotationOverlay.name, () => {
  it('should render nothing when there are no annotations', () => {
    const { container } = render(
      <DocumentAnnotationOverlay
        annotations={[]}
        containerWidth={100}
        containerHeight={100}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should call onAnnotationClick when a rect is clicked', async () => {
    const user = userEvent.setup();
    const onAnnotationClick = vi.fn();

    render(
      <DocumentAnnotationOverlay
        annotations={[annotation]}
        containerWidth={200}
        containerHeight={200}
        onAnnotationClick={onAnnotationClick}
      />,
    );

    const rect = document.querySelector('rect');
    expect(rect).toBeTruthy();
    if (rect) {
      await user.click(rect);
    }
    expect(onAnnotationClick).toHaveBeenCalledWith(annotation);
  });

  it('should apply rotation transforms', () => {
    render(
      <DocumentAnnotationOverlay
        annotations={[annotation]}
        containerWidth={100}
        containerHeight={200}
        rotation={90}
      />,
    );
    const rect = document.querySelector('rect');
    expect(rect?.getAttribute('x')).toBe('40');
  });
});

describe(getAnnotationColor.name, () => {
  it('should return colors for known resource types', () => {
    expect(getAnnotationColor('asset').stroke).toMatch(/^rgb/);
  });
});
