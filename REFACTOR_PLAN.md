# Refactoring Plan: Contact Directory V2 - Operational Graph Model

**1. Vision & Goals:**

*   **Truth-First Data Model:** Model the directory as a dynamic graph of entities, operational roles, contact points, and their relationships over time, independent of specific UI views. Prioritize semantic accuracy and operational reality.
*   **Scalability & Maintainability:** Design a schema that handles complexity (multi-role, multi-site, shared resources, temporal changes) and integrates smoothly with authoritative sources like Azure Entra.
*   **Operational Efficiency & Intent Resolution:** Create a UI and underlying logic optimized for action, complex lookups, and resolving contact *intent* (e.g., "find backup", "escalate issue") beyond simple name/number retrieval.
*   **Interactivity, Responsiveness & Access Control:** Implement a modern, dense UI with robust filtering, search, click-to-action, adaptive layouts, and appropriate visibility controls based on user context/role.
*   **Azure Entra Readiness & Presence Integration:** Design the internal model to map cleanly to Entra attributes and include hooks for real-time presence information.

**2. Phased Approach:**

*   **Phase 1: Foundational Graph Schema & Temporal Logic:** Define the core, unified schemas (`ContactEntity`, `Role`, `ContactPoint`, `Location`) incorporating operational semantics, relationships, temporal validity, and visibility. Refactor initial data.
*   **Phase 2: Service Layer & Resolution Logic:** Implement the service layer to load, process, resolve, and filter data based on time, priority, visibility, and basic intent. Refactor core components to consume resolved data.
*   **Phase 3: Advanced UI/UX & Interactivity:** Build out the interactive UI (search, filters, adaptive layout, actions) leveraging the resolved data and service layer capabilities.
*   **Phase 4: Azure Entra Integration & Presence:** Implement Entra data fetching, transformation, merging, and display real-time presence information.

**3. Phase 1: Foundational Graph Schema & Temporal Logic (`src/schemas/`, `src/data/`)**

