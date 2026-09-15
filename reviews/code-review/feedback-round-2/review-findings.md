# Findings: Asset 360 Investigation Workspace

Round 2. Every hunt from `flows-review-checks` Step 1 was run from the app root.

## Config inspected

- Coverage config file(s): `vitest.config.ts` (v8 provider, happy-dom environment).
- Production paths excluded from coverage:
  - `src/main.tsx` — allowed (bootstrap entry).
  - `src/__mocks__/**` — test fixtures, not production code.
  - `src/cognite-file-viewer/` — **7 of 9 files** excluded as vendored renderer code (see the coverage-scope section of `code-review-report.md` for the per-file justification). `mimeTypes.ts` is deliberately measured because the app imports `getViewerType` from it directly.
  - No feature, page, hook, component, service, or state file under `src/` is excluded.
- Tests excluded from the test run: none. `test.exclude` carries only vitest defaults plus `.claude/**` and `.agents/**` (skill folders, which contain no app tests).

## Searches

| Check | Hits (file:line or none) |
| --- | --- |
| ErrorBoundary | `src/components/AppErrorBoundary.tsx:13`, `src/components/PanelErrorBoundary.tsx:15`; mounted at `src/App.tsx:80` and `src/features/asset-360/Asset360View.tsx:69,97,110,123` |
| TODO / FIXME / HACK / XXX | none |
| `useEffect` without cleanup | none — `src/App.tsx:100` uses a `cancelled` flag; `src/features/asset-360/Asset360View.tsx:32` is a pure state sync with no subscription |
| Loading / error / empty state on fetch UI | `src/components/PanelState.tsx` renders all four states; used by every panel |
| coverage / test exclude | see "Config inspected" above |
| CDF Raw | none |
| `instances.list` / `query` / `search` / `retrieve` | `AssetSearchService.ts:45` (search), `AssetService.ts:41` (retrieve), `TimeSeriesService.ts:84` (list), `ActivityService.ts:63` (list), `FileService.ts:55` (list) |
| QueuedTaskRunner / cdfTaskRunner / 429 / backoff | none |
| `: any` / `as any` / `<any>` / `as unknown as` (production) | none |
| `vi.mock` | `src/features/asset-360/DocumentsPanel.test.tsx:17`, `src/features/asset-360/Asset360View.test.tsx:26` — both carry a comment explaining the vendored pdf.js constraint. All other hits are `vi.mocked(...)`, which is typed access to an injected fake, not module mocking. |
| lint | `npm run lint` — clean, 0 errors, 0 warnings |
| tsc | `tsc` via `npm run build` — clean, 0 errors |
| `new CogniteClient` | `src/__mocks__/contextFixtures.ts:76`, `src/App.test.tsx:40,47` — test-only. None in production; the app receives its client from `CogniteSdkProvider`. |
| Service classes | `ApiAssetSearchService`, `ApiAssetService`, `ApiTimeSeriesService`, `ApiActivityService`, `ApiFileService` — each implements a declared interface and is only referenced through `Services` |
| DI / ViewModel | `HomeViewModelContext` (`useHomeViewModel.ts:24`); `ServicesContext`, `AppStateContext`, `RecentlyViewedContext` under `src/state/` |
| `console.log` / `console.debug` | none. Two `console.error` calls, both inside `componentDidCatch`, which is their intended use. |
| Routes | Host-synced page state in `src/state/appState.ts`; both pages (`home`, `asset`) are reachable from `RoutedContent` |
| Unused production files | none |
| Components > 150 lines | `TimeSeriesPanel.tsx` (231), `DocumentsPanel.tsx` (217) — plus vendored `CogniteFileViewer.tsx` (480) and `DocumentAnnotationOverlay.tsx` (230), which are not builder code |

## Must / should / nice

### Must fix

None.

The round-1 Must Fix (MF-001, line coverage below the 80% gate) is resolved: full-scope line coverage is now **97.56%**, up from 35.8%.

### Should fix

- [ ] SF-001 — `src/features/asset-360/TimeSeriesPanel.tsx:1-231` and `src/features/asset-360/DocumentsPanel.tsx:1-217` exceed the 150-line component bar — criterion 1.5. Neither mixes SDK access with render (both take their data through props), so this is size, not layering.
- [ ] SF-002 — No `QueuedTaskRunner` / concurrency cap and no explicit 429 handling — criterion 2.5. TanStack Query supplies bounded retries with backoff, which caps this at 3.
- [ ] SF-003 — `react` / `react-dom` 18.3.1 and `react-pdf` 9.2.1 are each one major behind — criterion 1.3. Both versions are set by the Flows scaffold and the `integrate-file-viewer` skill respectively, not chosen here.

### Nice to fix

- [ ] NF-001 — Main bundle is 1,345 kB (411 kB gzipped); Recharts and the pdf.js worker could be dynamically imported.
- [ ] NF-002 — The vendored viewer's renderer, hooks, and `fileResolution.ts` remain untested; upstream coverage would let the exclusion list shrink to nothing.
- [ ] NF-003 — `TimeSeriesPanel` issues a second `fetchChartData` call on first selection, because resolving the chart window sets state that is also part of the query key. Harmless but avoidable.
