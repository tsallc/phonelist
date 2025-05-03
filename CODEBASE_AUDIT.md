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
│   ├── data/           # Empty (Planned for refactor)
│   ├── lib/
│   │   └── utils.js    # cn utility, style mapping
│   ├── App.css
│   ├── App.jsx         # Root component, Tabs
│   ├── ArtifactCode.jsx# Office map component
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

*   **Layout:** Standard React (`src`, `public`).
*   **Components:** `shadcn/ui` in `src/components/ui/`; Custom components (`App.jsx`, `ArtifactCode.jsx`) in `src/`.
*   **Data:** No central data source; hardcoded in components.

## 4. Core Components & Functionality

*   **`src/main.jsx`:** Renders `<App />`.
*   **`src/App.jsx`:**
    *   Handles Tabs switching (`ContactDirectory`, `Office Map`).
    *   Contains `ContactDirectory` component with hardcoded contact data.
    *   Renders `ArtifactCode` for map view.
*   **`src/ArtifactCode.jsx` (`OfficeFloorMap`):**
    *   Large component (>2000 lines) for the interactive office map.
    *   Hardcoded room data, layout config, assignments, styles.
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

*   **Status:** Decentralized, Hardcoded within components (`App.jsx`, `ArtifactCode.jsx`).
*   **State:** `App.jsx` uses simple `useState`; `ArtifactCode.jsx` uses React Context internally.
*   **Schema:** Implicit, not formally defined.
*   **Refactor Target:** Primary focus of **Phase 1** in `REFACTOR_PLAN.md`.

## 7. Build & Configuration

*   **Vite (`vite.config.js`):** Dev server, build tool, React plugin, path aliases (`@/`), GitHub Pages base path (`/phonelist/`).
*   **Tailwind (`tailwind.config.js`):** Content paths, theme extensions, plugins.
*   **shadcn/ui (`components.json`):** UI component configuration.
*   **ESLint (`.eslintrc.cjs`):** Linting rules.
*   **Deployment (`package.json`):** `deploy` script uses `gh-pages`.

## 8. Identified Issues / Improvement Areas

*   **Data Hardcoding:** Main issue; limits scalability and maintainability.
*   **Component Size:** `ArtifactCode.jsx` is excessively large.
*   **Separation of Concerns:** Data, layout, rendering logic are tightly coupled.
*   **Scalability:** Current approach doesn't scale well.
*   **Maintainability:** Updates require direct code changes in components.
*   **Styling:** Minor inconsistencies (`@apply`, embedded styles).
*   **Data Validation:** Lacking due to implicit schemas.

## 9. Refactor Plan Adherence

*   **Status:** Pre-refactor state.
*   **Planning Docs:** `REFACTOR_PLAN.md`, `PROJECT_STATE.md` exist.
*   **Implementation:** No refactor code implemented yet.

## 10. Conclusion

The project is a functional React app using Vite, Tailwind, and shadcn/ui. Its primary weakness is hardcoded data, making it difficult to maintain and scale. `ArtifactCode.jsx` needs significant refactoring. The `REFACTOR_PLAN.md` accurately addresses these issues. The project is ready to begin Phase 1 implementation as outlined in `PROJECT_STATE.md`.

**Next Action:** Create `src/schemas/` directory. 