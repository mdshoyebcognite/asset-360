# Findings: Asset 360 Investigation Workspace

## Config inspected

- Coverage config file(s): `vitest.config.ts` (merged with `vite.config.ts` via `defineConfig`)
- Production paths excluded from coverage: `src/__mocks__/**`, `src/main.tsx`, vendored `src/cognite-file-viewer/` renderer internals (8 files). `mimeTypes.ts` is deliberately measured.
- Tests excluded from the test run: `.claude/**`, `.agents/**` only — no production test files excluded.

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/AppErrorBoundary.tsx:13-20`, `src/components/PanelErrorBoundary.tsx:15-25`, wired in `src/App.tsx:80` and `src/features/asset-360/Asset360View.tsx:69-133` |
| TODO/FIXME | none |
| coverage/test exclude | Allowed excludes only — see config inspected |
| CDF Raw | none |
| instances.list/query/search | `AssetSearchService.ts:45` search; `AssetService.ts:41` retrieve; `TimeSeriesService.ts:97`, `ActivityService.ts:63`, `FileService.ts:55` list with `containsAny` filter; `useDocumentAnnotations.ts:96` query |
| QueuedTaskRunner / 429 | none |
| any / vi.mock | `any`: none in production. `vi.mock`: `Asset360View.test.tsx:26`, `DocumentsPanel.test.tsx:17` — both commented (vendored pdf.js) |
| lint / tsc | `npm run lint` — 0 errors. `npx tsc --noEmit` — clean |
| CogniteClient / DI / ViewModel | `new CogniteClient` only in `src/__mocks__/contextFixtures.ts:76` and `src/App.test.tsx:40,47`. Services injected via `ServicesContext`; view models in `src/view-models/`; no `useQuery` in page components |
| unused files / console.log | none / none |
| components > 150 lines | `TimeSeriesPanel.tsx` (482), `DocumentsPanel.tsx` (217) |

## Must / should / nice

### Must Fix

None.

### Should Fix

- [ ] SF-001 — `src/features/asset-360/TimeSeriesPanel.tsx` (482 lines) and `src/features/asset-360/DocumentsPanel.tsx` (217 lines) mix chart/zoom/stat logic with render. Extract subcomponents or a chart hook. — criterion 1.5
- [ ] SF-002 — No `QueuedTaskRunner` or explicit 429/`Retry-After` handling; TanStack Query retries only. — criterion 2.5

### Nice Fix

- [ ] NF-001 — Related lists cap at 100 with no cursor; assets with >100 documents or work orders truncate silently. — criterion 2.3
- [ ] NF-002 — `react`, `react-dom`, `react-pdf` one major behind template pins; `@cognite/app-sdk` one minor behind. — criterion 1.3
- [ ] NF-003 — Four moderate CVEs in `vitest` dev dependency chain (`npm audit`); no production impact. — criterion 1.3
