# File inventory: Asset 360 Investigation Workspace

Scope: every `.ts` / `.tsx` under `src/`, plus `vite.config.ts` and `vitest.config.ts`.
Excluded from the walk: `node_modules`, `dist`, `.cognite-bundles`.

Legend — Tests: `✓` co-located `*.test.ts(x)`; `✗` none; `n/a` type-only, barrel, or test fixture.

## Application source

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/App.tsx` | 125 | Good | Good | Good | ✓ | Bootstrap + host handshake + routing. `deps` prop makes `connectToHostApp` / `createClient` injectable. |
| `src/main.tsx` | 24 | Good | Good | n/a | n/a | Entry file; exempt per test-first rules. |
| `src/lib/utils.ts` | 6 | Good | Good | n/a | n/a | `cn()` class-merge helper only. |

## Features

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/features/asset-360/Asset360View.tsx` | 140 | Good | Good | Good | ✓ | Composes panels; data comes from `useAsset360DataViewModel`; each panel wrapped in `PanelErrorBoundary`. Under the 150-line bar. |
| `src/features/asset-360/AssetHeader.tsx` | 35 | Good | Good | Good | ✓ | Pure presentational. |
| `src/features/asset-360/TimeSeriesPanel.tsx` | 231 | Fair | Good | Good | ✓ | Over 150 lines. Fetch is injected via props (`fetchChartData` / `resolveChartWindow`), so it does not mix SDK access with render, but chart config and series picker could split. Should Fix SF-001. |
| `src/features/asset-360/DocumentsPanel.tsx` | 217 | Fair | Good | Good | ✓ | Over 150 lines; contains two local sub-components (`DocumentPreview`, `UnsupportedFilePreview`). Should Fix SF-001. |
| `src/features/asset-360/WorkOrdersPanel.tsx` | 141 | Good | Good | Good | ✓ | Under the bar; props-driven. |
| `src/features/home/HomeView.tsx` | 51 | Good | Good | Good | ✓ | Renders from `useHomeViewModel`. |
| `src/features/home/AssetSearchCombobox.tsx` | 100 | Good | Good | Good | ✓ | Aura `Command`; debounced; search fn injected via props. |
| `src/features/home/RecentlyViewedList.tsx` | 55 | Good | Good | Good | ✓ | Pure presentational with empty state. |

## View models

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/view-models/useHomeViewModel.ts` | 63 | Good | Good | Good | ✓ | Context-injected deps (`HomeViewModelContext`); holds no state itself. |
| `src/view-models/useAsset360DataViewModel.ts` | 126 | Good | Good | Good | ✓ | Four independent TanStack queries so panels fail independently; maps 403 to `CdfAccessError`. |

## Services

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/services/index.ts` | 25 | Good | Good | Good | n/a | Barrel + `Services` type. |
| `src/services/AssetSearchService.ts` | 62 | Good | Good | Good | ✓ | Interface + `ApiAssetSearchService`; `instances.search` with `limit: 25`. |
| `src/services/AssetService.ts` | 74 | Good | Good | Good | ✓ | `instances.retrieve` by instance id. |
| `src/services/TimeSeriesService.ts` | 175 | Good | Good | Good | ✓ | `instances.list` + datapoints API; malformed datapoints dropped rather than thrown. |
| `src/services/ActivityService.ts` | 86 | Good | Good | Good | ✓ | `instances.list`, sorted by end / scheduled end descending. |
| `src/services/FileService.ts` | 99 | Good | Good | Good | ✓ | `instances.list` + `files.getDownloadUrls`; sorted by recency. |
| `src/services/errors.ts` | 32 | Good | Good | Good | ✓ | `CdfAccessError` + `toServiceError` type guards. |

