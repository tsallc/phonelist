# Project State

**Last Updated:** 2025-05-03 

## Current Focus

- Begin implementation of **Phase 1: Foundational Graph Schema & Temporal Logic** from `REFACTOR_PLAN.md`.
- Implement core data schemas based on the **flattened** canonical data extraction.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` is defined.
- **Current Phase:** Phase 1 (Starting)
- **Milestones Completed:**
    - Project analysis and refactoring plan creation (`REFACTOR_PLAN.md`).
    - LLM state tracking file creation (`PROJECT_STATE.md`).
    - Full codebase audit (`CODEBASE_AUDIT.md`).
    - Detailed audit & reconciliation of hardcoded data (`App.jsx`, `ArtifactCode.jsx`) vs. M365 export (`users_*.csv`).
    - **Canonical data extraction to `src/data/canonicalContactData.json` (Source of Truth, Flattened Schema).**
- **Milestones Pending (Current Phase):**
    - Implement Core Schemas (`src/schemas/directorySchemas.js`) using Zod or similar, reflecting the **flattened** `canonicalContactData.json` structure.
    - Refactor Data Source (`src/data/seedData.js`) to load and validate `canonicalContactData.json`.
    - Prepare Service Layer Stubs (`src/services/directoryService.js`).
    - **Delete `App.jsx` and `ArtifactCode.jsx` after data migration is confirmed.**

## Recent Activity

- Created `PROJECT_STATE.md`.
- Performed codebase audit (`CODEBASE_AUDIT.md`).
- Audited and reconciled disparate data sources.
- **Executed one-time canonical data extraction into `src/data/canonicalContactData.json`.**
- **Refined canonical data structure: Flattened `ContactPoints` by inlining into `ContactEntities`.**
- Confirmed readiness to proceed with Phase 1 schema implementation.
- Deleted intermediate `MERGED_USER_DATA.csv`.

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

1.  Create the directory `src/schemas/`.
2.  Create the file `src/schemas/directorySchemas.js`.
3.  Implement Zod (or similar TS-based) schemas in `directorySchemas.js` that precisely match the **flattened** structure of `src/data/canonicalContactData.json`.

## Blockers/Issues

- None currently identified.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state pre-refactor.
- `PROJECT_STATE.md`: This file.
- **`src/data/canonicalContactData.json`:** **THE Source of Truth for contact/location data (Flattened Schema).**
- `users_5_3_2025 7_00_43 PM.csv`: Original M365 user export (historical context).
- `App.jsx`, `ArtifactCode.jsx`: Deprecated sources of data, **to be deleted** after Phase 1/2 validation.
- `src/schemas/directorySchemas.js`: (To be created) Will contain Zod/TS schemas matching the **flattened** `canonicalContactData.json`.
- `src/data/seedData.js`: (To be created/refactored) Will load/validate `canonicalContactData.json`.

## LLM Agent Instructions

- **Treat `src/data/canonicalContactData.json` as the immutable source of truth (Note: Flattened Schema).**
- Refer to this file (`PROJECT_STATE.md`) for current state and immediate goals.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.
- Use `Overall Progress` for context within `REFACTOR_PLAN.md`.
- The next task involves implementing schemas that *validate* the **flattened** structure in `canonicalContactData.json`. 