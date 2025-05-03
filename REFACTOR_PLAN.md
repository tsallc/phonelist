# Refactoring Plan: Contact Directory V2

**1. Vision & Goals:**

*   **Truth-First Data Model:** Structure data based on real-world entities (people, locations, roles, contact methods) independent of UI presentation.
*   **Scalability & Maintainability:** Design a schema and components that easily adapt to new locations, roles, people, and data sources (like Azure Entra).
*   **Operational Efficiency:** Create a UI optimized for speed, density, and common tasks (lookup, contact initiation, filtering). Prioritize action over static display.
*   **Interactivity & Responsiveness:** Implement modern UI patterns: search, filtering, hover states, click-to-action, adaptive layouts.
*   **Azure Entra Readiness:** Design the internal data model and architecture to facilitate straightforward integration with Azure Entra ID as the primary source for staff information in the future.

**2. Phased Approach:**

This will be a multi-phase refactor to manage complexity:

*   **Phase 1: Data Model & Schema Overhaul:** Establish the correct, normalized data structure.
*   **Phase 2: Core Component Refactor & Dynamic Rendering:** Rebuild UI components to consume and render the new data model dynamically.
*   **Phase 3: UI/UX Enhancement & Interactivity:** Implement advanced features like search, filtering, improved layout density, and actions.
*   **Phase 4: Azure Entra Integration Strategy & Prep:** Define mapping and prepare service layers for external data fetching.

**3. Phase 1: Data Model & Schema Overhaul (`src/schemas/`, `src/data/`)**

*   **3.1. Define Core Schemas (`src/schemas/directorySchemas.js`):**
    *   **`Person` Schema:**
        *   `id`: Unique identifier (e.g., `sydney_williams` or future UPN/ObjectID from Entra).
        *   `fullName`: Official full name.
        *   `displayName`: Preferred display name (e.g., "Sydney").
        *   `roles`: Array of `Role` objects.
        *   `contactMethods`: Array of `ContactMethod` objects.
        *   `source`: Indicator ('manual', 'entra'). *[Future]*
    *   **`Role` Schema:**
        *   `title`: Job title (e.g., "Operations", "Executive", "IT Support").
        *   `locationId`: Reference to a `Location` ID (e.g., `plymouth`, `ft_lauderdale`).
        *   *Optional:* `department`, `managerId`, etc. (consider Entra fields).
    *   **`ContactMethod` Schema:**
        *   `id`: Unique ID for the method.
        *   `type`: Enum/string ('Extension', 'Cell', 'Direct', 'Email').
        *   `value`: The actual number or email address.
        *   `locationId`: *Optional* reference to `Location` ID (for site-specific extensions/numbers).
        *   `tags`: Array of strings ('primary', 'after-hours', 'desk', 'mobile').
        *   `isPublic`: Boolean (for filtering sensitive numbers). *[Optional]*
    *   **`Location` Schema:**
        *   `id`: Unique ID (e.g., `plymouth`, `ft_lauderdale`, `tampa_reo`).
        *   `name`: Display name (e.g., "Michigan Office", "Florida Office").
        *   `address`: Full address details.
        *   `mainPhone`, `mainFax`: *Optional* office-level numbers.
    *   **`ExternalContact` Schema:** (Separate for now, potential merge later)
        *   `id`, `name`, `contactMethods` (simplified), `purpose`, `usageScope`, `tags`.

*   **3.2. Refactor Data Source (`src/data/seedData.js` or similar):**
    *   Populate this file with data conforming to the *new* schemas.
    *   **Crucially:** Represent Sydney Williams as *one* `Person` entity with two `Role` entries (one for MI, one for FL) and two `ContactMethod` entries (one Ext for MI, one Ext for FL).
    *   Define `Location` data separately.
    *   Map existing staff and external contacts to these new structures. Remove `sydney_mi`, `sydney_fl`. Explicitly define `locationId` where applicable.

*   **3.3. Implement Data Processing Logic (`src/hooks/useProcessedDirectoryData.js` or `src/services/directoryService.js`):**
    *   Create functions to:
        *   Load the raw seed data.
        *   *Derive* display groupings dynamically (e.g., group by primary role title, or allow dynamic filtering/grouping later). Do *not* hardcode groups like `OPS_MI`.
        *   Provide functions to filter/search the normalized data based on various criteria (name, role, location, tag).

**4. Phase 2: Core Component Refactor & Dynamic Rendering (`src/components/`)**

