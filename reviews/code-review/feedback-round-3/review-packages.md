## Package audit: Asset 360 Investigation Workspace

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| `@cognite/app-sdk` | 0.9.0 | 0.10.0 | No | 0 | Warn — 1 minor behind |
| `@cognite/aura` | 0.3.5 | (current) | No | 0 | Pass |
| `react` | 18.3.1 | 19.2.8 | No | 0 | Warn — 1 major behind, pinned by Flows template |
| `react-dom` | 18.3.1 | 19.2.8 | No | 0 | Warn — 1 major behind, pinned by Flows template |
| `react-pdf` | 9.2.1 | 10.5.0 | No | 0 | Warn — 1 major behind, pinned by file-viewer skill |
| `recharts` | (via Aura peer) | — | No | 0 | Pass |

All other production dependencies are at wanted version. Nothing deprecated.

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 0 |

#### Vulnerabilities

All four moderate advisories are in the `vitest` / `@vitest/mocker` / `@vitest/coverage-v8` / `@vitest/ui` dev-dependency chain. No production runtime packages are affected. `npm audit fix --force` would bump vitest outside the stated range.

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
| vitest (dev) | Moderate | esbuild dev-server advisory (transitive) | vitest ≥4.1.11 | dev-only |
