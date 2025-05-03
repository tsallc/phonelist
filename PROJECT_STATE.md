# Project State

**Last Updated:** 2025-05-03T21:40:00Z # Updated

## Current Focus

- **Canonicalizer Script:** Complete testing/validation and prepare for potential integration or next steps.
- **React App Refactor:** Pending. Next step is Phase 1 (Schema & Foundation) using the generated `canonicalContactData.json`.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` defined for the main React application.
- **Canonicalizer Script:**
    - Phase 1 (Setup & Schema): ✅ Completed
    - Phase 2 (Ingest & Transform): ✅ Completed
    - Phase 3 (Validation, Diff, Hash): ✅ Completed
    - Phase 4 (Output Generation): ✅ Completed (JSON write, CSV export logic)
    - Phase 5 (CLI): ✅ Completed
    - Phase 6 (Testing): ✅ Basic unit tests implemented and passing.
    - Phase 7 (Refinement): ✅ Added --verbose flag.
- **React App Refactor:**
    - Phase 0 (Analysis, Planning, Data Extraction): Completed
    - Phase 1 (Schema & Foundation): Pending

- **Milestones Completed:**
    - Project analysis and refactoring plan creation (`REFACTOR_PLAN.md`).
    - LLM state tracking file creation (`PROJECT_STATE.md`).
    - Full codebase audit (`CODEBASE_AUDIT.md`).
    - Detailed audit & reconciliation of hardcoded data vs. M365 export.
    - **Canonical data extraction to `src/data/canonicalContactData.json` (Source of Truth, uses `contactPoints` array).**
    - **Implemented core canonicalizer script logic (Phases 1-5).**
    - **Added basic unit tests for canonicalizer library functions.**
    - **Added `--verbose` flag for conditional debug logging.**
    - Successfully generated valid `src/data/canonicalContactData.json` from CSV.
    - Deleted intermediate `MERGED_USER_DATA.csv`.

- **Milestones Pending:**
    - **Canonicalizer Script:** Add integration tests for CLI script (`scripts/canonicalize.ts`) (Recommended).
    - **React App:** Implement Core Schemas (`src/schemas/directorySchemas.js`), Refactor Data Source (`src/data/seedData.js`), Prepare Service Layer Stubs (`src/services/directoryService.js`).
    - **Delete `App.jsx` and `ArtifactCode.jsx` after data migration is confirmed and React app reads from canonical data.**

## Recent Activity

- **Added `--verbose` flag to canonicalizer script for debug logging.**
- Corrected file state inconsistencies and finalized canonicalizer script implementation.
- Successfully generated `canonicalContactData.json` from the correct CSV source.
- Implemented and passed unit tests for canonicalizer library functions (`vitest`).
- Debugged and resolved various issues (module resolution, type errors, case sensitivity, file writing persistence).
- Updated documentation (`README.md`, `PROJECT_STATE.md`, `CODEBASE_AUDIT.md`) to reflect current state.

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

1.  **(Recommended)** Add integration tests for `scripts/canonicalize.ts`.
2.  Decide whether to expand canonicalizer to handle JSX sources or proceed with React App Refactor Phase 1 using current data.
3.  Update documentation as needed.

## Blockers/Issues

- None currently identified.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document for the main React app.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state pre-refactor.
- `PROJECT_STATE.md`: This file.
- **`src/data/canonicalContactData.json`:** **THE Source of Truth (currently CSV-derived).**
- `package.json`: Defines dependencies and scripts.
- `lib/*.ts`: Modules for the canonicalizer script.
- `scripts/canonicalize.ts`: Main CLI entry point for the canonicalizer.
- `lib/tests/*.test.ts`: Unit tests for canonicalizer.
- `users_5_3_2025 7_00_43 PM.csv`: Primary O365 user export.
- `App.jsx`, `ArtifactCode.jsx`: Deprecated sources of data, **to be deleted** later.

## LLM Agent Instructions

- **Treat `src/data/canonicalContactData.json` as the current source of truth (derived from CSV).**
- Refer to this file (`PROJECT_STATE.md`) for current state and immediate goals.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.
- Use `Overall Progress` for context within `REFACTOR_PLAN.md`. 