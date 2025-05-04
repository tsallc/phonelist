/**
 * @module lib/updateFromJson
 * @description Provides functionality to update canonical contact data (ContactEntities)
 *              based on data imported from a CSV file. It merges specific fields,
 *              handles basic validation, and logs changes.
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { CanonicalExport, ContactEntity, ContactEntitySchema, ContactPoint, Role } from "./schema.js"; // Added ContactPoint, Role
import { validateCanonical } from "./validate.js"; // Assuming validate exports this
import { diff } from './diff.js'; // Import diff
import isEqual from 'lodash/isEqual.js'; // Import lodash isEqual
import cloneDeep from 'lodash/cloneDeep.js'; // <<< ADDED IMPORT
import { RawOfficeCsvRow } from './types.js'; // Import RawOfficeCsvRow
import { log } from "./logger.js"; // Import logger

// --- Type Helper ---
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

// --- Delta Calculation Type ---
// Define RoleDelta type here so it's available for mergeEntry return type
export type RoleDelta = {
  index: number;
  key: keyof Role | 'full'; // 'full' indicates add/remove
  before: any;
  after: any;
};

// Map from Canonical Office Code (UPPERCASE) back to Brand (lowercase)
// Used during the one-time migration of canonicalContactData.json
const locationToBrandMap: Record<string, string> = {
  PLY: 'tsa',
  FTL: 'cts',
  REO: 'cts',
  SGT: 'tt'
};

// List of valid standalone brand fallback tags (lowercase)
const validFallbackBrands = new Set(['tsa', 'cts', 'tt']);

// Define a type for summarizing changes
export interface ChangeSummary {
    type: 'insert' | 'update' | 'delete' | 'no_change'; // Added delete/no_change for future flexibility
    key: string;
    before?: Partial<ContactEntity>; // Use Partial for flexibility in logging
    after?: Partial<ContactEntity>;
    diff?: Record<string, { before: any, after: any }>; // Optional detailed diff
}

/**
 * Helper function to create an index of canonical data by a chosen key.
 */
const indexByKey = (rows: ContactEntity[], keyFn: (row: ContactEntity) => string): Record<string, ContactEntity> =>
    Object.fromEntries(rows.map(row => {
        const key = keyFn(row);
        if (!key) {
            log.warn(`WARN: Entity found with missing key during indexing:`, row);
        }
        return [key, row];
    }).filter(([key]) => key)); // Filter out entries where key extraction failed

// --- Helper Functions for Nested Updates ---

/**
 * Updates a specific system type within a contact points array.
 * Removes existing points of the same system and adds the new one if value is provided.
 * @param contactPoints The existing array of contact points (or undefined).
 * @param system The system type to update (e.g., 'mobile').
 * @param value The new value for the contact point. If empty/null, the point is removed.
 * @param source The source to attribute for the new/updated contact point (defaults to 'Office365').
 * @returns The updated contact points array.
 */
function updateContactPoint(contactPoints: ContactPoint[] = [], system: ContactPoint['type'], value: string | null | undefined, source: ContactPoint['source'] = 'Office365'): ContactPoint[] {
  const filtered = contactPoints.filter(pt => pt.type !== system);
  // Normalize mobile numbers: remove leading '+'
  const normalizedValue = (system === 'mobile' && value?.startsWith('+')) ? value.substring(1) : value;
  // Only add if value is truthy (not null, undefined, or empty string)
  return normalizedValue ? [...filtered, { type: system, value: normalizedValue.trim(), source }] : filtered;
}

/**
 * Updates a specific type within a roles array.
 * Removes existing roles of the same type and adds the new one if name is provided.
 * Assumes a simple structure for roles updated this way (type and name).
 * Needs refinement if office/priority need setting from CSV.
 * @param roles The existing array of roles (or undefined).
 * @param office The office the role applies to (needed for new role creation).
 * @param title The title/name for the role. If empty/null, the role is removed.
 * @param priority The priority for the new role (defaults to 1).
 * @returns The updated roles array.
 */
