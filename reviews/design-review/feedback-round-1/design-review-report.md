# Design Review — Asset 360 Investigation Workspace — round 1

Assessed against the 10 quality-guideline questions in
[docs.cognite.com/cdf/flows/guides/quality-guidelines](https://docs.cognite.com/cdf/flows/guides/quality-guidelines).

Run after `flows-code-review` round 2 reached `Must Fix open: 0`.

## User and tasks

- **Primary user:** Operations Analyst / Reliability Engineer at an industrial facility. Reviews shift reports and alarms each morning; when equipment is flagged, investigates its history, current state, and documentation to brief the maintenance team. Works at a desk on a desktop or laptop with a large monitor, occasionally in the control room. (Source: `App-Brief.md` `userRole`.)
- **Tasks evaluated:**
  1. Find a flagged asset by its equipment tag and open its 360 view.
  2. Read the asset's current behaviour from its linked time series.
  3. Check recent work orders, then open the related document (P&ID or manual) needed to brief maintenance.
- **Context:** The analyst knows the tag but not where the data lives. Today this means SAP for work orders, a historian for sensor data, and SharePoint for drawings — 1–2 hours per asset. Success is completing the whole investigation on one page in minutes. Desktop-only is intended; mobile is out of scope for v1. Data source: live `publicdata` / `publicdatacdm`.

## Task walkthrough findings

Walked end-to-end by the builder against live `publicdatacdm` data in a clean browser session.

- **Task 1 — Find and open an asset.** Typing a partial tag into the Aura `Command` search returns ranked matches showing tag, name, description, and parent for disambiguation. Selecting one opens the 360 view and records the asset in the recently-viewed list. No pain points reported.
- **Task 2 — Read the time series.** The panel lists every linked series and plots none until the analyst picks one, which keeps a busy asset readable. The chart window anchors to the most recent datapoint rather than wall-clock now, so stale historian data still renders on screen instead of showing an empty axis. Manual refresh works; nothing auto-polls. No pain points reported.
- **Task 3 — Work orders and documents.** Work orders list newest first with identifier, title, status, and date, and expand inline without leaving the page. Documents list name, type, and last-modified date; PDFs and images preview inline, and other types offer an external open. No pain points reported.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 4 | 12 files import Aura, each from its own subpath rather than the barrel. Zero `rgb()`/`hsl()` literals and zero style overrides on Aura components. One exception: `CHART_COLORS` in `src/features/asset-360/TimeSeriesPanel.tsx:211` is a hard-coded hex array. | Source the five chart stroke colours from Aura's palette tokens so the chart follows theme changes. |
| Q2 Navigation & hierarchy | 4 | Location is always clear: the asset header carries tag, name, type, and location; tabs separate the three panels; a persistent "Back to search" returns home. Page state is host-synced, so reload and shared links land on the same asset. The app does not integrate the Fusion breadcrumb or topbar, so there is no cue about where it sits inside Fusion. | Adopt the Aura Topbar with breadcrumbs (`use-topbar` skill) for shell consistency. |
| Q3 Labels & language | 5 | No vague labels anywhere — probes for "Submit", "OK", "Go", "Click here" returned nothing. Every action is specific: "Back to search", "View detail", "Hide detail", "Open externally", "Refresh chart", "Open asset", "Close preview". The single placeholder is on the search input, which sits under a visible "Search assets" heading rather than relying on the placeholder as its label. | None. |
| Q4 Feedback & validation | 5 | `PanelState` renders loading, empty, error, and no-access for every fetch surface, and each of the three panels resolves its own state independently, so one failure never blanks the page. Errors carry a retry control; 403 responses surface a distinct "no access" message rather than a generic error. `AppErrorBoundary` plus a `PanelErrorBoundary` per panel prevent white screens. No forms or mutations — the app is read-only. | None. |
| Q5 Clickability | 5 | Zero `onClick` handlers on `<div>` or `<span>`. Every interaction runs through an Aura primitive — `Button`, `CommandItem`, `CheckboxItemControl`, `TabsTrigger` — which supply hover, focus-visible rings, and pointer cursors consistently. | None. |
| Q6 Error prevention | 5 | The app is a read-only viewer: probes for delete, remove, archive, and reset returned nothing, and there are no mutations against CDF. Per the rubric's N/A guidance, an app with no destructive actions scores 5. Navigation is non-destructive and reversible via "Back to search". | None. |
| Q7 Responsive | 4 | Viewport meta is present in `index.html`. Content is constrained to `max-w-6xl` and centred, padding steps up at the `sm:` breakpoint, the asset header wraps with `flex-wrap`, and both tables sit in `overflow-x-auto` containers so they scroll rather than break the page. No fixed-px widths or heights. Verified from a large monitor down to a 13" laptop with no page-level horizontal scrolling, which is the supported range per the brief. | Responsive utility usage is light; a narrower tablet breakpoint would help if scope ever extends past desktop. |
| Q8 Empty states | 5 | Every data surface has one with actionable copy: "No linked time series", "No linked work orders", "No linked documents", "No series selected" with an instruction to pick one, "No recently viewed assets" explaining that opened assets appear there, and a search empty state telling the analyst to try a different tag, name, or description. | None. |
| Q9 Performance | 4 | Every CDF call is bounded — 25 for search, 100 per related list, 1000 datapoints — with server-side filtering, so nothing is downloaded and filtered in the browser. Search debounces at 300 ms and gates at two characters; TanStack Query dedupes and caches; the chart never polls. The main bundle is 1,345 kB raw / 411 kB gzipped, over Vite's 500 kB warning, with no route or component code splitting. | Dynamically import Recharts and the pdf.js worker to cut initial load. |
| Q10 Accessibility | 4 | No images, so no missing alt text. No icon-only buttons, so no unlabeled controls. Loading regions are announced with `aria-live="polite"`. Tables use real `<table>`/`<thead>`/`<th>` markup, and all controls are semantic elements from Aura, which supplies visible `focus-visible` rings. Keyboard navigation through the search combobox and tabs was confirmed during the walkthrough. Gaps: `eslint-plugin-jsx-a11y` is not installed, table headers lack `scope`, and colour contrast has not been machine-verified. | Add `eslint-plugin-jsx-a11y`, add `scope="col"` to table headers, and run an axe scan against the running app. |

## Summary

- Average score: 4.5
- Quality level: Excellent — ready to launch

Meets the `flows-external-app-submit` gate (requires 3.8 or higher).

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- **Q1** — Replace the hard-coded `CHART_COLORS` hex array in `src/features/asset-360/TimeSeriesPanel.tsx:211` with Aura palette tokens so the chart tracks theme changes.
- **Q2** — Integrate the Aura Topbar with breadcrumbs so the app reads as part of the Fusion shell.
- **Q7** — Add a tablet breakpoint if the supported device range ever widens beyond desktop and laptop.
- **Q9** — Code-split Recharts and the pdf.js worker; the main chunk is currently 1,345 kB raw / 411 kB gzipped.
- **Q10** — Install `eslint-plugin-jsx-a11y`, add `scope="col"` to the work-order and document table headers, and run an axe scan for contrast verification.
