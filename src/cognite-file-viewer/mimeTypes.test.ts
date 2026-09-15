import { describe, expect, it } from 'vitest';

import {
  doesDocumentPreviewApiSupportFile,
  getComputedMimeType,
  getViewerType,
  inferMimeTypeFromUrl,
  isNativelySupportedMimeType,
} from './mimeTypes';

describe(getViewerType.name, () => {
  it('should route PDFs to the pdf viewer', () => {
    expect(getViewerType('application/pdf')).toBe('pdf');
  });

  it('should route the image formats in scope to the image viewer', () => {
    expect(getViewerType('image/png')).toBe('image');
    expect(getViewerType('image/jpeg')).toBe('image');
    expect(getViewerType('image/webp')).toBe('image');
    expect(getViewerType('image/svg+xml')).toBe('image');
    expect(getViewerType('image/tiff')).toBe('image');
  });

  it('should route plain text formats to the text viewer', () => {
    expect(getViewerType('text/plain')).toBe('text');
    expect(getViewerType('text/csv')).toBe('text');
    expect(getViewerType('application/json')).toBe('text');
  });

  it('should route Office documents to the pdf viewer via conversion', () => {
    expect(getViewerType('application/msword')).toBe('pdf');
    expect(getViewerType('application/vnd.ms-excel')).toBe('pdf');
  });

  it('should canonicalise legacy mime spellings before routing', () => {
    expect(getViewerType('image/jpg')).toBe('image');
    expect(getViewerType('image/tif')).toBe('image');
    expect(getViewerType('image/svg')).toBe('image');
    expect(getViewerType('application/txt')).toBe('text');
  });

  it('should report unsupported for CAD, video, and missing types', () => {
    expect(getViewerType('application/acad')).toBe('unsupported');
    expect(getViewerType('video/mp4')).toBe('unsupported');
    expect(getViewerType(undefined)).toBe('unsupported');
  });
});

describe(isNativelySupportedMimeType.name, () => {
  it('should accept images, PDFs, and text', () => {
    expect(isNativelySupportedMimeType('application/pdf')).toBe(true);
    expect(isNativelySupportedMimeType('image/png')).toBe(true);
    expect(isNativelySupportedMimeType('text/csv')).toBe(true);
  });

  it('should reject Office documents and missing types', () => {
    expect(isNativelySupportedMimeType('application/msword')).toBe(false);
    expect(isNativelySupportedMimeType(undefined)).toBe(false);
    expect(isNativelySupportedMimeType(null)).toBe(false);
  });
});

describe(inferMimeTypeFromUrl.name, () => {
  it('should infer a type from a file extension', () => {
    expect(inferMimeTypeFromUrl('drawing.pdf')).toBe('application/pdf');
    expect(inferMimeTypeFromUrl('photo.JPEG')).toBe('image/jpeg');
  });

  it('should ignore query strings and fragments', () => {
    expect(inferMimeTypeFromUrl('https://files.test/a/b.png?sig=xyz#page=2')).toBe('image/png');
  });

  it('should return undefined when there is no usable extension', () => {
    expect(inferMimeTypeFromUrl('README')).toBeUndefined();
    expect(inferMimeTypeFromUrl('archive.')).toBeUndefined();
    expect(inferMimeTypeFromUrl('.gitignore')).toBeUndefined();
    expect(inferMimeTypeFromUrl('model.dwg')).toBeUndefined();
  });
});

describe(getComputedMimeType.name, () => {
  it('should prefer the declared mime type', () => {
    expect(getComputedMimeType({ mimeType: 'application/pdf', name: 'a.png' })).toBe(
      'application/pdf',
    );
  });

  it('should canonicalise the declared mime type', () => {
    expect(getComputedMimeType({ mimeType: 'image/jpg' })).toBe('image/jpeg');
  });

  it('should fall back to the file name when no mime type is declared', () => {
    expect(getComputedMimeType({ name: 'diagram.png' })).toBe('image/png');
  });

  it('should return undefined when neither source resolves', () => {
    expect(getComputedMimeType({})).toBeUndefined();
    expect(getComputedMimeType({ name: 'unknown.zzz' })).toBeUndefined();
  });
});

describe(doesDocumentPreviewApiSupportFile.name, () => {
  it('should accept Office files by mime type', () => {
    expect(doesDocumentPreviewApiSupportFile({ mimeType: 'application/msword' })).toBe(true);
  });

  it('should accept Office files by extension', () => {
    expect(doesDocumentPreviewApiSupportFile({ name: 'report.docx' })).toBe(true);
    expect(doesDocumentPreviewApiSupportFile({ name: 'budget.XLSX' })).toBe(true);
  });

  it('should reject files the preview API cannot convert', () => {
    expect(doesDocumentPreviewApiSupportFile({ mimeType: 'application/pdf' })).toBe(false);
    expect(doesDocumentPreviewApiSupportFile({ name: 'layout.dwg' })).toBe(false);
    expect(doesDocumentPreviewApiSupportFile({})).toBe(false);
  });
});
