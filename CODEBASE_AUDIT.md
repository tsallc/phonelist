# Codebase Audit Report

**Audit Date:** 2025-05-03

## 1. Project Overview

*   **Name:** `tsa-phone-list`
*   **Purpose:** React web application displaying contact directory and interactive office map for Title Solutions Agency, LLC and related entities (Coastal Title, TruTitle).
*   **Current Views:** Tabs for "Contact Directory" and "Office Map".
*   **Goal:** Refactor based on `REFACTOR_PLAN.md` towards a robust, data-driven application.

## 2. Technology Stack

*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Package Manager:** PNPM
*   **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
*   **Styling:** Tailwind CSS
*   **Icons:** lucide-react
*   **Utilities:** clsx, tailwind-merge, tailwindcss-animate
*   **Linting:** ESLint
*   **Deployment:** gh-pages (GitHub Pages)

## 3. Project Structure

```
.
├── .git/
├── dist/
├── node_modules/
├── public/
├── src/
│   ├── assets/         # Empty
│   ├── components/
│   │   └── ui/         # shadcn/ui components
│   ├── data/
│   │   └── canonicalContactData.json # Source of Truth (Uses contactPoints array)
│   ├── lib/
│   │   ├── utils.js    # cn utility, style mapping (React App)
│   │   ├── schema.ts   # Zod schemas (Canonicalizer Script)
│   │   └── canonicalizer lib files ...
│   ├── schemas/        # (To be created for React App Schemas)
│   ├── App.css
│   ├── App.jsx         # Root component, Tabs (Data Deprecated)
│   ├── ArtifactCode.jsx# Office map component (Data Deprecated)
│   ├── index.css       # Tailwind base styles
│   └── main.jsx        # Entry point
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
└── vite.config.js
```

*   **Layout:** Standard React (`src`, `public`). Includes `lib` and `scripts` for canonicalizer.
*   **Components:** `shadcn/ui` in `src/components/ui/`; Custom components (`App.jsx`, `ArtifactCode.jsx`) in `src/`.
*   **Data:** **Canonical data established in `src/data/canonicalContactData.json` (Uses `contactPoints` array). Hardcoded data in `App.jsx`/`ArtifactCode.jsx` is now deprecated.**

## 4. Core Components & Functionality

*   **`src/main.jsx`:** Renders `<App />`.
*   **`src/App.jsx`:**
    *   Handles Tabs switching (`ContactDirectory`, `Office Map`).
    *   Contains `ContactDirectory` component **(Data Deprecated)**.
    *   Renders `ArtifactCode` for map view **(Data Deprecated)**.
*   **`src/ArtifactCode.jsx` (`OfficeFloorMap`):**
    *   Large component (>2000 lines) for the interactive office map **(Data Deprecated)**.
    *   Uses React Context (`OfficeMapContext`) for internal state.
    *   Features: search, list view, selection, details drawer, layout validation, easter egg.
*   **`src/components/ui/`:** Standard `shadcn/ui` components.
*   **`src/lib/utils.js`:** `cn` function, `roomTypeStyleMapping`.

## 5. Styling Approach

*   **Primary:** Tailwind CSS utility classes.
*   **Theming:** `shadcn/ui` conventions (CSS variables in `src/index.css`).
*   **Global:** `src/index.css`.
*   **Component:** `src/App.css` (`@apply`).
*   **Embedded:** `<style>` tags in `ArtifactCode.jsx` for easter egg.
*   **Helpers:** `cn` function (`clsx`, `tailwind-merge`).

## 6. Data Management (Current State)

*   **Status:** **Canonical source of truth established in `src/data/canonicalContactData.json` (Uses `contactPoints` array).** Data previously hardcoded in components (`App.jsx`, `ArtifactCode.jsx`) is now deprecated.
*   **State:** `App.jsx` uses simple `useState`; `ArtifactCode.jsx` uses React Context internally.
*   **Schema:** Defined by `canonicalContactData.json` structure. Explicit schema implementation (`src/schemas/`) is pending for the React app refactor. Canonicalizer script uses `lib/schema.ts`.
*   **Refactor Target:** Proceeding with Phase 1 based on the canonical data.

## 7. Build & Configuration

*   **Vite (`vite.config.js`):** Dev server, build tool, React plugin, path aliases (`@/`), GitHub Pages base path (`/phonelist/`).
*   **Tailwind (`tailwind.config.js`):** Content paths, theme extensions, plugins.
*   **shadcn/ui (`components.json`):** UI component configuration.
*   **ESLint (`.eslintrc.cjs`):** Linting rules.
*   **Deployment (`package.json`):** `deploy` script uses `gh-pages`.

## 8. Identified Issues / Improvement Areas

*   **Data Hardcoding:** **Resolved** by extracting to `canonicalContactData.json`.
*   **Component Size:** `ArtifactCode.jsx` remains large; refactoring needed in later phases.
*   **Separation of Concerns:** Data is now separated. Layout/rendering logic still coupled in `ArtifactCode.jsx`.
*   **Scalability:** New data structure is scalable.
*   **Maintainability:** Data updates now centralized in `canonicalContactData.json`.
*   **Styling:** Minor inconsistencies (`@apply`, embedded styles) remain.
*   **Data Validation:** Next step is to implement schema validation.

## 9. Refactor Plan Adherence

*   **Status:** Canonical data extraction complete. Canonicalizer script (Phases 1-3) built to process CSV into this format. React app refactor Phase 1 (Schema Implementation) is pending.
*   **Planning Docs:** `REFACTOR_PLAN.md`, `PROJECT_STATE.md`, `CODEBASE_AUDIT.md` updated.
*   **Implementation:** `src/data/canonicalContactData.json` created/updated. `lib/*.ts` and `scripts/*.ts` (pending) created for canonicalizer.

## 10. Conclusion

The project is a functional React app using Vite, Tailwind, and shadcn/ui. The primary weakness (hardcoded data) has been addressed by establishing a canonical source of truth in `src/data/canonicalContactData.json`. `ArtifactCode.jsx` still needs refactoring. A supporting canonicalizer script is being built to manage the canonical data. The project is ready to proceed with implementing schema validation *within the React app* based on the canonical data (Phase 1 of refactor) once the canonicalizer script is complete.

**Next Action (Canonicalizer):** Implement Phase 4 (Output Gen) & Phase 5 (CLI).
**Next Action (React App Refactor):** Create `src/schemas/` directory and implement schemas matching `canonicalContactData.json`. 