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
// Helper to remove null/undefined values from a role object for comparison
const cleanRole = (role: Role | Partial<Role>): Partial<Role> => {
    // Explicitly include only defined fields we care about for equality
    const cleaned: Partial<Role> = {};
    if (role.brand !== null && role.brand !== undefined) cleaned.brand = role.brand;
    if (role.office !== null && role.office !== undefined) cleaned.office = role.office;
    if (role.title !== null && role.title !== undefined) cleaned.title = role.title;
    if (role.priority !== null && role.priority !== undefined) cleaned.priority = role.priority;
    // Return an object with defined keys sorted for consistent stringify
    return cleaned;
};

const normalizeRole = (role: Role): string => {
  // Clean the role first, removing nulls
  const cleanedRole = cleanRole(role);
  // Stringify the cleaned object with sorted keys
  return JSON.stringify(cleanedRole, Object.keys(cleanedRole).sort());
};

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
function normalizeRoleForDiff(role: Role | null | undefined): Record<string, any> | null {
  if (!role) return null;
  return {
    brand: role.brand?.toUpperCase() ?? null,
    office: role.office?.toUpperCase() ?? null,
    title: role.title === undefined ? '__MISSING__' : (role.title ?? null),
    priority: role.priority ?? 0,
  };
}

// Define getRoleDiffs function HERE
/**
 * Compares two arrays of Role objects and returns an array of differences.
 */
