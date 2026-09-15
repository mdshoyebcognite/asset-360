# Asset 360 Investigation Workspace — Code Review Report

## Path to approval

This review found **1 must-fix item** that blocks approval. Once the must-fix item is addressed, re-run `flows-code-review`.

### Reviewed commit

`local working tree`

## Summary

The Asset 360 Investigation Workspace implements the certification workshop spec: host-synced routing, CDM-backed services, Aura UI, panel-level resilience, file viewer integration, and recently-viewed local storage. Build, lint, and unit tests pass.

## Scores

| Criterion | Score | Notes |
| --- | --- | --- |
| 1.1 Correctness | 4 | Error boundaries, panel states, host-synced navigation |
| 1.3 Structure | 4 | Services, view models, feature folders |
| 1.4 Test coverage | 2 | **35.8% line coverage — below 80% gate** |
| 1.5 Code quality | 4 | DI, interfaces, no `any` |
| 1.6 Patterns | 4 | ViewModel + injected services |
| 2.1 DMS usage | 4 | instances.search/list, datapoints API |
| 2.6 CDF Raw | N/A | No Raw API usage |
| 3.1 Aura | 4 | Command search, Cards, Tabs, Empty states, Tables |

## Must Fix

### MF-001: Line coverage below 80% gate

_Impact:_ Certification requires ≥80% line coverage on in-scope production files. Current measured coverage is ~36% (Vitest v8), with `src/features/asset-360/` panels largely untested.

_Action:_ Add component and integration tests for Asset360View, TimeSeriesPanel, WorkOrdersPanel, DocumentsPanel, and AssetSearchCombobox interaction paths. Re-run `npm run test:coverage` until ≥80%.

## Should Fix

- Add tests for `useAsset360DataViewModel` query error paths and chart window resolution.
- Consider splitting large panel components if they grow beyond review size limits.

## Nice Fix

- Code-split Recharts and PDF viewer to reduce main bundle size.
