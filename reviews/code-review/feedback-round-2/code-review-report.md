# Asset 360 Investigation Workspace — Flows code review

This document is the platform review for Asset 360 Investigation Workspace, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix items**. The app clears the technical bar; proceed to `flows-design-review`.

### Reviewed commit

`3e288a88a06c8c53c0208d447e1f171b55556b7a` plus the uncommitted working tree at review time. Round 1 was run against the same tree before the coverage work landed.

## Round 1 follow-up

| Round 1 item | Status |
| --- | --- |
| MF-001 — line coverage 35.8%, below the 80% gate | **Resolved.** Full-scope line coverage is 97.56% across 179 tests in 27 files. |
| SF — no tests for `useAsset360DataViewModel` error paths or chart window resolution | **Resolved.** `src/view-models/useAsset360DataViewModel.test.tsx` covers loading, success, per-panel error isolation, 403 → `CdfAccessError`, latest-datapoint anchoring, and the wall-clock fallback. |
| SF — panel components may grow past review size limits | **Open** as SF-001. |

## Checks performed

Every hunt in `flows-review-checks` Step 1 was run; results are in `review-findings.md`. `code-quality` was pulled from `cognitedata/builder-skills` via `npx @cognite/cli apps skills pull` and its searches were run. Its fix steps were **not** applied.

- `npm run lint` — clean (0 errors, 0 warnings)
- `tsc` (via `npm run build`) — clean
- `npm run build` — succeeds
- `npm run test:coverage` — 179 tests, 27 files, all passing
- `npm outdated --json` / `npm audit --json` — see `review-packages.md`

## Coverage scope

This section exists because the printed percentage is only meaningful alongside what was measured.

**Measured:** all of `src/` — every feature, page, component, hook, view model, service, state module, and utility.

**Excluded, with justification:**

| Path | Reason | Allowed by the review bar |
| --- | --- | --- |
| `**/*.test.{ts,tsx}` | Test files | Yes — explicitly allowed |
| `src/main.tsx` | Bootstrap entry | Yes — explicitly allowed |
| `src/__mocks__/**` | Shared test fixtures, not production code | Test-support code, equivalent to `*.test.*` |
| `src/cognite-file-viewer/CogniteFileViewer.tsx`, `DocumentAnnotationOverlay.tsx`, `useViewport.ts`, `useDocumentAnnotations.ts`, `useFileResolver.ts`, `fileResolution.ts`, `index.ts`, `types.ts` | Vendored verbatim by the `integrate-file-viewer` skill; also ESLint-ignored on the same basis. The renderer assigns `pdfjs.GlobalWorkerOptions.workerSrc` at module scope and needs `ResizeObserver` plus real layout geometry, so it cannot mount under happy-dom. | Generated / vendored code |

**Deliberately not excluded:** `src/cognite-file-viewer/mimeTypes.ts`. `DocumentsPanel` imports `getViewerType` from it directly to decide inline preview versus external open, so it is app behaviour rather than renderer internals. It is measured at **100% lines** by `src/cognite-file-viewer/mimeTypes.test.ts`.

No feature, page, hook, component, service, or state file under `src/` is excluded, and no test file is on a test-exclude list.

### Measured result

| Metric | Value |
| --- | --- |
| Statements | 97.64% (540/553) |
| Branches | 88.88% (328/369) |
| Functions | 96.53% (167/173) |
| **Lines** | **97.56% (520/533)** |

Framework: Vitest 4.1.10 with the v8 provider. 179 passed, 0 failed, 0 skipped.

Every measured file is at or above 80% lines. The lowest are `ServicesProvider.tsx` (83.33%), `appState.ts` (87.5%), and `RecentlyViewedStorage.ts` (87.87%).

## Scores

