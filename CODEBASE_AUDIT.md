# Codebase Audit Report

**Audit Date:** 2025-05-03 (Updated reflecting canonicalizer development)

## 1. Project Overview

*   **Name:** `tsa-phone-list`
*   **Purpose:** React web application displaying contact directory and interactive office map. Also includes a supporting Node.js script (`phonelist-canonicalizer`) for data management.
*   **Current Views:** Tabs for "Contact Directory" and "Office Map".
*   **Goal:** Refactor React app based on `REFACTOR_PLAN.md`. Canonicalizer script serves as stop-gap O365 CSV utility.

## 2. Technology Stack

*   **React App:** React 18, Vite, PNPM, shadcn/ui, Tailwind CSS, gh-pages.
*   **Canonicalizer Script:** Node.js, TypeScript, Zod, fast-csv, commander, fs-extra, vitest, execa.

## 3. Project Structure

```
.
├── .git/
├── dist/
│   └── canon/      # Compiled canonicalizer script output
├── lib/            # Canonicalizer library modules
│   ├── tests/      # Unit tests for canonicalizer libs
│   ├── schema.ts
│   ├── types.ts
│   ├── parseCsv.ts
│   ├── toCanonical.ts # (Logic primarily for initial CSV->JSON, less relevant now)
│   ├── validate.ts
│   ├── hash.ts
│   ├── diff.ts
│   ├── exportCsv.ts
│   └── updateFromJson.ts # Implements selective update logic
├── logs/           # Diff logs from canonicalizer
├── node_modules/
├── public/
├── scripts/
│   ├── tests/      # Integration tests for canonicalizer CLI
│   └── canonicalize.ts # Canonicalizer CLI script
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ui/       # shadcn/ui components
│   ├── data/
│   │   ├── canonicalContactData.json # LIVE, MUTABLE source of truth (merged)
│   │   ├── reference_example.json  # Read-only reference of merged data
│   │   └── users_*.csv             # O365 CSV exports (input for updates)
│   ├── lib/          # React App specific utils (e.g., utils.js)
│   ├── schemas/      # (To be created for React App Schemas)
│   ├── App.css
│   ├── App.jsx       # Root component, Tabs (Data Deprecated)
│   ├── ArtifactCode.jsx # Office map component (Data Deprecated)
│   ├── index.css
│   └── main.jsx
├── .eslintrc.cjs
├── .gitignore
├── claude-artifacts-react.code-workspace
├── components.json     # shadcn/ui config
├── index.html
├── jsconfig.json
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── PROJECT_STATE.md    # LLM State tracking
├── README.md
├── REFACTOR_PLAN.md    # Refactoring plan
├── tsconfig.canon.json # TSConfig for canonicalizer script
└── vite.config.js
```

*   **Layout:** Standard React structure (`src`, `public`) alongside dedicated `lib`, `scripts`, and `logs` for the canonicalizer tool.
*   **Data:**
    *   **Live Source of Truth:** `src/data/canonicalContactData.json` (initialized from `reference_example.json`, contains merged data).
    *   **Static Reference:** `src/data/reference_example.json`.
    *   **O365 Exports:** `src/data/users_*.csv` serve as input for potential updates.
    *   **Deprecated:** Data in `App.jsx`/`ArtifactCode.jsx`.

## 4. Core Components & Functionality

*   **React App:** (See previous audit - functionality unchanged, but data source deprecated).
*   **Canonicalizer Script (`scripts/canonicalize.ts`):**
    *   CLI tool to validate, export (to O365 CSV), and selectively update (`--update-from-csv`) the live `canonicalContactData.json`.
    *   Uses helper modules in `lib/` for parsing, validation, hashing, diffing, updating etc.

## 6. Data Management (Current State)

*   **Status:** Live source of truth is `src/data/canonicalContactData.json`, containing merged data. The `phonelist-canonicalizer` script interacts with this file for validation and O365 CSV export.
*   **Schema:** Canonical schema matching the merged data is defined in `lib/schema.ts` using Zod. Schema implementation for the React app is pending.
*   **Refactor Target:** React app refactor (Phase 1) will consume `src/data/canonicalContactData.json`.

## 9. Refactor Plan Adherence

*   **Status:** Canonical data file (`canonicalContactData.json`) established with merged data. Supporting utility script (`phonelist-canonicalizer`) built and tested for validation/export modes. React app refactor Phase 1 pending.
*   **Planning Docs:** `REFACTOR_PLAN.md`, `PROJECT_STATE.md`, `CODEBASE_AUDIT.md` updated to reflect current state and script purpose.
*   **Implementation:** `src/data/canonicalContactData.json` initialized. `lib/`, `scripts/`, `lib/tests/`, `scripts/tests/` created/populated for canonicalizer.

## 10. Conclusion

The project contains the `tsa-phone-list` React app (pending refactor) and the `phonelist-canonicalizer` utility script. The canonical source of truth is `src/data/canonicalContactData.json` (merged data). The canonicalizer script is functionally complete and tested for its role as a validator, O365 CSV exporter, and selective updater for this live data file, serving as a stop-gap for maintaining O365 sync. The `--update-from-csv` feature is implemented and tested. The project is ready for final documentation review or implementation of the update feature, before proceeding with the React app refactor.

**Next Action (Canonicalizer):** Review documentation and consider optional refinements.
**Next Action (React App Refactor):** Begin Phase 1 (Schemas, Data Loading) based on `canonicalContactData.json`.

**Next Action (Canonicalizer):** Implement Phase 4 (Output Gen) & Phase 5 (CLI).
**Next Action (React App Refactor):** Create `src/schemas/` directory and implement schemas matching `canonicalContactData.json`. 