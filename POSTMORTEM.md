# Postmortem: `phonelist-canonicalizer` Script Development & Pivot

**Date:** 2025-05-03

**Context:** This document clarifies the development process and final purpose of the `phonelist-canonicalizer` script (`lib/`, `scripts/`) within the `tsa-phone-list` repository.

**1. Initial Goal (Based on `canonicalize.protocol.ts` & Initial Understanding):**

The script was initially conceived to implement the V2 specification outlined in `canonicalize.protocol.ts`. This involved:
*   Reading multiple sources: Office 365 CSV export, `App.jsx`, `ArtifactCode.jsx`.
*   Parsing data from all sources (including complex JSX parsing).
*   Implementing logic to merge entities found in multiple sources (CSV + JSX -> `source: "Merged"`).
*   Incorporating specific data points like desk extensions and office locations from JSX.
*   Generating a single, canonical `canonicalContactData.json` file from scratch based on this merged data.
*   Providing validation, hashing, diffing, and CSV export based on this generated file.

A significant portion of the initial development effort focused on building the CSV->JSON generation pipeline based on this understanding.

**2. Development Challenges & Debugging:**

Development encountered several obstacles:
*   **Module System Conflicts:** Extensive debugging was required to resolve conflicts between the project's `package.json` setting (`"type": "module"`) and the requirements for compiling/running the Node.js script (ESM vs CJS, `tsc` options, `ts-node` vs direct `node` execution).
*   **File Write Issues:** An elusive bug preventing the correct persistence of the generated JSON file was eventually traced to a case-sensitivity mismatch between the code (`"Display Name"`) and the actual CSV header (`"Display name"`).
*   **Testing Environment:** Test setup (`vitest`) required careful handling of mocks (`vi.doMock`) and resolution of type/import issues specific to the test runner context.

**3. Critical Pivot Point & Clarification:**

Late in the development cycle, it was clarified that:
*   The merging of CSV and JSX data had **already occurred** through a previous process.
*   The file `src/data/reference_example.json` represented the **actual, correct, merged data state**.
*   This existing merged data should be treated as the **source of truth**, copied into the **live, mutable** file `src/data/canonicalContactData.json`.
*   The **true requirement** for the `phonelist-canonicalizer` script was **not** to regenerate this merged data, but to serve as a **stop-gap utility** focused on:
    1.  **Validating** the *live* `canonicalContactData.json`.
    2.  **Exporting** data *from* `canonicalContactData.json` into an O365-compatible CSV for manual updates.
    3.  **(Future)** Potentially **selectively updating** `canonicalContactData.json` *from* a new O365 CSV (handling additions and specific field updates like mobile/title) while preserving the existing merged data.

**4. Refactoring & Final State:**

Following the clarification, the script and project were refactored:
*   `src/data/canonicalContactData.json` was initialized with the correct merged data.
*   `scripts/canonicalize.ts` was restructured: default mode validates the live JSON; `--export-csv` exports it; `--update-from-csv` was added as a placeholder for the selective update logic.
*   `lib/schema.ts` was updated to accurately reflect the schema of the *merged* data.
*   Unit and Integration tests were updated and confirmed passing for the implemented validation and export features.
*   `lib/toCanonical.ts` (originally for CSV->JSON generation) was retained, as its internal row-processing logic is needed for adding new users in the future `--update-from-csv` implementation.
*   Documentation (`README.md`, `PROJECT_STATE.md`, etc.) and code comments were updated to reflect the script's actual purpose and history.
*   `canonicalize.protocol.ts` was marked as archival.

**5. Lessons Learned / Future Considerations:**

*   **Requirement Clarity:** Establishing the precise role of input/output files and the script's exact objective earlier would have saved significant development time.
*   **Documentation Accuracy:** Keeping project documentation (`.md` files) strictly synchronized with the actual project state is crucial.
*   **Build/Runtime Setup:** Carefully configuring the build/runtime environment (TSConfig, Node module system interactions) upfront is important for Node.js/TypeScript projects.
*   **Update Logic:** The `--update-from-csv` feature remains a key pending item to fully realize the O365 sync utility goal. 