| Area | Criterion | Score | Notes |
| --- | --- | --- | --- |
| User & customer | 1.1 Known bugs | 5 | App-level `AppErrorBoundary` plus a `PanelErrorBoundary` per panel; `PanelState` renders loading, empty, error, and no-access for every fetch surface. No TODOs, no `useEffect` leaks. One real defect found this round — an invalid asset link rendered an alert with no way back, because `PanelState` returns early on `error` and never rendered its children — was fixed at `src/features/asset-360/Asset360View.tsx:47-60` and is covered by a regression test. |
| User & customer | 1.3 Packages | 4 | Zero CVEs at any severity, nothing deprecated, lockfile committed. Three production deps one major behind (`react`, `react-dom`, `react-pdf`), each pinned by the Flows template or the file-viewer skill with a documented upgrade trigger. See `review-packages.md`. |
| User & customer | 1.4 Tests & coverage | 5 | Honest 97.56% line coverage at full `src/` scope; exclusions are limited to tests, `main.tsx`, fixtures, and the vendored renderer, and are enumerated above. Services, view models, panels, providers, boundaries, and utilities all carry co-located tests. |
| User & customer | 1.5 Dead code | 4 | No unused files, no unreachable pages, no commented-out blocks, no `console.log`, no production `any`, lint and `tsc` clean. Two panels exceed the 150-line bar (SF-001). |
| User & customer | 1.6 Patterns & testability | 5 | Every service is interface-first with an `Api*` implementation reached only through the `Services` type. Dependencies arrive through `ServicesContext`, `AppStateContext`, `RecentlyViewedContext`, and `HomeViewModelContext`. View models hold no state. `new CogniteClient` appears only in test fixtures. `vi.mock` is used exactly twice, both with a comment, and only for the vendored pdf.js module. |
| Cognite services | 2.1 DMS query patterns | 4 | Search uses `instances.search`; the asset header uses `instances.retrieve` by instance id. The three related-record panels use `instances.list` with a `containsAny` filter on the `assets` direct relation — correct and bounded, though a single `instances.query` could fetch all three in one round trip. |
| Cognite services | 2.2 Server-side filter | 5 | All filtering is expressed in the request. The `containsAny` asset-relation filter is server-side; no download-then-filter anywhere. Datapoints are bounded by an explicit start/end window. |
| Cognite services | 2.3 Limits & pages | 4 | Every call carries an explicit limit — 25 for search, 100 for each related list, 1000 datapoints. Nothing is unbounded and there is no prefetch or N+1. The related lists cap at 100 with no cursor, so an asset with more than 100 documents would silently truncate. |
| Cognite services | 2.4 Call rate | 5 | Search is debounced at 300 ms and gated at two characters. TanStack Query dedupes and caches by key. The chart explicitly does not poll or stream; it refetches only on selection change or the manual refresh control. |
| Cognite services | 2.5 429 backoff | 3 | No `QueuedTaskRunner` or explicit concurrency cap, and no `Retry-After` handling. TanStack Query provides bounded retries with exponential backoff, which per the bar caps this at 3. Mitigating: the app issues at most five concurrent CDF calls per asset view. SF-002. |
| Cognite services | 2.6 CDF Raw | N/A | No `client.raw`, `listRows`, `insertRows`, or `retrieveRow` anywhere in `src/`. |
| Brand | 3.1 Aura | 4 | Aura throughout: `Command` for search, `Card`, `Tabs`, `Badge`, `Button`, `Alert`, `EmptyState`, `Loader`, `Skeleton`, `Separator`, `Checkbox`. Components are imported from their own subpaths, not the barrel. The work-order and document tables are semantic HTML styled with Aura tokens rather than an Aura table primitive. |

## Must Fix

None.

## Should Fix

### SF-001: Two panels exceed the 150-line component bar

`src/features/asset-360/TimeSeriesPanel.tsx` is 231 lines and `src/features/asset-360/DocumentsPanel.tsx` is 217. Neither mixes SDK access with rendering — both receive their data through props — so this is size rather than a layering problem. Extracting the series picker from `TimeSeriesPanel` and the two preview sub-components from `DocumentsPanel` would bring both under the bar.

### SF-002: No concurrency cap or explicit 429 handling

Criterion 2.5. Adding `QueuedTaskRunner` (or an equivalent cap) around the four per-asset CDF calls, plus `Retry-After` handling, would move this to a pass. Current exposure is low because an asset view issues at most five concurrent calls.

### SF-003: Three production dependencies one major behind

`react` and `react-dom` at 18.3.1 (latest 19.2.8) and `react-pdf` at 9.2.1 (latest 10.5.0). Both upgrades are gated on upstream: React on the Flows template and `@cognite/aura`, react-pdf on the `integrate-file-viewer` skill. Track and adopt when upstream moves.

## Nice Fix

- **NF-001** — Main bundle is 1,345 kB (411 kB gzipped), over Vite's 500 kB warning. Dynamically importing Recharts and the pdf.js worker would cut initial load.
- **NF-002** — The vendored viewer's renderer, hooks, and `fileResolution.ts` are untested. Coverage upstream in the skill would let the exclusion list shrink to nothing.
- **NF-003** — `TimeSeriesPanel` fires a second `fetchChartData` on first selection, because resolving the chart window sets state that is also part of the query key. Harmless but avoidable by resolving the window before enabling the query.
- **NF-004** — Related-record lists cap at 100 with no cursor. Adding pagination would prevent silent truncation on assets with more than 100 documents or work orders.

## Summary

- Must Fix open: 0
- Should Fix open: 3
- Nice Fix open: 4
