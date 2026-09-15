# File inventory: Asset 360 Investigation Workspace

Round 3 — 85 `src/**/*.ts(x)` files (excluding `node_modules`, `dist`). Config: `vitest.config.ts`, `vite.config.ts`.

| File | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/main.tsx` | Entry | — | — | N/A | Bootstrap; excluded from coverage |
| `src/App.tsx` | Shell | ✓ | ✓ | ✓ | Host-synced state, CogniteSdkProvider, error boundary |
| `src/components/AppErrorBoundary.tsx` | Component | ✓ | ✓ | ✓ | App-level crash guard |
| `src/components/PanelErrorBoundary.tsx` | Component | ✓ | ✓ | ✓ | Per-panel crash guard |
| `src/components/PanelState.tsx` | Component | ✓ | ✓ | ✓ | Shared loading/empty/error/no-access |
| `src/components/panelStatus.ts` | Utility | ✓ | ✓ | ✓ | Pure status resolver |
| `src/features/home/HomeView.tsx` | View | ✓ | ✓ | ✓ | Composes search + recently viewed |
| `src/features/home/AssetSearchCombobox.tsx` | Component | ✓ | ✓ | ✓ | Aura Command search |
| `src/features/home/RecentlyViewedList.tsx` | Component | ✓ | ✓ | ✓ | Host-synced recent assets |
| `src/features/asset-360/Asset360View.tsx` | View | ✓ | ✓ | ✓ | Tabs + panel composition |
| `src/features/asset-360/AssetHeader.tsx` | Component | ✓ | ✓ | ✓ | Asset metadata display |
| `src/features/asset-360/TimeSeriesPanel.tsx` | Component | ⚠ | ✓ | ✓ | 482 lines — chart, zoom, stats (SF-001) |
| `src/features/asset-360/chartFormatting.ts` | Utility | ✓ | ✓ | ✓ | Pure axis/tooltip formatters |
| `src/features/asset-360/seriesStats.ts` | Utility | ✓ | ✓ | ✓ | Pure stat computation |
| `src/features/asset-360/WorkOrdersPanel.tsx` | Component | ✓ | ✓ | ✓ | Activity table + detail |
| `src/features/asset-360/DocumentsPanel.tsx` | Component | ⚠ | ✓ | ✓ | 217 lines — table + preview routing (SF-001) |
| `src/view-models/useHomeViewModel.ts` | ViewModel | ✓ | ✓ | ✓ | Search + navigation commands |
| `src/view-models/useAsset360DataViewModel.ts` | ViewModel | ✓ | ✓ | ✓ | Parallel panel queries + chart window |
| `src/services/*.ts` (6 services) | Service | ✓ | ✓ | ✓ | Interface + Api* impl, injected |
| `src/state/*.ts` + providers | State | ✓ | ✓ | ✓ | Host-synced app state, recently viewed |
| `src/types/*.ts` | Types | ✓ | ✓ | ✓ | Domain types, instance ref helpers |
| `src/lib/*.ts` | Utility | ✓ | ✓ | ✓ | CDM property helpers, guards |
| `src/cognite-file-viewer/mimeTypes.ts` | Utility | ✓ | ✓ | ✓ | Measured — app imports directly |
| `src/cognite-file-viewer/*` (renderer) | Vendored | — | — | N/A | Excluded from coverage — pdf.js / layout |
| `src/__mocks__/*` | Test fixtures | — | — | N/A | Excluded from coverage |

**Non-trivial files read this round:** `TimeSeriesPanel.tsx`, `chartFormatting.ts`, `seriesStats.ts`, `RecentlyViewedList.tsx`, panel width fixes across Documents/WorkOrders.

**New since round 2:** `chartFormatting.ts`, `chartFormatting.test.ts`, `seriesStats.ts`, `seriesStats.test.ts`; chart rebuilt on Aura `ChartContainer` with area fill and themed palette tokens.
