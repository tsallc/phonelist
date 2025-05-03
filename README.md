# TSA Phone List & Contact Directory

This project contains the Title Solutions Agency (TSA) phone list React web application and a supporting Node.js utility script for managing contact data.

## Project Overview

This repository houses two main parts:

1.  **`tsa-phone-list` (React Application):** A web application (built with Vite, React, shadcn/ui, Tailwind) intended to display contact information and an interactive office map. It is currently undergoing a major refactoring effort (see [REFACTOR_PLAN.md](REFACTOR_PLAN.md)).
2.  **`phonelist-canonicalizer` (Node.js Utility Script):** A command-line tool (located in `lib/`, `scripts/`) designed as a **stop-gap measure** to help synchronize contact data between the canonical JSON data file used by this project and Office 365/Entra ID via CSV export/import.

**Data Source of Truth:**

*   **`src/data/canonicalContactData.json`**: This is the **LIVE, MUTABLE** source of truth for the application. It contains merged contact data derived historically from Office 365 and older application code (`App.jsx`, `ArtifactCode.jsx`). It should be modified directly or via the `--update-from-csv` feature (when implemented) of the canonicalizer script.
*   **`src/data/reference_example.json`**: This is a **READ-ONLY, STATIC** copy representing the initial, correctly merged data state. It serves as a reference and was used to initialize `canonicalContactData.json`.

---

## 1. React Application (`tsa-phone-list`)

Displays contact directory and office map.

### Technology Stack

*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Package Manager:** PNPM
*   **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
*   **Styling:** Tailwind CSS
*   **Deployment:** GitHub Pages (`gh-pages`)

### Status

*   **Refactoring Required:** The application requires significant refactoring as outlined in [REFACTOR_PLAN.md](REFACTOR_PLAN.md).
*   **Data Source:** Currently uses deprecated hardcoded data in `App.jsx` and `ArtifactCode.jsx`. Phase 1 of the refactor involves updating components to read from `src/data/canonicalContactData.json`.
*   **See:** [PROJECT_STATE.md](PROJECT_STATE.md) for detailed progress.

### Setup & Running

1.  **Clone:** `git clone <repository-url>`
2.  **Install:** `pnpm install`
3.  **Run Dev Server:** `pnpm run dev` (typically `http://localhost:5173`)

### Building & Deployment

*   **Build:** `pnpm run build` (outputs to `dist/`)
*   **Deploy:** `pnpm run deploy` (uses `gh-pages`)

---

## 2. Data Canonicalizer Utility (`phonelist-canonicalizer`)

This CLI script (**located in `lib/` and `scripts/`**) provides helper functions for managing the live data file (`src/data/canonicalContactData.json`) and syncing with O365 via CSV.

**Current Purpose (Stop-Gap):**

1.  **Validate:** Read and validate the structure and integrity of `src/data/canonicalContactData.json` against the defined schema (`lib/schema.ts`).
2.  **Export:** Generate an O365-compatible CSV file from the data in `src/data/canonicalContactData.json`, suitable for manual import/update into O365/Entra.
3.  **(Future)** Selectively update `src/data/canonicalContactData.json` with specific fields from a fresh O365 CSV export (e.g., mobile phone numbers, titles) while preserving existing merged data (desk extensions, locations).

**Note:** This script *does not* generate the merged `canonicalContactData.json` from scratch; it operates on the existing live file which was initialized from `reference_example.json`.

### Technology Stack

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Core Libraries:** `zod`, `fast-csv`, `commander`, `fs-extra`, `vitest`, `execa`

### Setup

Dependencies are shared with the main project. Ensure you have run `pnpm install` in the root directory.

### Building the Script

*   Run: `pnpm run build:canon`
*   Output: Compiles TypeScript to JavaScript in `dist/canon/` using `tsconfig.canon.json`.

### Running the Script

It's recommended to run the compiled script directly with `node`.

**Default Mode (Validate Live JSON):**
```bash
node dist/canon/scripts/canonicalize.js 
# OR specify a different live file:
node dist/canon/scripts/canonicalize.js --json path/to/other_live_data.json 
```
*   Reads the JSON file specified by `--json` (defaults to `src/data/canonicalContactData.json`).
*   Validates its structure against `lib/schema.ts`.
*   Reports success or validation errors.

**Export Mode (Live JSON -> O365 CSV):**
```bash
node dist/canon/scripts/canonicalize.js --export-csv path/to/output_for_o365.csv
# OR using a specific live file as source:
node dist/canon/scripts/canonicalize.js --json path/to/live_data.json --export-csv path/to/output_for_o365.csv
```
*   Reads the live JSON (default or specified by `--json`).
*   Validates the JSON (but proceeds with warning on failure).
*   Generates a CSV file at the `--export-csv` path with columns suitable for O365 import (Display Name, Mobile Phone, UPN, Title, etc.).

**Update Mode (O365 CSV -> Live JSON - *Placeholder Logic Only*):**
```bash
node dist/canon/scripts/canonicalize.js --update-from-csv path/to/new_o365_export.csv
# OR specifying different input/output JSON files:
node dist/canon/scripts/canonicalize.js --json path/to/live_data.json --update-from-csv path/to/new_o365_export.csv --out path/to/updated_live_data.json 
```
*   **Warning:** The core update logic (`lib/updateFromJson.ts`) is **not yet implemented**. This command currently reads the files but does not modify the target JSON.
*   Reads the live JSON (`--json`).
*   Reads the new O365 CSV (`--update-from-csv`).
*   (Placeholder) Skips actual data merging.
*   Validates the (unmodified) data.
*   Compares hashes (will report no changes).
*   Does **not** write the output JSON (`--out`) unless changes were hypothetically detected.
*   Use `--dry-run` to simulate without writing, `--fail-on-diff` to exit with error if changes were detected.

**Other Options:**
*   `--verbose` or `-v`: Enable detailed debug logging.
*   `--help`: Display help message with all options.

### Testing

Unit and Integration tests (using `vitest`) are located in `lib/tests/` and `scripts/tests/`. Run them using:
```bash
pnpm test
# OR run specific test files
pnpm test lib/tests/validateCanonical.test.ts
pnpm test scripts/tests/canonicalize.integration.test.ts
```
All tests for implemented features (validation, export) are currently passing.

---

## Contributing

Please refer to the project state (`PROJECT_STATE.md`) and refactor plan (`REFACTOR_PLAN.md`) before making significant changes.

## License

[MIT](LICENSE)