export function getRoleDiffs(beforeRoles: Role[] = [], afterRoles: Role[] = []): RoleDelta[] {
  const diffs: RoleDelta[] = [];
  const beforeNorm = beforeRoles.map(normalizeRoleForDiff);
  const afterNorm = afterRoles.map(normalizeRoleForDiff);
  const length = Math.max(beforeNorm.length, afterNorm.length);

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

    for (const key of ['brand', 'office', 'title', 'priority'] as (keyof Role)[]) {
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
function mergeEntry(existing: Readonly<ContactEntity>, incoming: Record<string, any>): { updated: ContactEntity | null, changed: boolean, roleDiffs: RoleDelta[] } {
    const objectIdFromExisting = existing.objectId;
    const objectIdFromIncoming = incoming["object id"];
    const objectIdForLog = objectIdFromExisting || objectIdFromIncoming || 'UNKNOWN';
    const upnForLog = existing.upn || incoming["user principal name"] || 'UNKNOWN';

    // --- DEBUG LOGGING for specific test case ---
    if (objectIdForLog === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6') {
        console.log(`DEBUG mergeEntry [Andrea ${objectIdForLog}]: Received incoming row:`, JSON.stringify(incoming));
    }
    // --- END DEBUG ---

    if (existing.kind !== 'external') {
        log.verbose(`[mergeEntry] Skipping merge for internal entity: ${upnForLog} (${objectIdForLog})`);
        return { updated: null, changed: false, roleDiffs: [] };
    }
    log.verbose(`[mergeEntry] Processing external entity ${upnForLog} (${objectIdForLog})`);

    let changed = false;
    const updated = cloneDeep(existing);
    const mutableUpdated = updated as Mutable<ContactEntity>; // Cast for modification

    // Helper to normalize empty strings/undefined to null for comparison/checks
    const normalize = (value: any): string | null => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
        return (trimmed === null || trimmed === undefined || trimmed === '') ? null : String(trimmed);
    };
    
    // Extract CSV Title *once*
    const csvTitle = normalize(incoming['title']); // Will be null if empty/missing

    // --- DEBUG LOGGING for specific test case ---
    if (objectIdForLog === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6') {
        console.log(`DEBUG mergeEntry [Andrea ${objectIdForLog}]: Extracted csvTitle:`, csvTitle);
    }
    // --- END DEBUG ---

    // --- Simple Field Updates --- 
    const keyMap: Partial<Record<keyof RawOfficeCsvRow, keyof ContactEntity>> = {
        "user principal name": "upn", "display name": "displayName", "department": "department",
        "object id": "objectId", "mobile phone": "contactPoints", "title": "roles" 
    };
    for (const incomingKey in incoming) {
         if (incoming.hasOwnProperty(incomingKey)) {
            const entityKey = keyMap[incomingKey as keyof RawOfficeCsvRow];
            if (!entityKey || entityKey === 'contactPoints' || entityKey === 'roles') continue;
            const incomingValue = normalize(incoming[incomingKey]);
            let existingValue: any = normalize((existing as any)[entityKey]);
            if (incomingValue !== existingValue) {
                log.verbose(`    -> Basic field change DETECTED for '${entityKey}': ${existingValue} -> ${incomingValue}`);
                (mutableUpdated as any)[entityKey] = incoming[incomingKey]?.trim() || null;
                changed = true;
            }
        }
    }

    // --- ContactPoints Update ---
    if (incoming.hasOwnProperty('mobile phone')) {
        const mobileValue = incoming['mobile phone'] || null;
        const updatedContactPoints = updateContactPoint(mutableUpdated.contactPoints, 'mobile', mobileValue);
        const normalizedExistingCP = normalizeAndSortContactPoints(existing.contactPoints);
        const normalizedNewCP = normalizeAndSortContactPoints(updatedContactPoints);
        if (!isEqual(normalizedExistingCP, normalizedNewCP)) {
             log.verbose(`    -> contactPoints change DETECTED.`);
             mutableUpdated.contactPoints = updatedContactPoints;
             changed = true;
        }
    }

    // --- DECOUPLED Role Handling Logic ---
    const csvOfficeString = incoming['office']?.trim() || null;
    const originalRoles = existing.roles || [];
    let finalRoles: Role[] = []; // Initialize as empty

    if (csvOfficeString) {
        // Office field IS present in CSV - this dictates role structure (brand/office)
        const parsedRolesFromOfficeTags: Omit<Role, 'title'>[] = []; // Parsed roles initially have no title
        const parsedFallbackBrands = new Set<string>();

        // Parse the Office field
        const officeSegments = csvOfficeString.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const segment of officeSegments) {
            if (segment.includes(':')) {
                const parts = segment.split(':');
                if (parts.length === 2 && parts[0] && parts[1]) {
                    const brand = parts[0].toLowerCase();
                    const office = parts[1].toUpperCase();
                    // Push role structure WITHOUT title
                    parsedRolesFromOfficeTags.push({ brand, office, priority: 1 }); 
                } else { log.warn(`[mergeEntry] Malformed org:location segment '${segment}' for user ${upnForLog}. Ignoring segment.`); }
            } else { 
                 const potentialFallbackBrands = segment.split(',').map((b: string) => b.trim().toLowerCase()).filter(Boolean);
                 let isValidFallback = true;
                 potentialFallbackBrands.forEach((brand: string) => { 
                    if (validFallbackBrands.has(brand)) { parsedFallbackBrands.add(brand); } 
                    else { isValidFallback = false; }
                 });
                 if (!isValidFallback) { log.warn(`[mergeEntry] Invalid fallback segment '${segment}' for user ${upnForLog}. Contains unknown brands. Ignoring segment.`); }
            }
        }

        // Only proceed if valid directives were found
        if (parsedRolesFromOfficeTags.length > 0 || parsedFallbackBrands.size > 0) {
            
            // Build the final list of roles based on CSV directives + fallbacks
            const calculatedRoles: Role[] = [];
            const finalRoleSignatures = new Set<string>();

            // 1. Add roles explicitly defined by `org:location` tags.
            //    Apply the CSV Title ONLY to THESE roles, if csvTitle exists.
            for (const parsedRole of parsedRolesFromOfficeTags) {
                 const sig = `${parsedRole.brand}:${parsedRole.office}`;
                 if (!finalRoleSignatures.has(sig)) {
                     const roleToAdd: Role = { 
                         ...parsedRole, 
                         // Apply csvTitle here IF it exists, otherwise title remains undefined->null later
                         title: csvTitle 
                     };
                     calculatedRoles.push(roleToAdd);
                     finalRoleSignatures.add(sig);
                     log.verbose(`    [mergeEntry] Adding role from Office tag: ${sig}, Title from CSV: ${csvTitle ?? 'N/A'}`);
                 }
            }

            // 2. Preserve existing roles ONLY if allowed by a fallback tag AND not already added/overwritten.
            //    These roles KEEP their original title.
            for (const existingRole of originalRoles) {
                 const sig = `${existingRole.brand}:${existingRole.office}`;
                 if (!finalRoleSignatures.has(sig)) { // If not already handled by explicit CSV tag
                     if (existingRole.brand && parsedFallbackBrands.has(existingRole.brand)) {
                         log.verbose(`    [mergeEntry] Preserving existing role via fallback '${existingRole.brand}': ${JSON.stringify(existingRole)}`);
                         // --- FIXED: Push a clone of the existing role, preserving title ---
                         calculatedRoles.push(cloneDeep(existingRole)); 
                         finalRoleSignatures.add(sig);
                     }
                 }
            }
            
            // Overwrite finalRoles with the calculated state
            finalRoles = calculatedRoles; 
            log.verbose(`[mergeEntry] Roles calculated based on CSV Office/Title/Fallback: ${JSON.stringify(finalRoles)}`);
        } else {
             log.warn(`[mergeEntry] User ${upnForLog}: Office field '${csvOfficeString}' contained no valid tags. Roles will NOT be modified.`);
             // finalRoles remains clone of existing
             finalRoles = cloneDeep(originalRoles); // Fallback to original if CSV tags were invalid
        }
    } else {
        // No Office field in CSV - roles are determined SOLELY by existing data.
        // The extracted csvTitle is ignored in this case.
        log.verbose(`[mergeEntry] No Office field in CSV for ${upnForLog}. Keeping existing roles.`);
        finalRoles = cloneDeep(originalRoles); // Use original roles if no CSV office string
    }

    // --- Compare original roles with the final determined roles state --- 
    const roleDiffs = getRoleDiffs(originalRoles, finalRoles);
    if (roleDiffs.length > 0) {
        log.verbose(`[mergeEntry] Role differences DETECTED by getRoleDiffs...`);
        changed = true; 
    }

    // --- DEBUG LOGGING ---
    if (objectIdForLog === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6') {
        console.log(`DEBUG mergeEntry [Andrea ${objectIdForLog}]: finalRoles BEFORE assignment to mutableUpdated:`, JSON.stringify(finalRoles));
    }
    // --- END DEBUG ---

    // --- Always assign the determined finalRoles state --- 
    mutableUpdated.roles = finalRoles;
    log.verbose(`[mergeEntry] Assigned final roles state to mutableUpdated: ${JSON.stringify(mutableUpdated.roles)}`); 

    // --- Final Validation & Return --- 
    log.verbose(`[mergeEntry] Reached end for ${upnForLog}. Final computed changed flag: ${changed}`);
    if (changed) { 
        const validation = ContactEntitySchema.safeParse(updated);
        if (!validation.success) {
             log.error(`[mergeEntry]: Merged entity FAILED validation for key [${upnForLog} / ${objectIdForLog}]:`);
             log.error("  Validation Errors:", JSON.stringify(validation.error.errors, null, 2));
             log.error("  [mergeEntry] Failing object state was:", JSON.stringify(updated, null, 2));
             return { updated: null, changed: false, roleDiffs: [] };
        }
        return { updated, changed: true, roleDiffs }; 
    } else {
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
    
    // Initialize updatedDataMap with clones
    const canonicalIndex: Record<string, ContactEntity> = {}; 
    const updatedDataMap: Record<string, ContactEntity> = {};
    const changeLog: ChangeSummary[] = [];
    const processedObjectIds = new Set<string>();
    for (const entity of originalCanonicalData) {
        if (entity.objectId) {
            canonicalIndex[entity.objectId] = entity;
            updatedDataMap[entity.objectId] = cloneDeep(entity);
        } else { /* log warn */ }
    }

    let rowNum = 0;
    for (const csvRow of csvRows) {
        rowNum++;
        const key = csvRow["object id"]; 
        if (!key) { /* log warn, continue */ continue; }
        processedObjectIds.add(key);

        const existingEntryOriginal = canonicalIndex[key];
        // Use the *working copy* from updatedDataMap for the merge attempt
        const currentWorkingEntry = updatedDataMap[key]; 

        if (!existingEntryOriginal || !currentWorkingEntry) {
            log.warn(`[updateFromCsv] Cannot find original or working entry for ObjectId ${key}. Skipping.`);
            continue;
        }

        if (currentWorkingEntry.kind === 'external') {
            // Pass the working entry to mergeEntry
            const mergeResult = mergeEntry(currentWorkingEntry, csvRow);
            log.verbose(`[updateFromCsv] AFTER mergeEntry call for key '${key}'. Result changed: ${mergeResult.changed}`);

            // --- CORRECTED HANDLING of mergeResult --- 
            if (mergeResult.changed && mergeResult.updated) { // Check if updated is not null
                log.info(`[updateFromCsv] Changes detected for external key: ${key}. Logging as UPDATE.`);
                // Assign the non-null updated entity from the result
                updatedDataMap[key] = mergeResult.updated; 
                
                // Diff original against the updated entity from the result
                const detailedDiff = diff(existingEntryOriginal, mergeResult.updated);
                log.verbose(`[updateFromCsv] Diff for ${key}:`, detailedDiff);
                if (mergeResult.roleDiffs.length > 0) {
                  log.verbose(`[updateFromCsv] Role Deltas for ${key}:`, mergeResult.roleDiffs);
                }

                changeLog.push({ 
                    type: 'update', 
                    key, 
                    before: existingEntryOriginal, 
                    // Clone the updated entity from the result for the log
                    after: cloneDeep(mergeResult.updated), 
                    diff: detailedDiff 
                });
            } else {
                // No change detected OR validation failed in mergeEntry (updated is null)
                log.verbose(`[updateFromCsv] No changes detected OR validation failed for external key: ${key}. Logging as NO_CHANGE.`);
                changeLog.push({ 
                    type: 'no_change', 
                    key, 
                    before: existingEntryOriginal, 
                    after: existingEntryOriginal // Log original state
                });
            }
            // --- END CORRECTION ---
        } else { // Internal entity
             log.verbose(`[updateFromCsv] Matched internal entity for key: ${key}. Logging as NO_CHANGE (Internal).`);
             changeLog.push({ type: 'no_change', key, before: existingEntryOriginal, after: existingEntryOriginal });
        }
    } // End CSV row loop

    // 3. Add 'no_change' entries for original entities NOT processed by the CSV
    log.verbose('[DEBUG updateFromCsv] Entering final loop to add unprocessed entities to changeLog. Processed IDs:', Array.from(processedObjectIds));
    for (const originalObjectId in canonicalIndex) {
        if (!processedObjectIds.has(originalObjectId)) {
            log.verbose(`[DEBUG updateFromCsv] Adding NO_CHANGE for unprocessed ID: ${originalObjectId}`);
            const originalEntry = canonicalIndex[originalObjectId]; 
            changeLog.push({ type: 'no_change', key: originalObjectId, before: cloneDeep(originalEntry), after: cloneDeep(originalEntry) }); // Clone here too
        }
    }

    // --- Add final log before return ---
    log.verbose('[DEBUG updateFromCsv] Final changeLog before return:', JSON.stringify(changeLog.map(c => ({ key: c.key, type: c.type })))); 

    // 4. Return results (convert map back to array)
    return { updated: Object.values(updatedDataMap), changes: changeLog };
}