// function updateRole(roles: Role[] = [], office: Role['office'], title: string | null | undefined, priority: number = 1): Role[] {
//   // Filter out existing roles with the same office and title (or lack thereof if new title is null)
//   // This is a simplification: assumes CSV title dictates the primary role for that office.
//   // More complex logic might be needed to handle multiple roles per office.
//   const filtered = roles.filter(r => !(r.office === office)); 
// 
//   // Only add if title is truthy
//   return title ? [...filtered, { office, title: title.trim(), priority }] : filtered;
// }
// --- End Helper Functions ---

// --- Helper functions for comparing complex nested arrays ---
function normalizeAndSortContactPoints(points: ReadonlyArray<ContactPoint> | undefined): string[] {
    if (!points) return [];
    // Create a stable string representation for each point, then sort the strings
    return points.map(cp => `${cp.type}:${cp.value}:${cp.source || ''}`).sort();
}

// DELETED - normalizeAndSortRoles (using deep compare now replaced)
// function normalizeAndSortRoles(...) { ... }

// --- NEW: Deterministic Role Comparison --- 
/**
 * Helper to remove null/undefined values from a role object for comparison.
 * 
 * Note: This function deliberately excludes title since title is now a top-level
 * field on ContactEntity, not part of roles. Only brand, office, and priority 
 * fields are retained for role comparison.
 * 
 * @param role The Role object to clean
 * @returns A partial Role object with only the defined fields to use for comparison
 */
const cleanRole = (role: Role | Partial<Role>): Partial<Role> => {
    // Explicitly include only defined fields we care about for equality
    const cleaned: Partial<Role> = {};
    if (role.brand !== null && role.brand !== undefined) cleaned.brand = role.brand;
    if (role.office !== null && role.office !== undefined) cleaned.office = role.office;
    if (role.priority !== null && role.priority !== undefined) cleaned.priority = role.priority;
    // Return an object with defined keys sorted for consistent stringify
    return cleaned;
};

/**
 * Creates a normalized string representation of a Role for comparison.
 * This is used by rolesMatch to create comparable strings from role objects.
 * 
 * Note: Only compares brand, office, and priority. Title is deliberately excluded
 * as it's now stored at the entity level.
 * 
 * @param role The Role object to normalize
 * @returns A string representation of the role with consistent key ordering
 */
const normalizeRole = (role: Role): string => {
  // Clean the role first, removing nulls
  const cleanedRole = cleanRole(role);
  // Stringify the cleaned object with sorted keys
  return JSON.stringify(cleanedRole, Object.keys(cleanedRole).sort());
};

/**
 * Determines if two arrays of roles are functionally equivalent.
 * 
 * Note: This comparison only considers brand, office, and priority fields.
 * Title differences are not considered as title is now stored at the entity level.
 * 
 * The comparison:
 * 1. First checks if arrays have the same length
 * 2. Then normalizes each role to a string representation
 * 3. Sorts the normalized strings
 * 4. Compares the sorted arrays element by element
 * 
 * @param roles1 First array of roles to compare
 * @param roles2 Second array of roles to compare
 * @returns true if the arrays match based on the defined fields, false otherwise
 */
export const rolesMatch = (roles1: Role[], roles2: Role[]): boolean => {
  if (roles1.length !== roles2.length) {
    log.verbose(`[rolesMatch] Length mismatch: ${roles1.length} vs ${roles2.length}`);
    return false;
  }
  // Sort normalized strings before comparing
  const normalized1 = roles1.map(normalizeRole).sort();
  const normalized2 = roles2.map(normalizeRole).sort();
  
  // Compare the sorted arrays of strings
  const match = normalized1.every((val, index) => val === normalized2[index]);
  if (!match) {
      log.verbose(`[rolesMatch] Mismatch found after sorting normalized strings:`);
      log.verbose(`  Norm1: ${JSON.stringify(normalized1)}`);
      log.verbose(`  Norm2: ${JSON.stringify(normalized2)}`);
  }
  return match;
};
// --- END NEW --- 

