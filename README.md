# TSA Phone List & Contact Directory

This project contains the web application for the Title Solutions Agency (TSA) phone list and contact directory, along with supporting tools for data management.

## Project Overview

The main application (`tsa-phone-list`) is a React web application built with Vite, shadcn/ui, and Tailwind CSS. It currently provides:

1.  **Contact Directory:** Displays contact information for personnel across related entities (TSA, Coastal Title, TruTitle).
2.  **Office Map:** An interactive floor plan visualization.

**Current Status:** The application is undergoing a significant refactoring effort (see [REFACTOR_PLAN.md](REFACTOR_PLAN.md)) to move away from hardcoded data towards a robust, scalable, data-driven architecture. The canonical source of truth for contact data is now managed in `src/data/canonicalContactData.json`.

## 1. React Application (`tsa-phone-list`)

### Technology Stack

*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Package Manager:** PNPM
*   **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
*   **Styling:** Tailwind CSS
*   **Deployment:** GitHub Pages (`gh-pages`)

### Setup & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd tsa-phone-list
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Run the development server:**
    ```bash
    pnpm run dev
    ```
    This will start the Vite development server, typically available at `http://localhost:5173`.

### Building & Deployment

*   **Build for production:**
    ```bash
    pnpm run build
    ```
    This creates an optimized build in the `dist/` directory.
*   **Deploy to GitHub Pages:**
    ```bash
    pnpm run deploy
    ```
    This script uses `gh-pages` to push the contents of the `dist/` directory to the `gh-pages` branch.

### Refactoring Status

As mentioned, the React application is being refactored. Key components like `App.jsx` and `ArtifactCode.jsx` still contain deprecated data structures and logic. Phase 1 of the refactor, which involves reading from the canonical data file (`src/data/canonicalContactData.json`), is pending completion of the canonicalizer tool (see below).

See [REFACTOR_PLAN.md](REFACTOR_PLAN.md) for the detailed refactoring strategy and [PROJECT_STATE.md](PROJECT_STATE.md) for the current progress.

---

## 2. Data Canonicalizer Script (`phonelist-canonicalizer`)

This is a supporting Node.js/TypeScript tool located within the `lib/` and `scripts/` directories of this project. Its primary purpose is to process various data sources (starting with Office365 CSV exports) and generate the validated, canonical `src/data/canonicalContactData.json` file, which serves as the single source of truth for the main React application.

This script is essential for Phase 1 of the refactoring plan.

### Technology Stack

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Core Libraries:**
    *   `zod`: Schema definition and validation.
    *   `fast-csv`: CSV parsing.
    *   `slugify`: Generating URL-friendly IDs.

### Purpose & Workflow

1.  **Input:** Takes data sources like `users.csv` (Office365 export).
2.  **Processing:**
    *   Parses the input data.
    *   Transforms data into the canonical schema defined in `lib/schema.ts`.
    *   Generates unique IDs (slug or hash-based).
    *   Validates the output against the Zod schema.
    *   Compares the output against the previous version (`src/data/canonicalContactData.json`) using hashing and ID-based diffing.
    *   Computes a SHA-256 hash for integrity checking.
3.  **Output:**
    *   Overwrites `src/data/canonicalContactData.json` with the latest validated data.
    *   Outputs diff logs (`logs/diff-YYYY-MM-DD.json`).
    *   (Optional) Generates a reverse-exported CSV (`exported_users.csv`).

### Running the Script

*(Note: The script's CLI interface (`scripts/canonicalize.ts`) is currently under development. The following commands assume its completion based on the planned structure.)*

Ensure dependencies are installed (`pnpm install`).

*   **Run using ts-node (development):**
    ```bash
    # Example: Process users.csv and output to default location
    pnpm run dev:canon -- --input path/to/users.csv

    # Example: Dry run (validate and diff, but don't write)
    pnpm run dev:canon -- --input path/to/users.csv --dry-run

    # Example: Export to CSV as well
    pnpm run dev:canon -- --input path/to/users.csv --export-csv path/to/exported_users.csv
    ```
    *(Note the `--` which separates pnpm arguments from script arguments)*

*   **Build the script:**
    ```bash
    pnpm run build:canon
    ```
    This compiles the TypeScript code to JavaScript in the `dist/` directory (requires `tsconfig.canon.json` to be configured).

*   **Run the compiled script:**
    ```bash
    # Example: Process users.csv
    pnpm run start:canon -- --input path/to/users.csv
    ```

See the script's CLI help (once implemented) for all available options (`pnpm run dev:canon -- --help`).

---

## Contributing

Please refer to the project state (`PROJECT_STATE.md`) and refactor plan (`REFACTOR_PLAN.md`) before making significant changes.

## License

[MIT](LICENSE)
