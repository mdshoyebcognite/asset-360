# Design Review — Asset 360 Investigation Workspace — round 2

Assessed against the 10 quality-guideline questions in
[docs.cognite.com/cdf/flows/guides/quality-guidelines](https://docs.cognite.com/cdf/flows/guides/quality-guidelines).

Run after `flows-code-review` round 3 reached `Must Fix open: 0`.

## User and tasks

- **Primary user:** Operations Analyst / Reliability Engineer at an industrial facility. Reviews shift reports and alarms each morning; when equipment is flagged, investigates its history, current state, and documentation to brief the maintenance team. Works at a desk on a desktop or laptop with a large monitor, occasionally in the control room. (Source: `App-Brief.md` `userRole`.)
- **Tasks evaluated:**
  1. Find a flagged asset by its equipment tag and open its 360 view.
  2. Read the asset's current behaviour from its linked time series.
  3. Check recent work orders, then open the related document (P&ID or manual) needed to brief maintenance.
- **Context:** The analyst knows the tag but not where the data lives. Today this means SAP for work orders, a historian for sensor data, and SharePoint for drawings — 1–2 hours per asset. Success is completing the whole investigation on one page in minutes. Desktop-only is intended; mobile is out of scope for v1. Data source: live `publicdata` / `publicdatacdm`.

## Pre-scan evidence (automated probes)

| Probe | Result |
| --- | --- |
| Aura imports | 12 files import from `@cognite/aura` subpaths |
| Hard-coded hex in app code | none in `src/features/` or `src/components/` (vendored file-viewer only) |
| `rgb()`/`hsl()` in app code | none in features/components |
| Vague button labels | none |
| `<div onClick>` / `<span onClick>` | none |
| Empty states | `PanelState` + per-panel `emptyTitle` on every data surface |
| `aria-label` | Present on zoom controls and chart container |
| Responsive utilities | `sm:` breakpoints on chart stat grid, home layout, asset header |
| Viewport meta | Present in `index.html` |
| Build size | 1,357 kB raw / 415 kB gzipped |
| Destructive actions | none — read-only viewer |

## Task walkthrough findings

Round 1 walkthrough (live `publicdatacdm`, clean browser session) still applies — the chart redesign and alignment fixes do not change navigation or task flow.

- **Task 1 — Find and open an asset.** Search returns ranked matches; selecting one opens the 360 view and records it in recently viewed. Recently viewed cards now stretch full width with unwrapped titles. No pain points.
- **Task 2 — Read the time series.** Checkbox rows align on one line (name + description via `CheckboxItemDescription`). Chart fills the card width. Per-series MIN/MAX/AVERAGE/LATEST/DATAPOINTS stat tiles track the zoomed window. Zoom +/- and reset work; manual refresh only. Area chart uses Aura `ChartContainer` with themed palette tokens. No pain points.
- **Task 3 — Work orders and documents.** Unchanged from round 1 — inline detail expansion and document preview with external-open fallback. No pain points.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 5 | 12 files import Aura from subpaths. Chart rebuilt on `@cognite/aura/chart` (`ChartContainer`, `ChartTooltip`, `ChartLegend`) with `var(--chart-*-color-1)` palette tokens — the round 1 `CHART_COLORS` hex issue is resolved. Checkbox rows use proper Aura slots. Zero hard-coded colours in app feature code. | None. |
| Q2 Navigation & hierarchy | 4 | Asset header, tabs, and "Back to search" keep location clear. Host-synced state survives reload. No Fusion topbar/breadcrumbs. | Adopt Aura Topbar with breadcrumbs (`use-topbar` skill) for shell consistency. |
| Q3 Labels & language | 5 | No vague labels. Actions are specific: "Back to search", "View detail", "Refresh chart", "Open asset", etc. Search placeholder sits under a visible heading. | None. |
| Q4 Feedback & validation | 5 | `PanelState` on every fetch surface with loading, empty, error, and no-access states. Per-panel error boundaries. Chart shows range readout, stat tiles, and hover caption. Read-only — no mutations. | None. |
| Q5 Clickability | 5 | Zero `onClick` on non-semantic elements. All interactions through Aura `Button`, `CommandItem`, `CheckboxItemControl`, `TabsTrigger`. Zoom buttons have `aria-label`. | None. |
| Q6 Error prevention | 5 | Read-only viewer with no destructive actions. No delete/remove/archive/reset flows. Navigation is reversible via "Back to search". | None. |
| Q7 Responsive | 4 | Viewport meta present. `max-w-6xl` centred layout; `w-full` fixes on card children prevent width collapse. Stat grid uses `sm:grid-cols-5`. Tables in `overflow-x-auto`. Desktop/laptop verified; intentionally not mobile-optimised per brief. | Add tablet breakpoint if scope widens. |
| Q8 Empty states | 5 | Every data surface has actionable empty copy via `PanelState`: "No linked time series", "No series selected", "No datapoints available", etc. | None. |
| Q9 Performance | 4 | Bounded CDF calls, debounced search, TanStack Query caching, manual chart refresh. Main chunk 1,357 kB / 415 kB gzipped — over Vite's 500 kB warning, no code splitting. | Dynamically import Recharts/chart module and pdf.js worker. |
| Q10 Accessibility | 4 | No images in app UI. Zoom buttons and chart have `aria-label`. Semantic tables. Aura focus-visible rings. Gaps: no `eslint-plugin-jsx-a11y`, table headers lack `scope`, contrast not machine-verified. | Add jsx-a11y lint rule, `scope="col"` on headers, run axe scan. |

## Summary

- Average score: 4.6
- Quality level: Excellent — ready to launch

Meets the `flows-external-app-submit` gate (requires 3.8 or higher).

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- **Q2** — Integrate the Aura Topbar with breadcrumbs so the app reads as part of the Fusion shell.
- **Q7** — Add a tablet breakpoint if the supported device range widens beyond desktop and laptop.
- **Q9** — Code-split the chart module and pdf.js worker; main chunk is 1,357 kB raw / 415 kB gzipped.
- **Q10** — Add `eslint-plugin-jsx-a11y`, `scope="col"` on table headers, and run an axe scan against the running app.