// Ensure normalizeRoleForDiff exists before getRoleDiffs
/**
 * Normalizes a Role object for comparison in diffing.
 * Note: Since title has been moved to the ContactEntity level, it is deliberately excluded from role comparison.
 * Only brand, office, and priority fields are compared between roles.
 * 
 * @param role The Role object to normalize, or null/undefined
 * @returns A normalized representation with uppercase brand/office for case-insensitive comparison, or null if input is null/undefined
 */
function normalizeRoleForDiff(role: Role | null | undefined): Record<string, any> | null {
  if (!role) return null;
  return {
    brand: role.brand?.toUpperCase() ?? null,
    office: role.office?.toUpperCase() ?? null,
    priority: role.priority ?? 0,
  };
}

// Define getRoleDiffs function HERE
/**
 * Compares two arrays of Role objects and returns an array of differences.
 * 
 * Important: This comparison ONLY looks at brand, office, and priority.
 * The title field has been moved to the ContactEntity level and is not part of Role objects anymore.
 * Title differences should be detected separately using entity-level comparisons.
 * 
 * @param beforeRoles Array of roles before the change
 * @param afterRoles Array of roles after the change
 * @returns Array of RoleDelta objects describing the differences
 */
export function getRoleDiffs(beforeRoles: Role[] = [], afterRoles: Role[] = []): RoleDelta[] {
  const diffs: RoleDelta[] = [];
  const beforeNorm = beforeRoles.map(normalizeRoleForDiff);
  const afterNorm = afterRoles.map(normalizeRoleForDiff);
  const length = Math.max(beforeNorm.length, afterNorm.length);

  // --- Add Diagnostic Logging ---
  log.verbose(`[getRoleDiffs] Normalized BEFORE: ${JSON.stringify(beforeNorm)}`);
  log.verbose(`[getRoleDiffs] Normalized AFTER: ${JSON.stringify(afterNorm)}`);
  // --- End Logging ---

  for (let i = 0; i < length; i++) {
    const b = beforeRoles[i]; 
    const a = afterRoles[i]; 
    const bNorm = beforeNorm[i];
    const aNorm = afterNorm[i];

    if (!bNorm && !aNorm) continue;

    if (!bNorm || !aNorm) {
       diffs.push({ index: i, key: 'full', before: b, after: a });
       continue;
    }

    for (const key of ['brand', 'office', 'priority'] as (keyof Role)[]) {
      const beforeVal = bNorm && key in bNorm ? (bNorm[key] ?? null) : null;
      const afterVal = aNorm && key in aNorm ? (aNorm[key] ?? null) : null;
      if (beforeVal !== afterVal) {
        diffs.push({ index: i, key, before: b?.[key], after: a?.[key] });
      }
    }
  }
  return diffs;
}

// --- REWRITTEN mergeEntry implementing UNFUCKING PLAN ---
// --- UPDATED: Refactored mergeEntry with explicit variable naming and decomposed role logic ---
/**
 * Merges data from a CSV row into an existing canonical contact entity.
 * 
 * Key behaviors:
 * 1. Updates simple fields like displayName and department directly.
 * 2. Updates contactPoints, preserving points of other types.
 * 3. Processes Office tags to define role structure when present.
 * 4. Sets title at the ContactEntity level (not on roles) when present in CSV.
 * 5. Validates the final entity before returning it.
 * 
 * Note: Title is now stored at the entity level (ContactEntity.title), not on
 * individual roles. When a CSV row has a title field, it updates the entity's
 * title directly, completely independent of role structure/processing.
 * 
 * @param existing The existing contact entity to update
 * @param csvRow The CSV row data to merge
 * @returns Object containing the updated entity (or null if unchanged), change flag, and role differences
 */
