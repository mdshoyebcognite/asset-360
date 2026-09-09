# Asset 360 Investigation Workspace — Flows code review

This document is the platform review for Asset 360 Investigation Workspace, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix items**. The app clears the technical bar; proceed to `flows-design-review`.

### Reviewed commit

`9b45428bf97e18ade1a8feea6cd519f871ac079a` plus the uncommitted working tree at review time (chart redesign, alignment fixes, Aura chart tokens).

## Round 2 follow-up

| Round 2 item | Status |
| --- | --- |
| SF-001 — oversized panel components | **Open.** `TimeSeriesPanel.tsx` grew to 482 lines with chart stats/zoom; `DocumentsPanel.tsx` remains 217 lines. |
| SF-002 — no QueuedTaskRunner / 429 handling | **Open.** TanStack Query retries only. |
| NF — hard-coded `CHART_COLORS` hex array | **Resolved.** Chart now uses Aura `ChartContainer` with `var(--chart-*-color-1)` palette tokens. |

## Checks performed

Every hunt in `flows-review-checks` Step 1 was run; results are in `review-findings.md`. `flows-review-checks` and `code-quality` were pulled from `cognitedata/builder-skills` via `npx @cognite/cli apps skills pull`. Fix steps were **not** applied.

- `npm run lint` — clean (0 errors, 0 warnings)
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds (1,357 kB / 415 kB gzipped main chunk)
- `npx vitest run --coverage` — 220 tests, 30 files, all passing
- `npm outdated --json` / `npm audit` — see `review-packages.md`

## Coverage scope

**Measured:** all of `src/` — every feature, component, hook, view model, service, state module, and utility.

**Excluded, with justification:**

| Path | Reason | Allowed |
| --- | --- | --- |
| `**/*.test.{ts,tsx}` | Test files | Yes |
| `src/main.tsx` | Bootstrap entry | Yes |
| `src/__mocks__/**` | Shared test fixtures | Yes |
| `src/cognite-file-viewer/` renderer internals (8 files) | Vendored pdf.js bundle; cannot mount under happy-dom | Yes — generated/vendored |

`mimeTypes.ts` is measured at 100% lines. No feature, page, hook, component, service, or state file is excluded. No test file is on a test-exclude list.

### Measured result

| Metric | Value |
| --- | --- |
| Statements | 97.11% (640/659) |
| Branches | 90.21% (378/419) |
| Functions | 97.05% (198/204) |
| **Lines** | **97.16% (617/635)** |

Framework: Vitest 4.1.10 with v8 provider. 220 passed, 0 failed, 0 skipped.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5 | App-level and per-panel error boundaries; `PanelState` on every fetch surface. Datapoint timestamp `Date` vs `number` bug fixed with regression test. No TODOs, no `useEffect` leaks. |
| User & customer | 1.3 Packages | 4 | Zero critical/high CVEs in production. Four moderate dev-only vitest advisories. Three production deps one major behind (template pins). |
| User & customer | 1.4 Tests & coverage | 5 | Honest 97.16% line coverage at full `src/` scope. New `chartFormatting` and `seriesStats` helpers tested. Panel tests cover stat tiles, zoom, and checkbox alignment. |
| User & customer | 1.5 Dead code | 4 | No unused files, no unreachable routes, no `console.log`, no production `any`, lint/tsc clean. Two panels exceed 150-line bar (SF-001). |
| User & customer | 1.6 Patterns & testability | 5 | Interface-first services via `ServicesContext`; view models hold no state; `vi.mock` only twice with comments for vendored pdf.js. |
| Cognite services | 2.1 DMS query patterns | 4 | Search uses `instances.search`; header uses `instances.retrieve`; related records use bounded `instances.list` with `containsAny` filter. |
| Cognite services | 2.2 Server-side filter | 5 | All filtering in the request; datapoints bounded by explicit start/end window. |
| Cognite services | 2.3 Limits & pages | 4 | Limits on every call (25 search, 100 lists, 1000 datapoints). No cursor on related lists (NF-001). |
| Cognite services | 2.4 Call rate | 5 | Search debounced 300 ms; TanStack Query dedupes; chart manual refresh only. |
| Cognite services | 2.5 429 backoff | 3 | No `QueuedTaskRunner`; TanStack Query exponential backoff only (SF-002). |
| Cognite services | 2.6 CDF Raw | N/A | No Raw API usage. |
| Brand | 3.1 Aura | 5 | Aura throughout; chart on `ChartContainer`/`ChartTooltip` with themed palette tokens; checkbox slots fixed; components from subpaths. |

## Must Fix

None.

## Should Fix

- **SF-001** — Split `TimeSeriesPanel.tsx` (482 lines) and `DocumentsPanel.tsx` (217 lines) into smaller presentational subcomponents or hooks. _Impact:_ Large mixed files slow review and increase regression risk when extending chart or preview behaviour.
- **SF-002** — Add `QueuedTaskRunner` or explicit 429/`Retry-After` handling around CDF calls. _Impact:_ Under concurrent users or quota pressure, naive retries may amplify throttling.

## Nice Fix

- **NF-001** — Add cursor pagination or a "show more" control when related lists exceed 100 items.
- **NF-002** — Plan React 19 / react-pdf 10 upgrade when Flows template and file-viewer skill allow.
- **NF-003** — Bump vitest to ≥4.1.11 when the dependency range permits to clear dev-only moderate CVEs.

## Summary

- Must Fix open: 0
- Should Fix open: 2
- Nice Fix open: 3