*   **3.1. Define Core Schemas (`src/schemas/directorySchemas.js`):** *(Major Overhaul)*
    *   **`ContactEntity` Schema:** (Unified)
        *   `id`: Unique identifier (system-generated UUID, UPN/ObjectID from Entra, or manual ID).
        *   `entityType`: Enum/string ('person', 'organization', 'system_resource').
        *   `source`: Enum/string ('manual', 'entra', 'vendor_api', 'system_defined').
        *   `tags`: Array of strings (e.g., 'internal', 'external', 'vendor', 'department:Finance', 'critical_partner').
        *   `names`: Array of `Name` objects (legal, display, alias).
        *   `roleAssignments`: Array of `RoleAssignment` objects (linking Entity to Role + temporal/priority info).
        *   `contactPointAssignments`: Array of `ContactPointAssignment` objects (linking Entity/Role to ContactPoint + temporal/usage info).
        *   `presence`: Object { `status`, `lastSeen`, `provider` }. *[Placeholder for Phase 4]*
        *   `audit`: Object { `created`, `modified` }.
        *   `validFrom`, `validTo`: Timestamps for entity validity.
    *   **`Name` Schema:**
        *   `type`: Enum/string ('legal', 'display', 'alias').
        *   `value`: The name string.
    *   **`Role` Schema:** (Operational Definition)
        *   `id`: Unique ID for the operational role definition (e.g., 'closer_mi', 'exec_primary', 'it_support_tier1').
        *   `function`: Primary operational function (e.g., 'Closing', 'Executive Management', 'IT Support', 'Abstracting', 'Finance Approval').
        *   `jurisdiction`: Geographic/legal region primary focus (e.g., 'MI', 'FL', 'OaklandCounty', 'Federal'). *Optional.*
        *   `coverage`: Array of jurisdictions/areas supported (e.g., ['MI', 'FL', 'National']).
        *   `title`: Common display title (e.g., "Closer", "CEO", "IT Helpdesk"). *[Display Aid]*
        *   `tags`: Array of strings ('executive', 'support-tier1', 'customer-facing', 'approval-required').
        *   `fallbackRoleId`: *Optional* ID of the role to escalate/route to.
        *   `validFrom`, `validTo`: Timestamps for role definition validity.
    *   **`RoleAssignment` Schema:** (Connects Entity to Role)
        *   `assignmentId`: Unique ID for this specific assignment instance.
        *   `entityId`: Reference to `ContactEntity.id`.
        *   `roleId`: Reference to `Role.id`.
        *   `physicalLocationId`: *Optional* Reference to `Location.id`.
        *   `priority`: Number indicating rank among the entity's roles (lower is higher).
        *   `isPrimary`: Boolean marker for the main role.
        *   `validFrom`, `validTo`: Timestamps for role assignment validity.
    *   **`ContactPoint` Schema:** (Reusable Contact Assets)
        *   `id`: Unique ID for the contact point asset.
        *   `type`: Enum/string ('Extension', 'Cell', 'Direct', 'Email', 'SharedLine', 'RoleEmail', 'Voicemail').
        *   `value`: The actual number, email address, or identifier.
        *   `description`: *Optional* user-friendly description (e.g., "Main Closing Line - MI", "Support Queue Voicemail").
        *   `locationId`: *Optional* Reference to `Location.id`.
        *   `isShared`: Boolean.
        *   `visibilityScope`: Enum/string ('public', 'internal', 'admin', 'role:exec', 'function:closing').
        *   `tags`: Array of strings ('primary', 'after-hours', 'desk', 'mobile', 'urgent').
        *   `validFrom`, `validTo`: Timestamps for contact point validity.
    *   **`ContactPointAssignment` Schema:** (Connects Entity/Role to ContactPoint)
        *   `assignmentId`: Unique ID for this specific assignment instance.
        *   `contactPointId`: Reference to `ContactPoint.id`.
        *   `assignedToEntityId`: *Optional* Reference to `ContactEntity.id`.
        *   `assignedToRoleAssignmentId`: *Optional* Reference to `RoleAssignment.assignmentId` (links contact point usage to a specific role instance for the entity).
        *   `usageType`: Enum/string ('primary', 'secondary', 'after-hours', 'backup', 'notification').
        *   `validFrom`, `validTo`: Timestamps for assignment validity.
    *   **`Location` Schema:**
        *   `id`, `name`, `address`, `mainPhone`, `mainFax`, `tags` (e.g., 'physical', 'virtual', 'hq').
        *   `validFrom`, `validTo`: Timestamps for location validity.

*   **3.2. Refactor Data Source (`src/data/seedData.js`):**
    *   Populate according to the *new unified `ContactEntity`* and related schemas.
    *   Represent Sydney Williams as *one* `ContactEntity` (`entityType: 'person'`) with two `RoleAssignment` entries (linking her entity ID to the 'closer_mi' and 'closer_fl' `Role` definitions, each with its own assignment validity). Create separate `ContactPoint` assets for the MI and FL extensions. Create `ContactPointAssignment` entries linking Sydney's *role assignments* (or entity ID for personal points) to the relevant `ContactPoint` IDs, specifying usage and validity.
    *   Define `Role` definitions (operational functions/scopes) separately.
    *   Define `Location` data separately.
    *   Define shared/role-based `ContactPoint` assets explicitly.
    *   Represent external orgs (Wayne County) as `ContactEntity` (`entityType: 'organization'`).
    *   Set `validFrom`/`validTo` appropriately (e.g., `validFrom: now`, `validTo: null` for current).

*   **3.3. Prepare Service Layer Stubs (`src/services/directoryService.js`):**
    *   Define function signatures for loading, resolving, filtering based on time, roles, visibility, etc. Implementation deferred to Phase 2.
    *   Define how intent queries might look (e.g., `resolveContact({ intent: 'escalate', fromRole: 'support-tier1', jurisdiction: 'MI' })`).

**4. Phase 2: Service Layer & Resolution Logic**