function mergeEntry(existing: Readonly<ContactEntity>, csvRow: Record<string, any>): { updated: ContactEntity | null, changed: boolean, roleDiffs: RoleDelta[] } {
    // --- Explicit Variable Definitions from CSV Row ---
    const objectIdFromCsv = csvRow["object id"]; // Primary key for matching
    const upnFromCsv = csvRow["user principal name"]; // Mostly for logging/lookup
    const displayNameFromCsv = csvRow['display name'];
    const departmentFromCsv = csvRow['department'];
    const rawMobilePhoneFromCsv = csvRow['mobile phone']; // Keep raw for update helper
    const rawTitleFromCsv = csvRow['title']; // Keep raw to distinguish null vs ""
    const officeTagFieldFromCsv = csvRow['office']?.trim() || null; // Drives role parsing

    // --- Consistent Logging Identifiers ---
    const objectIdForLog = existing.objectId || objectIdFromCsv || 'UNKNOWN_OID';
    const upnForLog = existing.upn || upnFromCsv || 'UNKNOWN_UPN';

    // --- DEBUG LOGGING ---
    if (objectIdForLog === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6') { // Example debug target
        console.log(`DEBUG mergeEntry [${upnForLog} ${objectIdForLog}]: Received csvRow:`, JSON.stringify(csvRow));
    }
    // --- END DEBUG ---

    // --- Guard: Only process external entities ---
    if (existing.kind !== 'external') {
        log.verbose(`[mergeEntry] Skipping merge for non-external entity: ${upnForLog} (${objectIdForLog})`);
        return { updated: null, changed: false, roleDiffs: [] };
    }
    log.verbose(`[mergeEntry] Processing external entity ${upnForLog} (${objectIdForLog})`);

    let changed = false;
    const updated = cloneDeep(existing); // Start with a mutable copy
    const mutableUpdated = updated as Mutable<ContactEntity>;

    // --- Normalization Helper (Handles null/undefined/empty string -> null) ---
    const normalize = (value: any): string | null => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
        return (trimmed === null || trimmed === undefined || trimmed === '') ? null : String(trimmed);
    };

    // --- Normalize Simple Fields for Comparison ---
    const normalizedDisplayNameFromCsv = normalize(displayNameFromCsv);
    const normalizedDepartmentFromCsv = normalize(departmentFromCsv);
    // Note: upn and objectId are keys, less likely to change via this merge, handle separately if needed.

    // --- Title Handling: Distinguish null (not present) vs "" (explicit empty) ---
    const titleFromCsv: string | null = (typeof rawTitleFromCsv === 'string' && rawTitleFromCsv.trim() === '')
        ? null // Map empty string to null for canonical representation (CHANGED FROM '')
        : normalize(rawTitleFromCsv); // Normalize others (null/undefined/non-empty)

    // Remove Brian debug logs
    if (objectIdForLog === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6') { // Example debug target
        console.log(`DEBUG mergeEntry [${upnForLog} ${objectIdForLog}]: titleFromCsv evaluated to:`, titleFromCsv);
    }

    // --- NEW: Top-Level Title Update ---
    // Only update title if the 'title' key exists in the CSV row
    // This follows the entity-level title model, where title is stored directly on the ContactEntity
    // and not on individual roles
    if ('title' in csvRow) { 
        const normalizedExistingTitle = normalize(existing.title);
        if (titleFromCsv !== normalizedExistingTitle) {
            log.verbose(`    -> Field change 'title': ${normalizedExistingTitle} -> ${titleFromCsv}`);
            mutableUpdated.title = titleFromCsv; // Assign directly (already handled null vs "")
            changed = true;
        }
    }
    // --- END NEW ---

    // --- Simple Field Updates ---
    if (normalizedDisplayNameFromCsv !== normalize(existing.displayName)) {
        log.verbose(`    -> Field change 'displayName': ${normalize(existing.displayName)} -> ${normalizedDisplayNameFromCsv}`);
        mutableUpdated.displayName = displayNameFromCsv?.trim() || null; // Assign raw trimmed value
        changed = true;
    }
    if (normalizedDepartmentFromCsv !== normalize(existing.department)) {
        log.verbose(`    -> Field change 'department': ${normalize(existing.department)} -> ${normalizedDepartmentFromCsv}`);
        mutableUpdated.department = departmentFromCsv?.trim() || null; // Assign raw trimmed value
        changed = true;
    }

    // --- ContactPoints Update ---
    if (csvRow.hasOwnProperty('mobile phone')) { // Check if key exists in CSV row
        const updatedContactPoints = updateContactPoint(mutableUpdated.contactPoints, 'mobile', rawMobilePhoneFromCsv); // Pass raw value
        const normalizedExistingCP = normalizeAndSortContactPoints(existing.contactPoints);
        const normalizedNewCP = normalizeAndSortContactPoints(updatedContactPoints);
        if (!isEqual(normalizedExistingCP, normalizedNewCP)) {
             log.verbose(`    -> Field change 'contactPoints' (mobile): Detected difference.`);
             mutableUpdated.contactPoints = updatedContactPoints;
             changed = true;
        }
    }

    // =====================================================
    // --- Explicit Role Handling Logic ---
    // =====================================================
    const originalRoles = existing.roles || [];
    let baseRoles: Role[] = []; // Roles before final title override is considered

    // --- Step 1: Determine Base Role Structures (from Office tags OR original) ---
    if (officeTagFieldFromCsv) {
        const parsedRolesFromOfficeTags: Omit<Role, 'title' | 'priority'>[] = [];
        const parsedFallbackBrands = new Set<string>();

        // Parse the Office Tag Field (unchanged)
        const officeSegments = officeTagFieldFromCsv.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const segment of officeSegments) {
            if (segment.includes(':')) { // Format: brand:office
                const parts = segment.split(':');
                if (parts.length === 2 && parts[0] && parts[1]) {
                    parsedRolesFromOfficeTags.push({ brand: parts[0].toLowerCase(), office: parts[1].toUpperCase() });
                } else { log.warn(`[mergeEntry ${upnForLog}] Malformed org:location segment '${segment}'. Ignoring.`); }
            } else { // Format: brand1,brand2 (fallback list)
                 const potentialFallbackBrands = segment.split(',').map((b: string) => b.trim().toLowerCase()).filter(Boolean);
                 potentialFallbackBrands.forEach((brand: string) => {
                    if (validFallbackBrands.has(brand)) { parsedFallbackBrands.add(brand); }
                    else { log.warn(`[mergeEntry ${upnForLog}] Invalid fallback brand '${brand}' in segment '${segment}'. Ignoring brand.`); }
                 });
            }
        }

        // Calculate Roles if valid tags/fallbacks found
        if (parsedRolesFromOfficeTags.length > 0 || parsedFallbackBrands.size > 0) {
            const roleSignaturesProcessed = new Set<string>();

            // 1a. Roles derived directly from office tags (structure only)
            const calculatedOfficeRoles: Role[] = parsedRolesFromOfficeTags.map(roleTag => ({
                brand: roleTag.brand, office: roleTag.office, priority: 1, title: null // Start with null title
            }));
            calculatedOfficeRoles.forEach(role => roleSignaturesProcessed.add(`${role.brand}:${role.office}`));

            // 1b. Fallback roles (preserving original structure and title *for now*)
            const fallbackRoles: Role[] = [];
            for (const existingRole of originalRoles) {
                const sig = `${existingRole.brand}:${existingRole.office}`;
                if (!roleSignaturesProcessed.has(sig) && existingRole.brand && parsedFallbackBrands.has(existingRole.brand)) {
                    log.verbose(`    [mergeEntry ${upnForLog}] Identifying fallback role '${sig}' for potential preservation.`);
                    fallbackRoles.push(cloneDeep(existingRole)); // Preserve original fully
                    roleSignaturesProcessed.add(sig);
                }
            }
            // Combine roles from tags and fallbacks to form the base set
            baseRoles = [...calculatedOfficeRoles, ...fallbackRoles];
            log.verbose(`[mergeEntry ${upnForLog}] Base roles determined from Office/Fallback: ${JSON.stringify(baseRoles)}`);

        } else {
             // Office field had content, but no valid tags -> use original roles as base
             log.warn(`[mergeEntry ${upnForLog}] Office field ('${officeTagFieldFromCsv}') contained no valid tags. Using original roles as base.`);
             baseRoles = cloneDeep(originalRoles);
        }
    } else {
        // No Office Tag Field in CSV -> use original roles as base
        log.verbose(`[mergeEntry ${upnForLog}] No Office field in CSV. Using original roles as base.`);
        baseRoles = cloneDeep(originalRoles);
    }

    // --- Step 2: Apply CSV Title Override OR Clear Directive --- 
    let rolesToAssign: Role[]; // This will be the final array assigned
    
    // Roles structure is already determined, just use baseRoles directly
    // No longer setting title on roles
    rolesToAssign = baseRoles;

    // --- Compare original roles with the final determined roles state ---
    const roleDiffs = getRoleDiffs(originalRoles, rolesToAssign);
    if (roleDiffs.length > 0) {
        // Use rolesMatch for a simple boolean log, getRoleDiffs provides detail later
        if (!rolesMatch(originalRoles, rolesToAssign)) { // rolesMatch uses cleaner comparison
            log.verbose(`    -> Field change 'roles': Detected difference.`);
            changed = true;
        } else {
             log.verbose(`    -> Field change 'roles': getRoleDiffs found differences, but rolesMatch did not. Review comparison logic. Diff: ${JSON.stringify(roleDiffs)}`);
             // Decide if this discrepancy should still mark as changed
             changed = true; // Defaulting to true if diffs found
        }
    }

    // --- Assign Final Roles State ---
    log.verbose(`[mergeEntry ${upnForLog}] Final roles to assign: ${JSON.stringify(rolesToAssign)}`);
    mutableUpdated.roles = rolesToAssign; // Assign the calculated roles

    // --- Final Validation & Return ---
    log.verbose(`[mergeEntry ${upnForLog}] End of processing. Final 'changed' flag: ${changed}`);
    if (changed) {
        const validation = ContactEntitySchema.safeParse(updated);
        if (!validation.success) {
             log.error(`[mergeEntry ${upnForLog}] Merged entity FAILED validation:`);
             log.error("  Validation Errors:", JSON.stringify(validation.error.errors, null, 2));
             log.error("  Failing object state:", JSON.stringify(updated, null, 2));
             return { updated: null, changed: false, roleDiffs: [] }; // Discard changes on validation failure
        }
        
        // Return the validated, updated entity and any role differences found
        return { updated, changed: true, roleDiffs };
    } else {
        // No changes detected or changes were discarded
        return { updated: null, changed: false, roleDiffs: [] };
    }
}

