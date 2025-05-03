# Project State

**Last Updated:** YYYY-MM-DD HH:MM:SSZ # Placeholder, will be updated

## Current Focus

- **Canonicalizer Script:** Implement Phase 4 (Output Generation) and Phase 5 (CLI) for the Node.js/TypeScript tool.
- **React App Refactor:** Paused while canonicalizer foundation is built. Next step remains implementing schemas/services based on `canonicalContactData.json`.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` defined for the main React application.
- **Canonicalizer Script:**
    - Phase 1 (Setup & Schema): **Completed**
    - Phase 2 (Ingest & Transform): **Completed**
    - Phase 3 (Validation, Diff, Hash): **Completed**
    - Phase 4 (Output Generation): Pending
    - Phase 5 (CLI): Pending
- **React App Refactor:**
    - Phase 0 (Analysis, Planning, Data Extraction): Completed
    - Phase 1 (Schema & Foundation): Pending (Blocked on canonicalizer completion/stabilization)

- **Milestones Completed:**
    - Project analysis and refactoring plan creation (`REFACTOR_PLAN.md`).
    - LLM state tracking file creation (`PROJECT_STATE.md`).
    - Full codebase audit (`CODEBASE_AUDIT.md`).
    - Detailed audit & reconciliation of hardcoded data vs. M365 export.
    - **Canonical data extraction to `src/data/canonicalContactData.json` (Source of Truth, uses `contactPoints` array).**
    - **Canonicalizer Script:** Setup, CSV Parsing, Transformation logic, Validation, Hashing, Diffing implemented.
    - Deleted intermediate `MERGED_USER_DATA.csv`.

- **Milestones Pending:**
    - **Canonicalizer Script:** Implement JSON/CSV output writing, CLI interface.
    - **React App:** Implement Core Schemas (`src/schemas/directorySchemas.js`), Refactor Data Source (`src/data/seedData.js`), Prepare Service Layer Stubs (`src/services/directoryService.js`).
    - **Delete `App.jsx` and `ArtifactCode.jsx` after data migration is confirmed and React app reads from canonical data.**

## Recent Activity

- **Acknowledged outdated documentation regarding "flattened schema"; confirmed `contactPoints` is an array.**
- Completed Phases 1-3 of the canonicalizer script (`lib/schema.ts`, `lib/parseCsv.ts`, `lib/toCanonical.ts`, `lib/validate.ts`, `lib/hash.ts`, `lib/diff.ts`).
- Corrected `package.json` for `pnpm` usage and dependencies.
- Resolved linter issues in helper scripts.

## Filtered UPNs (Excluded during canonical extraction)

- admin@titlesolutionsllc.com
- cciotti@titlesolutionsllc.com
- ccal@titlesolutionsllc.com
- customercomplaints@titlesolutionsllc.com
- fax@titlesolutionsllc.com
- gravitytitle@titlesolutionsllc.com
- Sync_DC01_cd57fb6f11b6@titlesolutionsllc.onmicrosoft.com
- admin@titlesolutionsllc.onmicrosoft.com
- qualia@titlesolutionsllc.com
- smastroberardino@titlesolutionsllc.com
- salesmi@titlesolutionsllc.com
- ScannyMcScanFace@titlesolutionsllc.com
- social@titlesolutionsllc.com
- stech@titlesolutionsllc.com
- tadmin@titlesolutionsllc.com
- orders@titlesolutionsllc.com (also covers orders@trutitleinc.com)
- wires@titlesolutionsllc.com

## Next Steps

1.  **Canonicalizer Script:** Implement `lib/exportCsv.ts` (Phase 4).
2.  **Canonicalizer Script:** Implement main CLI script `scripts/canonicalize.ts` (Phase 5).
3.  **Documentation:** Update `CODEBASE_AUDIT.md` and rewrite `README.md`.

## Blockers/Issues

- None currently identified.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document for the main React app.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state pre-refactor (needs update).
- `PROJECT_STATE.md`: This file.
- **`src/data/canonicalContactData.json`:** **THE Source of Truth for contact/location data (Uses `contactPoints` array).**
- `package.json`: Defines dependencies and scripts for both React app and canonicalizer tool.
- `lib/*.ts`: Helper modules for the canonicalizer script.
- `scripts/canonicalize.ts`: (To be created) Main CLI entry point for the canonicalizer.
- `users_5_3_2025 7_00_43 PM.csv`: Original M365 user export (historical context).
- `App.jsx`, `ArtifactCode.jsx`: Deprecated sources of data, **to be deleted** later.

## LLM Agent Instructions

- **Treat `src/data/canonicalContactData.json` as the immutable source of truth (Note: Uses `contactPoints` array).**
- Refer to this file (`PROJECT_STATE.md`) for current state and immediate goals.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.
- Use `Overall Progress` for context within `REFACTOR_PLAN.md`. 