*   **4.1. Refactor `ContactDirectory` Component:**
    *   Consume data from the new processing logic (hook/service).
    *   Remove static group rendering logic. Implement rendering based on the *dynamically derived* groups or a flat, filterable list initially.
    *   Integrate a new `ContactCard` component.

*   **4.2. Create `ContactCard` Component (`src/components/ContactCard.jsx`):**
    *   Accepts a single `Person` or `ExternalContact` object.
    *   Displays `displayName` prominently.
    *   Displays `Role`(s) and `Location`(s) concisely (e.g., using badges: "Sydney Williams `[Ops: MI, FL]`").
    *   Renders `ContactMethod`s:
        *   Use appropriate icons per `type`.
        *   Clearly label `value`.
        *   Indicate `locationId` if relevant (e.g., a small MI/FL flag icon).
        *   Show `purpose`/`scope` for external contacts.
    *   Implement basic hover states.

*   **4.3. Refactor `App.jsx` & Surrounding Structure:**
    *   Consolidate top info bar (Email, Intercom) for better space usage.
    *   Re-evaluate the `Locations` section – potentially make it an accordion or a denser grid.

**5. Phase 3: UI/UX Enhancement & Interactivity**

*   **5.1. Implement Search & Filtering:**
    *   Add a prominent search bar.
    *   Use a library like `Fuse.js` for fuzzy searching on names, roles, locations, purposes.
    *   Add filter controls (dropdowns, buttons) for location, role/department, tags (e.g., 'after-hours').
    *   Ensure the `useProcessedDirectoryData` logic supports efficient filtering.

*   **5.2. Optimize Layout & Density:**
    *   Implement adaptive grid layout for contact cards (e.g., 3-col wide, 2-col medium, 1-col mobile).
    *   Reduce padding/margins where appropriate.
    *   Consider collapsing contact methods behind an icon menu or "show more" toggle for density.

*   **5.3. Add Actions & Interactivity:**
    *   Implement click-to-copy for numbers/emails.
    *   Add `tel:` and `mailto:` links.
    *   *Advanced:* Explore deep links to internal tools (e.g., Qualia user profile if possible).
    *   Add clear visual feedback on hover/click.

*   **5.4. Enhance Visual Cues:**
    *   Refine icon usage – focus on differentiation (type, location flag) rather than repetition.
    *   Use subtle visual cues for hierarchy (e.g., exec cards slightly different background?).
    *   *Advanced:* Integrate presence indicators (if available from Teams/Entra later).

**6. Phase 4: Azure Entra Integration Strategy & Prep**

*   **6.1. Define Entra ID Attribute Mapping:**
    *   Identify relevant Entra fields: `userPrincipalName` (for `id`), `displayName`, `givenName`, `surname`, `jobTitle`, `department`, `officeLocation`, `mobilePhone`, `businessPhones`, custom extension attributes if used.
    *   Map these to the internal `Person`, `Role`, `ContactMethod` schemas. Define fallback logic for missing fields.

*   **6.2. Develop Data Fetching Service (`src/services/entraService.js`):**
    *   Use `MSAL.js` for authentication (acquire token for Microsoft Graph).
    *   Use Microsoft Graph API (`/users` endpoint with `$select`, `$filter`) to fetch relevant user data.
    *   Implement logic to transform the fetched Graph data into the internal application schema.

*   **6.3. Integration Strategy:**
    *   Determine how Entra data merges with manually maintained `externalContacts`. (Use the `source` flag?).
    *   Define data refresh/caching strategy (fetch on load? background sync?).
    *   Modify `useProcessedDirectoryData` or main data loading logic to prioritize/merge Entra data when available.

**7. Technology Considerations:**

*   React, Tailwind CSS, Lucide Icons (Existing)
*   State Management: Consider Zustand or Redux Toolkit for managing complex filter/search state.
*   Fuzzy Search: Fuse.js
*   Azure Auth/API: MSAL.js (@azure/msal-react), Microsoft Graph SDK (optional, or direct fetch).

**8. Potential File Structure Adjustments:**

```
src/
├── components/
│   ├── ContactCard.jsx
│   ├── ContactDirectory.jsx
│   ├── Filters.jsx
│   └── SearchBar.jsx
├── data/
│   └── seedData.js        # Manual/initial data
├── hooks/
│   └── useProcessedDirectoryData.js
├── schemas/
│   └── directorySchemas.js
├── services/
│   ├── directoryService.js # Logic layer over data
│   └── entraService.js     # Future Entra fetching
├── App.jsx
└── index.js
``` 