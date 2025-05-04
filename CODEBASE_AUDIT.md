# Codebase Audit Report

**Audit Date:** 2025-05-26 (Updated reflecting React app refactoring)

## 1. Project Overview

*   **Name:** `tsa-phone-list`
*   **Purpose:** React web application displaying contact directory and interactive office map. Also includes a supporting Node.js script (`phonelist-canonicalizer`) for data management.
*   **Current Views:** Tabs for "Contact Directory" and "Office Map".
*   **Goal:** Refactor React app based on `REFACTOR_PLAN.md`. Canonicalizer script serves as stop-gap O365 CSV utility.
*   **Status:** React app refactoring to use canonical data is complete. Canonicalizer script is functional for validation, export, and selective update.

## 2. Technology Stack

*   **React App:** React 18, Vite, PNPM, shadcn/ui, Tailwind CSS, TypeScript, Zod, gh-pages.
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
│   │   ├── contact/   # New: Contact directory components
│   │   │   ├── ContactCard.tsx # Display individual contact
│   │   │   ├── ContactList.tsx # Display list of contacts
│   │   │   └── ContactCard.test.tsx # Unit tests for contact components
│   │   └── ui/       # shadcn/ui components
│   ├── contexts/
│   │   ├── ContactDataContext.tsx  # New: Data provider with feature toggle
│   │   └── ContactDataContext.test.tsx # Unit tests for context
│   ├── data/
│   │   ├── canonicalContactData.json # LIVE, MUTABLE source of truth (merged)
│   │   ├── reference_example.json  # Read-only reference of merged data
│   │   └── users_*.csv             # O365 CSV exports (input for updates)
│   ├── lib/          
│   │   └── contactDataService.ts  # New: Data access layer with validation
│   ├── pages/        # New: Page components
│   │   └── Directory.tsx # Main directory page with filtering
│   ├── schemas/      # (Plans for additional schema refinement)
│   ├── App.css
│   ├── App.jsx       # Root component, Tabs (Data Deprecated, with toggle to new implementation)
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
    *   **Deprecated:** Data in `App.jsx`/`ArtifactCode.jsx` (still available but with toggle to use new implementation).

## 4. Core Components & Functionality

*   **React App:**
    *   **Root:** `App.jsx` - Contains tab structure with feature toggle for new implementation
    *   **Data Layer:** `lib/contactDataService.ts` - Handles data access, caching, and validation
    *   **State Management:** `contexts/ContactDataContext.tsx` - Provides data and state to components
    *   **UI Components:**
        *   `components/contact/ContactCard.tsx` - Renders individual contact
        *   `components/contact/ContactList.tsx` - Renders filterable list of contacts
        *   `pages/Directory.tsx` - Main page with filtering by location

*   **Canonicalizer Script (`scripts/canonicalize.ts`):**
    *   CLI tool to validate, export (to O365 CSV), and selectively update (`--update-from-csv`) the live `canonicalContactData.json`.
    *   Uses helper modules in `lib/` for parsing, validation, hashing, diffing, updating etc.

## 5. Data Management (Current State)

*   **Status:** Live source of truth is `src/data/canonicalContactData.json`, containing merged data. The application now reads from this file instead of hardcoded data.
*   **Schema:** Canonical schema matching the merged data is defined in both `lib/schema.ts` (for canonicalizer) and `lib/contactDataService.ts` (for React app) using Zod.
*   **Feature Toggle:** The application includes a toggle to switch between canonical and legacy data sources for testing.
*   **Error Handling:** Robust error handling with fallback to legacy data if canonical data loading fails.

## 6. Refactor Plan Adherence

*   **Status:** Canonical data file (`canonicalContactData.json`) established with merged data. Supporting utility script (`phonelist-canonicalizer`) built and tested for validation/export modes. React app refactoring is complete with data access layer, context provider, and UI components.
*   **Planning Docs:** `REFACTOR_PLAN.md`, `PROJECT_STATE.md`, `CODEBASE_AUDIT.md` updated to reflect current state and implementation.
*   **Implementation:** 
    *   `src/data/canonicalContactData.json` initialized as source of truth
    *   `lib/contactDataService.ts` implemented with Zod schema validation
    *   `contexts/ContactDataContext.tsx` created with feature toggle
    *   UI components built with search and filtering capabilities
    *   Environment-aware data loading with fallback mechanisms

## 7. Conclusion

The project contains the `tsa-phone-list` React app (with refactoring complete) and the `phonelist-canonicalizer` utility script. The canonical source of truth is `src/data/canonicalContactData.json` (merged data). The app now reads from this file with proper validation and error handling. The canonicalizer script is functionally complete for its role as a validator, O365 CSV exporter, and selective updater for this live data file.

**Next Action (Documentation):** Complete review and update of documentation to reflect current state.
**Next Action (React App):** Consider implementing unit tests, error boundary components, and UI refinements.
**Next Action (Codebase):** Confirm stability of new implementation and eventually remove legacy components. 