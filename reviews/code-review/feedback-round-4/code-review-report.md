# Code review — feedback round 4 (engineering remediation)

**Date:** 2026-03-15  
**Scope:** Full `src/` line coverage (no `cognite-file-viewer` excludes), engineering Must/Should fixes from Cognite review.

## Summary

| Gate | Result |
|------|--------|
| ESLint | Pass (file-viewer linted with vendored-rule overrides) |
| `tsc` + `vite build` | Pass |
| Vitest ≥ 4.1.11 | Pass (4.1.11) |
| Line coverage (honest `src/`) | Pass (≥ 80%) |
| Must Fix (engineering) | **0 open** |

## Must fix — status

1. **Coverage includes file viewer** — Removed all `src/cognite-file-viewer/**` entries from `vitest.config.ts` `coverage.exclude`. Added unit/hook/component tests for resolution, annotations core, hooks, overlay, and viewer branches.
2. **Bounded diagram annotations** — `documentAnnotationsCore.ts` page-scoped fetch with `ANNOTATION_PAGE_LIMIT` / `MAX_ANNOTATION_QUERY_PAGES`, per-page cache, user hint when capped.
3. **Dead `utils.ts` / unused deps** — Deleted `src/lib/utils.ts`; removed `clsx` and `tailwind-merge`.
4. **react-pdf upgrade** — Upgraded **9.2.1 → 11.0.0** with **React 19** (required peer for react-pdf 11). Build and full test suite pass.

## Should fix — status

5. **CDF concurrency** — `cdfTaskRunner` (`QueuedTaskRunner`, concurrency 5) wraps SDK calls in services and file-viewer fetch paths.
6. **Chart query extraction** — `useTimeSeriesChartQuery` hook; `TimeSeriesPanel` slimmed.
7. **SDK in Documents panel** — `useCogniteSdk` only in `Asset360View`; `DocumentsPanel` receives `cogniteClient` prop.
8. **Host connect failure** — `App.tsx` `.catch` on `connectToHostApp`; renders Fusion host error UI.
9. **ESLint file viewer** — Removed global ignore; targeted overrides for vendored patterns.
10. **Vitest advisory** — Bumped to **4.1.11**; added `@testing-library/dom` dev dependency.
11. **Table a11y** — `aria-label` on documents and work orders tables.
12. **100-row cap warnings** — `ListResult` + `truncated` on list services; Aura alerts on panels.

## Notes for resubmission

- PR description should note React **19** bump alongside react-pdf **11**.
- Resubmit certification with new commit SHA after merge/push.
