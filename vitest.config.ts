import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.claude/',
        '.agents/',
        'vitest.setup.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/__mocks__/**',
        'src/main.tsx',
        // Vendored verbatim from the integrate-file-viewer skill (also ESLint-ignored):
        // the pdf.js renderer and its internal hooks cannot mount under happy-dom.
        // mimeTypes.ts is deliberately NOT excluded — the app imports getViewerType
        // directly, so that seam stays measured.
        'src/cognite-file-viewer/CogniteFileViewer.tsx',
        'src/cognite-file-viewer/DocumentAnnotationOverlay.tsx',
        'src/cognite-file-viewer/fileResolution.ts',
        'src/cognite-file-viewer/useDocumentAnnotations.ts',
        'src/cognite-file-viewer/useFileResolver.ts',
        'src/cognite-file-viewer/useViewport.ts',
        'src/cognite-file-viewer/index.ts',
        'src/cognite-file-viewer/types.ts',
      ],
    },
  },
});
