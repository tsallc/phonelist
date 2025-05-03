# Project State

**Last Updated:** 2025-05-03 

## Current Focus

- Begin implementation of **Phase 1: Foundational Graph Schema & Temporal Logic** from `REFACTOR_PLAN.md`.
- Create the necessary directories and files for the new schemas, informed by data audit.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` is defined.
- **Current Phase:** Phase 1 (Starting)
- **Milestones Completed:**
    - Project analysis and refactoring plan creation (`REFACTOR_PLAN.md`).
    - LLM state tracking file creation (`PROJECT_STATE.md`).
    - Full codebase audit (`CODEBASE_AUDIT.md`).
    - Detailed audit of hardcoded data vs. M365 export (`users_5_3_2025 7_00_43 PM.csv`).
    - Creation of consolidated data file (`MERGED_USER_DATA.csv`).
- **Milestones Pending (Current Phase):**
    - Define Core Schemas (`src/schemas/directorySchemas.js`).
    - Refactor Data Source (`src/data/seedData.js` - using merged data).
    - Prepare Service Layer Stubs (`src/services/directoryService.js`).

## Recent Activity

- Created `PROJECT_STATE.md`.
- Performed a full codebase audit and generated `CODEBASE_AUDIT.md`.
- Audited hardcoded data (`App.jsx`, `ArtifactCode.jsx`) against M365 user export (`users_5_3_2025 7_00_43 PM.csv`).
- Created `MERGED_USER_DATA.csv` consolidating user/contact data, prioritizing hardcoded info (like extensions) where available.
- Identified service/system accounts to filter out (listed below).
- Confirmed alignment between UI data needs and merged dataset.
- Confirmed readiness to proceed with Phase 1 schema definition.

## Filtered UPNs (Excluded from MERGED_USER_DATA.csv)

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

1.  **Create the directory `src/schemas/`.**
2.  Create the file `src/schemas/directorySchemas.js`.
3.  Define the `ContactEntity` schema within `src/schemas/directorySchemas.js` according to `REFACTOR_PLAN.md` (Section 3.1) and informed by the data audit/merge.

## Blockers/Issues

- None currently identified.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state pre-refactor.
- `PROJECT_STATE.md`: This file.
- `users_5_3_2025 7_00_43 PM.csv`: Original M365 user export.
- `MERGED_USER_DATA.csv`: Consolidated user/contact data for refactoring.
- `App.jsx`, `ArtifactCode.jsx`: Source of hardcoded UI data (contacts, extensions, map layout) used for merging.
- `src/schemas/directorySchemas.js`: (To be created) Will contain new data schemas.
- `src/data/seedData.js`: (To be created/refactored) Will hold data conforming to new schemas, populated from `MERGED_USER_DATA.csv` and other hardcoded details (locations, external contacts).

## LLM Agent Instructions

- Refer to this file for current state and immediate goals.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.
- Use `Overall Progress` for context within `REFACTOR_PLAN.md`.
- Use `MERGED_USER_DATA.csv` as the primary source for user/contact entities when populating `src/data/seedData.js`. Supplement with location/external contact data from `App.jsx`. 