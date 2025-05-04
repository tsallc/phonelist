# Project State

**Last Updated:** 2024-05-27 # Updated timestamp to reflect latest changes

## Current Focus

- **Functional Printable Phone List:** The primary focus is creating a functionally identical implementation of the phone list that maintains its purpose as a physical, printable reference document. The phone list is designed to be printed on standard 8.5 x 11 paper and pinned to employees' desks for quick reference.
- **Visual Consistency with Legacy View:** The new implementation MUST visually match the legacy version as closely as possible. This includes identical section grouping, information density, font sizing, and overall layout. The legacy implementation in `LegacyContactDirectory` serves as the visual template.
- **Print Optimization:** CSS and layout will be optimized for printing on standard paper, with appropriate page breaks and scaling to ensure the content fits properly on a physical page.
- **Data from Canonical Source:** While maintaining the legacy visual format, the implementation will pull data from the canonical data source (`canonicalContactData.json`), not hardcoded values.

## Overall Progress

- **Plan:** `REFACTOR_PLAN.md` defined for the main React application refactor.
- **Canonicalizer Script (O365 CSV Utility):**
    - Phase 1 (Setup & Schema): ✅ Completed
    - Phase 2 (Ingest & Transform): ✅ Completed (CSV->JSON logic retained, but not default path)
    - Phase 3 (Validation, Diff, Hash): ✅ Completed
    - Phase 4 (Output Generation): ✅ Completed (JSON write via update, CSV export)
    - Phase 5 (CLI): ✅ Completed (Validation default, Export flag, Update flag implemented)
    - **Phase 6 (Testing): ✅ Unit & Integration tests implemented and passing.**
    - **Phase 7 (Refinement): ✅ Added --verbose flag, resolved build/runtime issues, established robust contracts, Refactored update logic to decouple Office/Title.**
- **React App Refactor:**
    - Phase 0 (Analysis, Planning, Data Extraction): ✅ Completed
    - **Phase 1 (Schema & Foundation): ✅ Completed** - App uses `canonicalContactData.json` via `contactDataService.ts` and `ContactDataContext.tsx`. New components (`Directory.tsx`, `ContactList.tsx`, `ContactCard.tsx`) are in use but DON'T match the legacy layout and aren't optimized for printing.
    - **Phase 2 (Printable Directory Implementation): 🔄 In Progress** - Creating a new implementation that matches the legacy view exactly while using canonical data.

- **Milestones Completed:**
    - Project analysis and initial refactoring plan creation (`REFACTOR_PLAN.md`).
    - State tracking (`PROJECT_STATE.md`) and codebase audit (`CODEBASE_AUDIT.md`) files created.
    - Established `src/data/canonicalContactData.json` as the live, mutable source of truth.
    - Developed `phonelist-canonicalizer` script with validation, CSV export, and selective update capabilities.
    - Implemented basic React app data service and context for canonical data.

- **Milestones Pending:**
    - **Create Printable Phone List:** Implement a version of the directory that precisely matches the legacy view's layout, designed for printing on 8.5 x 11 paper. This is the PRIMARY milestone.
    - **Print Stylesheet:** Add dedicated print styles to ensure proper rendering on physical paper.
    - **Section-by-Section Verification:** Confirm all information sections from the legacy view are preserved exactly:
        - Company header with license numbers
        - Email addresses section (docs/title/funding)
        - Intercom numbers section
        - Office locations with addresses and phone/fax
        - Michigan Extensions section
        - Florida Extensions section
        - IT Department section
        - Cell Numbers section 
        - Treasurers/Additional Numbers section
    - **Feature Flag Enhancement:** Maintain the feature toggle to allow comparing legacy and new views side-by-side to verify all information is preserved.
    - **Documentation Update:** Ensure all documentation reflects the printable phone list requirements.
    - **Manual Testing:** Physical print testing to verify the output matches expectations on paper.

## Recent Activity