*   **4.1. Implement `directoryService.js`:**
    *   Load raw seed data (Entities, Roles, Locations, ContactPoints, Assignments).
    *   Implement **temporal filtering:** Core logic to return only currently valid entities, roles, points, and assignments.
    *   Implement **resolution logic:** Functions to take an entity ID or an intent query and return resolved, context-aware contact information, considering:
        *   Role priorities (`isPrimary`, `priority`).
        *   Contact point usage (`usageType`).
        *   Temporal validity of all linked objects.
        *   Visibility scope based on assumed user context (initially 'internal').
        *   Basic fallback logic using `fallbackRoleId`.
    *   Implement filtering/searching functions operating on the *resolved* data state.

*   **4.2. Refactor `ContactDirectory` & `ContactCard` Components:**
    *   Consume *resolved* data from `directoryService.js` (via a hook like `useDirectoryResolver`).
    *   `ContactCard` displays resolved roles (e.g., "Closer [MI, FL]"), primary contact points based on context, respecting visibility. May need UI to toggle between roles or view all assigned points.
    *   Rendering logic adapts to the resolved, unified `ContactEntity`.

*   **4.3. Refactor `App.jsx` & Surroundings:**
    *   Implement recommendations for info bar consolidation and denser location display (accordion, interactive grid).

**5. Phase 3: Advanced UI/UX & Interactivity**

*   **5.1. Implement Rich Search & Filtering:**
    *   Leverage `directoryService.js` for efficient backend filtering.
    *   Search across names, resolved roles (`function`, `jurisdiction`, `title`), locations, entity types, tags.
    *   Filter controls for operational roles, locations, entity types, availability (when added).

*   **5.2. Optimize Layout & Interaction:**
    *   Implement adaptive grid/list layout.
    *   Use interactive elements (menus, tooltips) to manage contact point density.
    *   Add click-to-copy, `tel:`, `mailto:`.
    *   Implement keyboard navigation.
    *   *Advanced:* Visualize role fallbacks or coverage areas on hover/selection.

*   **5.3. Integrate Access Control:**
    *   Pass user context (role/permissions) to `directoryService.js`.
    *   Ensure service layer filters results based on `visibilityScope`.
    *   UI adapts to hide/show elements based on resolved visibility.

**6. Phase 4: Azure Entra Integration & Presence**

*   **6.1. Implement `entraService.js`:**
    *   Fetch data from Graph API.
    *   Transform Entra attributes (UPN, jobTitle, officeLocation, etc.) into the internal `ContactEntity`, `RoleAssignment`, and potentially seed `ContactPoint` schemas (using `source: 'entra'`).

*   **6.2. Integrate Entra Data:**
    *   `directoryService.js` merges Entra data with manual data, respecting `source` and potentially defining override rules.
    *   Handle mapping Entra groups/roles to internal operational `Role` definitions.

*   **6.3. Implement Presence:**
    *   Fetch presence data (e.g., via Graph presence API).
    *   Update the `presence` field in the resolved `ContactEntity` state.
    *   `ContactCard` displays presence indicators.

**7. Technology Considerations:** (Mostly unchanged, but service layer importance increases)

*   State Management: Crucial for managing resolved state, filters, user context. Zustand/Redux recommended.
*   Service Layer: Needs careful design for performance and testability.

**8. Potential File Structure:** (Schema/Service layer becomes more critical)

```
src/
├── components/
│   ├── ContactCard.jsx
│   ├── ContactDirectory.jsx
│   └── ... (Filters, SearchBar, Layout components)
├── data/
│   └── seedData.js
├── hooks/
│   └── useDirectoryResolver.js # Hook to interact with service
├── schemas/
│   └── directorySchemas.js
├── services/
│   ├── directoryService.js     # Core logic: loading, resolving, filtering
│   ├── entraService.js         # Phase 4
│   └── aclService.js           # Access control logic (optional breakout)
├── App.jsx
└── ...
```

This revised plan directly addresses the critiques by embedding operational semantics, temporal awareness, relationship modeling, and access control into the core schema design from Phase 1, setting a much stronger foundation for the subsequent phases. 