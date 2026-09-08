# Package audit: Asset 360 Investigation Workspace

Commands run from the app root:

```bash
npm outdated --json
npm audit --json
```

## Dependencies

Only `dependencies` are graded. `devDependencies` are listed for completeness but do not affect criterion 1.3.

| Package | Used version | Latest | Deprecated | CVEs | Health |
| --- | --- | --- | --- | --- | --- |
| `@cognite/app-sdk` | 0.9.0 | 0.10.0 | No | 0 | Pass (one minor behind) |
| `@cognite/aura` | 0.3.5 | 0.3.5 | No | 0 | Pass |
| `@cognite/sdk` | 10.10.0 | 10.10.0 | No | 0 | Pass |
| `@tabler/icons-react` | 3.35.0 | 3.35.0 | No | 0 | Pass |
| `@tanstack/react-query` | 5.90.10 | 5.90.10 | No | 0 | Pass |
| `clsx` | 2.1.1 | 2.1.1 | No | 0 | Pass |
| `react` | 18.3.1 | 19.2.8 | No | 0 | Warn (1 major behind) |
| `react-dom` | 18.3.1 | 19.2.8 | No | 0 | Warn (1 major behind) |
| `react-pdf` | 9.2.1 | 10.5.0 | No | 0 | Warn (1 major behind) |
| `recharts` | 3.10.1 | 3.10.1 | No | 0 | Pass |
| `tailwind-merge` | 3.4.0 | 3.4.0 | No | 0 | Pass |

### Notes on the three Warn rows

- **`react` / `react-dom` 18 → 19.** The Flows app scaffold pins React 18, and `@cognite/aura` 0.3.5 and `@cognite/app-sdk` 0.9.0 are both built against it. Upgrading ahead of the template would put this app on an untested combination. Plan: adopt React 19 when the Flows template moves, not before.
- **`react-pdf` 9 → 10.** This version was installed by the `integrate-file-viewer` skill, which vendors `src/cognite-file-viewer/` against the v9 API. Upgrading requires the skill to publish a v10-compatible bundle. Plan: re-run the skill after it targets react-pdf 10.

None of the three is two or more majors behind, and none is deprecated or carries an advisory, so per the review bar this is Warn (Should Fix), not Fail.

### Dev dependencies one or more majors behind

`@eslint/js` 9→10, `eslint` 9→10, `@testing-library/jest-dom` 6→7, `@types/react` 18→19, `@types/react-dom` 18→19, `@vitejs/plugin-react` 5→6, `@vitest/coverage-v8` 4→5, `@vitest/ui` 4→5, `vitest` 4→5.

`@types/react` and `@types/react-dom` intentionally track React 18 and must move with it. The rest are tooling-only, do not ship, and do not affect criterion 1.3.

## Security audit

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| Info | 0 |

**Total: 0**

### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| --- | --- | --- | --- | --- |
| _none_ | — | — | — | — |

## Install scripts and provenance

All production dependencies come from the `@cognite` scope or well-known public packages (`react`, `react-dom`, `react-pdf`, `recharts`, `clsx`, `tailwind-merge`). No unfamiliar or typosquat-adjacent names. `package-lock.json` is committed.

## Verdict

**Pass with warnings.** Zero CVEs at any severity and no deprecated packages. Three production dependencies are one major behind, each for a documented reason tied to the Flows template or a Cognite skill rather than to a choice made in this app.
