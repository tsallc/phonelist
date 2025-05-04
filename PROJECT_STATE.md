# Project State

**Last Updated:** YYYY-MM-DDTHH:mm:ssZ # Replace with current timestamp

## Current Focus

- **Canonicalizer Script:** Script is functionally complete for validation, O365 CSV export, and selective update via `--update-from-csv`. Focus is on documentation and considering further refinements (schema, decomposition).
- **React App Refactor:** Pending. Next step is Phase 1 (Schema & Foundation) using the validated `src/data/canonicalContactData.json` as the source of truth.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` defined for the main React application refactor.
- **Canonicalizer Script (O365 CSV Utility):**
    - Phase 1 (Setup & Schema): ✅ Completed
    - Phase 2 (Ingest & Transform): ✅ Completed (CSV->JSON logic retained, but not default path)
    - Phase 3 (Validation, Diff, Hash): ✅ Completed
    - Phase 4 (Output Generation): ✅ Completed (JSON write via update, CSV export)
    - Phase 5 (CLI): ✅ Completed (Validation default, Export flag, Update flag implemented)
    - Phase 6 (Testing): ✅ Unit & Integration tests implemented and passing for validation, export, and update.
    - Phase 7 (Refinement): ✅ Added --verbose flag, resolved build/runtime issues, established robust contracts.
- **React App Refactor:**
    - Phase 0 (Analysis, Planning, Data Extraction): Completed
    - Phase 1 (Schema & Foundation): Pending

- **Milestones Completed:**
    - Project analysis and initial refactoring plan creation (`REFACTOR_PLAN.md`).
    - State tracking (`PROJECT_STATE.md`) and codebase audit (`CODEBASE_AUDIT.md`) files created.
    - **Established `src/data/canonicalContactData.json` as the live, mutable source of truth, initialized from the complete merged data (`reference_example.json`).**
    - **Developed `phonelist-canonicalizer` script:**
        - Implemented core logic for validation, hashing, diffing, CSV export.
        - Implemented selective update logic (`--update-from-csv`) anchored by `objectId`, including nested field handling and robust change detection.
        - Implemented CLI interface (`scripts/canonicalize.ts`).
        - Added comprehensive unit and integration tests (`vitest`) covering all modes.
        - Added `--verbose` flag and structured logging (`lib/logger.ts`).
        - Resolved build/runtime issues and data consistency problems.
    - **Documented key architectural decisions and failure modes** ([docs/CHANGE-DETECTION-FAILURES.md](mdc:docs/CHANGE-DETECTION-FAILURES.md), Cursor Rules).
    - **Clarified script purpose:** Confirmed its role as a utility for validating the live JSON, exporting to O365 CSV format, and selectively updating the live JSON from a new CSV.

- **Milestones Pending:**
    - **(Optional) Canonicalizer Script:** Consider further schema hardening and code decomposition.
    - **React App:** Begin Phase 1 - Implement Core Schemas, Data Source loading, Service Layer Stubs based on `src/data/canonicalContactData.json`.
    - **Delete `App.jsx` and `ArtifactCode.jsx` after React app migration.**
    - **Final Documentation Review & Cleanup.**

## Recent Activity

- **Clarified definitive roles:** `reference_example.json` (static reference, now copied to live), `canonicalContactData.json` (live, mutable truth), `phonelist-canonicalizer` script (validator/exporter/updater utility).
- **Initialized `canonicalContactData.json`** with merged data from reference file.
- **Refactored `scripts/canonicalize.ts`** to align with new workflow (validate default, export flag, update flag placeholder).
- **Updated `lib/schema.ts`** Zod definitions to match the merged data structure.
- **Updated and fixed all unit and integration tests** to align with the refactored schema and script logic.
- **Implemented `--update-from-csv`:** Developed core logic in `lib/updateFromJson.ts`, integrated into `scripts/canonicalize.ts`, established `objectId` as primary key, implemented robust hashing/diffing, handled nested fields, added comprehensive tests (`test/update.test.ts`), fixed numerous parsing/comparison bugs.
- **Refactored Logging:** Implemented structured logger (`lib/logger.ts`).
- **Created Documentation:** Added `docs/CHANGE-DETECTION-FAILURES.md` and Cursor rules.
- Confirmed all tests pass (including update logic).

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

1.  **(Documentation)** Final review of `README.md`, `PROJECT_STATE.md`, `CODEBASE_AUDIT.md`, `REFACTOR_PLAN.md`, and code comments for accuracy and clarity.
2.  **(Optional Refinement)** Consider further schema hardening or code decomposition for the canonicalizer script.
3.  **(React)** Proceed with **React App Refactor Phase 1**, using the current `canonicalContactData.json`.
4.  **(If Deferring Update)** Proceed with **React App Refactor Phase 1**, using the current `canonicalContactData.json`.
5.  **(If Implementing Update)** Implement `lib/updateFromJson.ts` and add corresponding tests.

## Blockers/Issues

- None currently identified.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document for the main React app.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state.
- `PROJECT_STATE.md`: This file.
- **`src/data/canonicalContactData.json`:** **THE Live, Mutable Source of Truth (merged data).**
- `src/data/reference_example.json`: Read-only static reference of the merged data.
- `package.json`: Defines dependencies and scripts.
- `lib/*.ts`: Modules for the canonicalizer script.
- `scripts/canonicalize.ts`: Main CLI entry point for the canonicalizer.
- `lib/tests/*.test.ts`: Unit tests for canonicalizer.
- `scripts/tests/*.test.ts`: Integration tests for canonicalizer CLI.
- `users_5_3_2025 7_00_43 PM.csv`: Primary O365 user export (used for `--update-from-csv` potentially).
- `App.jsx`, `ArtifactCode.jsx`: Deprecated sources of data, **to be deleted** later.

## LLM Agent Instructions

- **Treat `src/data/canonicalContactData.json` as the live source of truth (merged data).**
- The `phonelist-canonicalizer` script validates this file and exports it to O365 CSV format. It does *not* generate the merged data from scratch.
- The `--update-from-csv` feature is now fully implemented and tested.
- Refer to this file (`PROJECT_STATE.md`) for current state and immediate goals.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.

---

## Development Summary (Mission Report)

**Goal:** The primary objective evolved throughout the session. Initially understood as creating a script to merge Office 365 CSV and JSX data into a canonical JSON, the final clarified goal became building a utility to manage synchronization *between* an existing, merged canonical JSON (`src/data/canonicalContactData.json`, initialized from `reference_example.json`) and Office 365, using CSV export/import as a stop-gap measure.

**Process & Implementation:**

*   **Foundation:** Set up project structure, dependencies (`zod`, `fast-csv`, `commander`, `fs-extra`, `vitest`, etc.), and build configuration (`tsconfig.canon.json`) for a Node.js/TypeScript script within the existing React project.
*   **Core Logic (Initial CSV->JSON):** Implemented library functions for parsing CSVs, transforming data to a schema (including ID generation), validating, hashing, and diffing.
*   **Debugging & Pivots:** Overcame significant hurdles related to Node.js module systems (ESM vs CJS), TypeScript strictness, file system writes, and critical data processing bugs (CSV header case sensitivity). Clarified the roles of `reference_example.json` (static truth) vs. `canonicalContactData.json` (live truth).
*   **Refactoring:** Initialized the live data file correctly. Refactored the main script (`scripts/canonicalize.ts`) to align with the final goal: default mode validates the live JSON, `--export-csv` generates an O365-compatible CSV from the live JSON, and `--update-from-csv` provides a hook (currently placeholder) for selectively updating the live JSON from a new CSV.
*   **Schema Alignment:** Updated the Zod schema (`lib/schema.ts`) to accurately reflect the structure of the *merged* data present in the live canonical file.
*   **Testing:** Implemented comprehensive unit tests for library functions and integration tests for the CLI script's validation and export modes using `vitest` and `execa`. All implemented tests are passing.

**Current State:** The `phonelist-canonicalizer` script is functionally complete and tested for its primary roles as a validator, O365 CSV exporter, and selective updater based on the established live canonical JSON data and `objectId` matching. 