- **Implemented PrintableDirectory Component:** Created a new `PrintableDirectory.tsx` component that visually matches the legacy view exactly while pulling data from the canonical data source. Used CSS Grid to faithfully replicate the multi-column layout of the phone list.
- **Added Print-Specific Styling:** Created `PrintableDirectory.css` with media queries to optimize the phone list for printing on standard 8.5 x 11 paper. Includes proper page margins, font sizing, and print-specific adjustments.
- **Enhanced Feature Toggle:** Updated `App.jsx` to support three view options: "Legacy" (original hardcoded view), "Modern" (new responsive UI), and "Printable" (exact visual match of legacy view). Added a Print button to the printable view.
- **Clarified Phone List Purpose:** Recognized that the primary purpose of the directory is to serve as a printable 8.5 x 11 reference document that employees pin to their desks. This has significant implications for the UI design and layout requirements.
- **Previous:** Redirected implementation approach, verified React app refactor state, refactored data model, fixed canonicalizer tests.

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

1. **Test PrintableDirectory Implementation:**
   - Compare both on-screen and printed output to the legacy view
   - Verify all sections appear in the correct order and format
   - Test printing on actual 8.5 x 11 paper to confirm layout and readability
   - Check that all contact data is correctly pulled from the canonical source

2. **Refine Print Layout if Needed:**
   - Adjust font sizes, spacing, or grid layouts based on print testing
   - Ensure all content fits properly on a single page when possible
   - Verify that page breaks occur in appropriate locations for multi-page prints

3. **Data Completeness Check:**
   - Verify that all contacts from the legacy view appear in the printable view
   - Confirm that the Treasurers/Additional Numbers section contains all required entries
   - Ensure IT Department contact info is correctly displayed

4. **Documentation Update:**
   - Document the printable directory implementation
   - Update any relevant comments in the code
   - Add instructions for printing the directory in the UI

5. **Consider Optimization for Office Map:**
   - Apply similar principles to the office map if it also needs to be printable
   - Evaluate whether `ArtifactCode.jsx` should be refactored in the same way

## Blockers/Issues

- **Print Format Requirements:** The need for an exact visual match to the legacy view and print optimization presents design constraints that conflict with modern web UI patterns.
- **Legacy Code Preservation:** Legacy code must be preserved during testing to ensure the new implementation matches it exactly.
- **Information Density:** The compact layout of the legacy view requires precise CSS grid implementation rather than modern card-based layouts.
- **Print Testing Environment:** Physical print testing will be needed to verify the output.

## Relevant Files & Context

- `REFACTOR_PLAN.md`: Guiding refactoring document for the main React app.
- `CODEBASE_AUDIT.md`: Detailed analysis of codebase state.
- `PROJECT_STATE.md`: This file.
- `src/data/canonicalContactData.json`: **THE Live, Mutable Source of Truth.**
- `lib/*.ts`: Modules for the canonicalizer script.
- `scripts/canonicalize.ts`: Main CLI entry point for the canonicalizer.
- `src/lib/contactDataService.ts`: React app service for loading/validating canonical data.
- `src/contexts/ContactDataContext.tsx`: React context providing canonical data.
- `src/pages/Directory.tsx`: Current directory page component (DOES NOT match legacy view visually).
- `src/components/contact/*.tsx`: Current directory UI components (too modern/card-based).
- `App.jsx`: Contains legacy directory code and feature toggle. **REFERENCE FOR VISUAL LAYOUT.**
- `ArtifactCode.jsx`: Legacy office map component (TO BE REFACTORED).

## LLM Agent Instructions

- **Treat `src/data/canonicalContactData.json` as the live source of truth.**
- The `phonelist-canonicalizer` script is stable and used to manage this file. **All tests pass.**
- **The immediate goal is to implement a printable phone list that visually matches the legacy view exactly.**
- The phone list must be formatted for printing on standard 8.5 x 11 paper.
- The visual layout must precisely match the `LegacyContactDirectory` component in `App.jsx`.
- Use the canonical data source but present it in the exact same format as the legacy view.
- Update `Last Updated`, `Recent Activity`, and `Next Steps` after completing tasks.

---

## Development Summary (Mission Report)

**Current State:** The React application's Contact Directory view has been refactored to use the canonical data source but fails to meet the critical requirement of maintaining the exact same visual layout as the legacy view. The directory is intended as a printable desk reference that employees physically pin to their desks, requiring a precise visual match to the legacy format rather than a modern UI makeover. The next step is implementing a new printable directory view that maintains the same compact, information-dense layout while using the canonical data source. 