## State

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/state/AppStateProvider.tsx` | 51 | Good | Good | Good | ✓ | Covered by `providers.test.tsx`. Seeds from host `initialState`, pushes via `syncInternalState`. |
| `src/state/RecentlyViewedProvider.tsx` | 51 | Good | Good | Good | ✓ | Covered by `providers.test.tsx`; storage injectable. |
| `src/state/ServicesProvider.tsx` | 39 | Good | Good | Good | ✓ | Covered indirectly; accepts a `services` override. |
| `src/state/RecentlyViewedStorage.ts` | 102 | Good | Good | Good | ✓ | Interface + `LocalRecentlyViewedStorage`; validates stored shape. |
| `src/state/appState.ts` | 42 | Good | Good | Good | ✓ | `parseAppState` type guard for host state. |
| `src/state/useAppState.ts` | 11 | Good | Good | Good | ✓ | Covered by `providers.test.tsx` guard tests. |
| `src/state/useRecentlyViewed.ts` | 11 | Good | Good | Good | ✓ | Same. |
| `src/state/useServices.ts` | 11 | Good | Good | Good | ✓ | Same. |
| `src/state/appStateContext.ts` | 11 | Good | Good | Good | n/a | Context object only. |
| `src/state/recentlyViewedContext.ts` | 11 | Good | Good | Good | n/a | Context object only. |
| `src/state/servicesContext.ts` | 5 | Good | Good | Good | n/a | Context object only. |
| `src/state/recentlyViewedConstants.ts` | 2 | Good | Good | Good | n/a | Constants only. |

## Shared components and lib

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/components/AppErrorBoundary.tsx` | 46 | Good | Good | Good | ✓ | App-level boundary with reload affordance. |
| `src/components/PanelErrorBoundary.tsx` | 56 | Good | Good | Good | ✓ | Per-panel boundary with retry; resets on new children. |
| `src/components/PanelState.tsx` | 81 | Good | Good | Good | ✓ | Renders loading / empty / error / no-access. |
| `src/components/panelStatus.ts` | 23 | Good | Good | Good | ✓ | Pure status resolver. |
| `src/lib/cdmProperties.ts` | 72 | Good | Good | Good | ✓ | Pure CDM property readers; all exports and branches covered. |
| `src/lib/nodeGuards.ts` | 33 | Good | Good | Good | ✓ | Type guards for DMS node payloads. |

## Types

| File | Lines | Tests | Notes |
| --- | --- | --- | --- |
| `src/types/cdm.ts` | 21 | n/a | View coordinates: `cdf_cdm` + `CogniteAsset/TimeSeries/Activity/File` at `v1`. |
| `src/types/domain.ts` | 55 | n/a | Domain types only. |
| `src/types/instanceRef.ts` | 25 | ✓ | Encode / decode `space:externalId`. |

## Test fixtures (not production code)

| File | Lines | Notes |
| --- | --- | --- |
| `src/__mocks__/domainFixtures.ts` | 92 | Domain object factories. |
| `src/__mocks__/contextFixtures.ts` | 78 | Service / context / SDK-deps factories. Service methods reject by default so unstubbed calls fail loudly. |
| `src/__mocks__/testHarness.tsx` | 55 | `Harness` provider wrapper. |

## Vendored — `src/cognite-file-viewer/`

Copied verbatim by the `integrate-file-viewer` skill. ESLint-ignored in `eslint.config.mjs`.

| File | Lines | Tests | Measured for coverage | Notes |
| --- | --- | --- | --- | --- |
| `mimeTypes.ts` | 171 | ✓ | **Yes** | The app imports `getViewerType` directly, so this seam is tested and measured (100% lines). |
| `CogniteFileViewer.tsx` | 480 | ✗ | No | pdf.js renderer; sets `pdfjs.GlobalWorkerOptions.workerSrc` at module scope and cannot mount under happy-dom. |
| `DocumentAnnotationOverlay.tsx` | 230 | ✗ | No | Renders only inside a loaded PDF page. |
| `useViewport.ts` | 280 | ✗ | No | Requires `ResizeObserver` and real layout geometry. |
| `useDocumentAnnotations.ts` | 269 | ✗ | No | Internal to the renderer. |
| `useFileResolver.ts` | 123 | ✗ | No | Internal to the renderer. |
| `fileResolution.ts` | 133 | ✗ | No | Internal to the renderer. |
| `index.ts` | 40 | n/a | No | Barrel. |
| `types.ts` | 189 | n/a | No | Types only. |

## Config

| File | Notes |
| --- | --- |
| `vite.config.ts` | `manifestCspPlugin()` first, then react / mkcert / fusionOpen / tailwind. Dev port 3001. `optimizeDeps.exclude: ['pdfjs-dist']`. |
| `vitest.config.ts` | happy-dom, v8 coverage. Exclusions enumerated in `code-review-report.md`. |