/**
 * Updates canonical contact data (specifically the ContactEntities array) based on rows from a CSV file.
 * It uses a provided mapping function to link CSV rows to existing canonical entries via the canonical 'id'.
 * Currently, this function only *updates* existing entries; it does not insert new entries from the CSV
 * or delete entries missing from the CSV.
 *
 * @param csvRows An array of objects parsed from the input CSV file (e.g., using csv-parse with headers).
 * @param originalCanonicalData The array of ContactEntity objects from the current canonical data.
 * @returns An object containing the updated `ContactEntity[]` array (`updated`) and an array of `ChangeSummary` objects (`changes`) detailing the operations performed (update, no_change, skipped row).
 * @throws Error if the final collection of updated ContactEntities fails schema validation via `validateCanonical`.
 */
export function updateFromCsv(
    csvRows: Record<string, any>[],
    originalCanonicalData: ReadonlyArray<ContactEntity>
): { updated: ContactEntity[], changes: ChangeSummary[] } {

    // Initialize maps and logs
    const canonicalIndex: Record<string, ContactEntity> = {}; // Index of original data by objectId
    const updatedDataMap: Record<string, ContactEntity> = {}; // Working copy of data, indexed by objectId
    const changeLog: ChangeSummary[] = [];
    const processedObjectIds = new Set<string>(); // Track IDs found in the CSV

    // Populate maps with clones of original data
    for (const entity of originalCanonicalData) {
        if (entity.objectId) {
            canonicalIndex[entity.objectId] = entity; // Store original reference
            updatedDataMap[entity.objectId] = cloneDeep(entity); // Store working clone
        } else {
            log.warn(`[updateFromCsv] Found entity without objectId during indexing. Skipping.`, entity.id ? { id: entity.id } : {});
        }
    }

    let rowNum = 0;
    for (const csvRow of csvRows) {
        rowNum++;
        const objectIdFromCsv = csvRow["object id"]; // Use explicit name
        const upnFromCsv = csvRow["user principal name"]; // Use explicit name

        if (!objectIdFromCsv) {
            log.warn(`[updateFromCsv Row ${rowNum}] Skipping row due to missing 'object id'.`, upnFromCsv ? { upn: upnFromCsv } : {});
            continue;
        }
        processedObjectIds.add(objectIdFromCsv);

        const existingEntryOriginal = canonicalIndex[objectIdFromCsv];
        const currentWorkingEntry = updatedDataMap[objectIdFromCsv]; // Get the *current state* of the working copy

        if (!existingEntryOriginal || !currentWorkingEntry) {
            log.warn(`[updateFromCsv Row ${rowNum}] Cannot find original or working entry for ObjectId ${objectIdFromCsv}. Skipping row.`);
            continue;
        }

        // --- Process Merge ---
        if (currentWorkingEntry.kind === 'external') {
            // Pass the current working entry and the CSV row to mergeEntry
            const mergeResult = mergeEntry(currentWorkingEntry, csvRow);
            log.verbose(`[updateFromCsv ${objectIdFromCsv}] mergeEntry result: changed=${mergeResult.changed}, hasUpdated=${!!mergeResult.updated}`);

            if (mergeResult.changed && mergeResult.updated) {
                log.info(`[updateFromCsv ${objectIdFromCsv}] Changes detected & validated. Updating entry.`);
                // *** CRITICAL: Update the working map with the validated result from mergeEntry ***
                updatedDataMap[objectIdFromCsv] = mergeResult.updated;

                // Calculate diff against the *original* state for logging
                const detailedDiff = diff(existingEntryOriginal, mergeResult.updated);
                log.verbose(`[updateFromCsv ${objectIdFromCsv}] Diff details:`, detailedDiff);
                if (mergeResult.roleDiffs.length > 0) {
                  log.verbose(`[updateFromCsv ${objectIdFromCsv}] Role Deltas:`, mergeResult.roleDiffs);
                }

                changeLog.push({
                    type: 'update',
                    key: objectIdFromCsv,
                    before: existingEntryOriginal, // Log original state
                    after: cloneDeep(mergeResult.updated), // Log the state *after* successful merge
                    diff: detailedDiff
                });
            } else {
                // No change detected by mergeEntry OR validation failed (updated is null)
                log.verbose(`[updateFromCsv ${objectIdFromCsv}] No changes detected or validation failed. Logging as NO_CHANGE.`);
                changeLog.push({
                    type: 'no_change',
                    key: objectIdFromCsv,
                    before: existingEntryOriginal,
                    after: existingEntryOriginal // Log original state as no change occurred/was kept
                });
            }
        } else { // Internal entity
             log.verbose(`[updateFromCsv ${objectIdFromCsv}] Matched internal entity. Logging as NO_CHANGE (Internal).`);
             changeLog.push({ type: 'no_change', key: objectIdFromCsv, before: existingEntryOriginal, after: existingEntryOriginal });
        }
    } // End CSV row loop

    // --- Log Entities Not Present in CSV ---
    log.verbose(`[updateFromCsv] Checking for canonical entries not present in the processed CSV ObjectIds.`);
    for (const originalObjectId in canonicalIndex) {
        if (!processedObjectIds.has(originalObjectId)) {
            log.verbose(`[updateFromCsv ${originalObjectId}] Not found in CSV. Logging as NO_CHANGE (Unprocessed).`);
            const originalEntry = canonicalIndex[originalObjectId];
            changeLog.push({ type: 'no_change', key: originalObjectId, before: cloneDeep(originalEntry), after: cloneDeep(originalEntry) });
        }
    }

    // --- Final Log & Return ---
    log.verbose(`[updateFromCsv] Final changeLog summary:`, JSON.stringify(changeLog.map(c => ({ key: c.key, type: c.type }))));
    return { updated: Object.values(updatedDataMap), changes: changeLog }; // Return array from the final state of the working map
}