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
import { RawOfficeCsvRow } from './types.js'; // Import RawOfficeCsvRow
import { log } from "./logger.js"; // Import logger

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
  // Only add if value is truthy (not null, undefined, or empty string)
  return value ? [...filtered, { type: system, value: value.trim(), source }] : filtered;
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
function updateRole(roles: Role[] = [], office: Role['office'], title: string | null | undefined, priority: number = 1): Role[] {
  // Filter out existing roles with the same office and title (or lack thereof if new title is null)
  // This is a simplification: assumes CSV title dictates the primary role for that office.
  // More complex logic might be needed to handle multiple roles per office.
  const filtered = roles.filter(r => !(r.office === office)); 

  // Only add if title is truthy
  return title ? [...filtered, { office, title: title.trim(), priority }] : filtered;
}
// --- End Helper Functions ---

// --- Helper functions for comparing complex nested arrays ---
function normalizeAndSortContactPoints(points: ReadonlyArray<ContactPoint> | undefined): string[] {
    if (!points) return [];
    // Create a stable string representation for each point, then sort the strings
    return points.map(cp => `${cp.type}:${cp.value}:${cp.source || ''}`).sort();
}

function normalizeAndSortRoles(roles: ReadonlyArray<Role> | undefined): string[] {
    if (!roles) return [];
    // Create a stable string representation, sort by office then title
    return roles.map(r => `${r.office}:${r.title || ''}:${r.priority || 0}`).sort();
}

/**
 * Merges specific fields from an incoming CSV-derived object into an existing canonical entity.
 * Avoids overwriting fields that are typically managed manually or from other sources.
 *
 * @param existing The current ContactEntity from the canonical data array.
 * @param incoming A record derived from a single CSV row, where keys are column headers.
 * @returns The merged and validated ContactEntity if changes were made, otherwise null.
 *          Returns null if the merged entity fails validation.
 */
function mergeEntry(existing: Readonly<ContactEntity>, incoming: Record<string, any>): ContactEntity | null {
    if (existing.kind !== 'external') {
        log.verbose(`[mergeEntry] Skipping merge for internal entity: ${existing.id} (${existing.objectId})`);
        return null; 
    }
    log.verbose(`[mergeEntry] Processing external entity ID ${existing.id} (ObjID: ${existing.objectId})`); 
    log.verbose(`[mergeEntry] Incoming CSV data: ${JSON.stringify(incoming)}`); 

    const updated: ContactEntity = JSON.parse(JSON.stringify(existing));
    let changed = false;

    // Map canonical keys (used in incoming) to ContactEntity keys
    const keyMap: Partial<Record<keyof RawOfficeCsvRow, keyof ContactEntity>> = {
        "user principal name": "upn",
        "display name": "displayName",
        "department": "department",
        "object id": "objectId",
        "mobile phone": "contactPoints", // Placeholder: Handle special cases below
        "title": "roles" // Placeholder: Handle special cases below
    };

    // Iterate through incoming canonical keys
    for (const canonicalKey in incoming) {
        if (incoming.hasOwnProperty(canonicalKey)) {
            const entityKey = keyMap[canonicalKey as keyof RawOfficeCsvRow];

            // --- DEBUG: Log comparison --- 
            const incomingValue = incoming[canonicalKey]?.trim() || null;
            let existingValue: any = null;
            if (entityKey && entityKey !== 'contactPoints' && entityKey !== 'roles') { 
                existingValue = existing[entityKey];
                // Log BEFORE isEqual comparison
                log.verbose(`  [mergeEntry] PRE-COMPARE Field '${entityKey}':\n    Existing: ${JSON.stringify(existingValue)}\n    Incoming: ${JSON.stringify(incomingValue)}`); // incomingValue might be null here
                
                // *** MODIFIED LOGIC: Only update if incoming is not null OR if explicitly different (handles null->value, value->null, value->value) ***
                // This prevents overwriting existing values with null just because the CSV column was empty/missing.
                // It WILL allow setting a field TO null if it previously had a value.
                const valuesAreDifferent = !isEqual(existingValue, incomingValue);

                if (valuesAreDifferent) {
                    log.verbose(`    -> Basic field change DETECTED for '${entityKey}'`);
                    // Apply the incoming value (which could be null)
                    (updated as any)[entityKey] = incomingValue; 
                    changed = true;
                } 
                // Removed the simple isEqual check that might have been too broad
            }
            // --- End DEBUG ---
        }
    }

    // --- Handle Nested Structures --- 
    // MobilePhone
    if (incoming.hasOwnProperty('mobile phone')) { 
        const mobileValue = incoming['mobile phone'] || null;
        const updatedContactPoints = updateContactPoint(updated.contactPoints, 'mobile', mobileValue);

        // Compare normalized+sorted string arrays
        const normalizedExistingCP = normalizeAndSortContactPoints(existing.contactPoints);
        const normalizedNewCP = normalizeAndSortContactPoints(updatedContactPoints);

        log.verbose(`  [mergeEntry] PRE-COMPARE Field 'contactPoints':\n    Existing (Norm+Sorted): ${JSON.stringify(normalizedExistingCP)}\n    New      (Norm+Sorted): ${JSON.stringify(normalizedNewCP)}`);
        
        if (!isEqual(normalizedExistingCP, normalizedNewCP)) { // Compare the normalized arrays
             log.verbose(`    -> contactPoints change DETECTED.`);
             updated.contactPoints = updatedContactPoints; 
             changed = true;
        }
    }

    // Title
    if (incoming.hasOwnProperty('title')) { 
        const titleValue = incoming['title'] || null; 
        const primaryOffice = existing.roles?.[0]?.office; // Simplistic assumption
        if (primaryOffice) {
             const updatedRoles = updateRole(updated.roles, primaryOffice, titleValue);

             // Compare normalized+sorted string arrays
             const normalizedExistingRoles = normalizeAndSortRoles(existing.roles);
             const normalizedNewRoles = normalizeAndSortRoles(updatedRoles);

             log.verbose(`  [mergeEntry] PRE-COMPARE Field 'roles':\n    Existing (Norm+Sorted): ${JSON.stringify(normalizedExistingRoles)}\n    New      (Norm+Sorted): ${JSON.stringify(normalizedNewRoles)}`);
             
             if (!isEqual(normalizedExistingRoles, normalizedNewRoles)) { // Compare the normalized arrays
                  log.verbose(`    -> roles change DETECTED.`);
                  updated.roles = updatedRoles; 
                  changed = true;
             }
        } else if (titleValue) {
            log.warn(`[mergeEntry]: Cannot update Title='${titleValue}' for user ID ${existing.id} because primary office context is missing.`);
        }
    }
    
    // --- Final Validation & Return --- 
    log.verbose(`[mergeEntry] Reached end for ID ${existing.id}. Final computed changed flag: ${changed}`); 
    if (changed) {
        log.verbose(`  [mergeEntry] -> Entered if(changed) block.`);
        // --- DEBUG: Log the object JUST BEFORE validation --- 
        log.verbose(`  [mergeEntry] Validating updated object for ID ${existing.id}:`, JSON.stringify(updated, null, 2));
        // --- End DEBUG ---
        const validation = ContactEntitySchema.safeParse(updated);
        if (!validation.success) {
            log.error(`[mergeEntry]: Merged entity FAILED validation for key [${existing.id}]:`);
            // Log the detailed Zod errors
            log.error("  Validation Errors:", JSON.stringify(validation.error.errors, null, 2)); 
            log.error("  [mergeEntry] Failing object state was:", JSON.stringify(updated, null, 2));
            log.verbose(`  [mergeEntry] -> Validation FAILED. Returning null.`);
            return null; 
        }
        log.verbose(`  [mergeEntry] -> Validation SUCCEEDED. Returning validated data object.`);
        log.verbose(`  [mergeEntry] Returned Object:`, JSON.stringify(validation.data, null, 2)); 
        return validation.data; 
    } else {
        log.verbose(`  [mergeEntry] -> Entered else block (changed is false). Returning null.`);
        return null;
    }
}

// --- Sorter functions for consistent array comparison ---
// Note: These are duplicated here and in hash.ts. Consider moving to a shared util file.
function compareContactPoints(a: ContactPoint, b: ContactPoint): number {
    if (!a || !b) return 0; // Handle potential undefined/null
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
}

function compareRoles(a: Role, b: Role): number {
    if (!a || !b) return 0; // Handle potential undefined/null
    if (a.office < b.office) return -1;
    if (a.office > b.office) return 1;
    if ((a.title || '') < (b.title || '')) return -1; // Handle null titles
    if ((a.title || '') > (b.title || '')) return 1;
    return (a.priority || 0) - (b.priority || 0);
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

    const canonicalDataCopy = JSON.parse(JSON.stringify(originalCanonicalData));

    // 1. Index Canonical Data by 'objectId'
    const canonicalIndex: Record<string, ContactEntity> = {};
    for (const entity of canonicalDataCopy) {
        if (entity.objectId) {
            if (canonicalIndex[entity.objectId]) {
                log.warn(`[updateFromCsv] Duplicate objectId found in canonical data during indexing: ${entity.objectId}. Overwriting entry.`);
            }
            canonicalIndex[entity.objectId] = entity;
        } else {
            log.warn(`[updateFromCsv] Entity found without objectId during indexing: ${entity.id}. Skipping.`);
        }
    }

    // 2. Process CSV Rows, build updated map and change log
    const updatedDataMap: Record<string, ContactEntity> = { ...canonicalIndex }; // Start with all existing
    const changeLog: ChangeSummary[] = [];
    let rowNum = 0;
    for (const csvRow of csvRows) {
        rowNum++;
        const key = csvRow["object id"]; 

        if (!key) {
            log.warn(`[updateFromCsv] Skipping CSV row ${rowNum} due to missing 'object id'. Data: ${JSON.stringify(csvRow)}`);
            continue;
        }

        const existingEntryFromIndex = canonicalIndex[key];

        if (existingEntryFromIndex) {
            if (existingEntryFromIndex.kind === 'external') {
                const merged = mergeEntry(existingEntryFromIndex, csvRow);
                log.verbose(`[updateFromCsv] AFTER mergeEntry call for key '${key}'. Result: ${merged ? 'Updated Object Returned' : 'Null Returned'}`);
                if (merged) {
                    log.verbose(`  [updateFromCsv] -> Entered if(merged) block.`); 
                    log.verbose(`[updateFromCsv] Changes detected for external key: ${key}. Logging as UPDATE.`);
                    updatedDataMap[key] = merged;
                    const detailedDiff = diff(existingEntryFromIndex, merged);
                    changeLog.push({ type: 'update', key, before: existingEntryFromIndex, after: merged, diff: detailedDiff });
                } else {
                    log.verbose(`  [updateFromCsv] -> Entered else block (merged is null).`); 
                    log.verbose(`[updateFromCsv] No changes detected for external key: ${key}. Logging as NO_CHANGE.`);
                    changeLog.push({ type: 'no_change', key, before: existingEntryFromIndex, after: existingEntryFromIndex });
                }
            } else {
                 log.verbose(`[updateFromCsv] Matched internal entity for key: ${key}. Logging as NO_CHANGE.`);
                 changeLog.push({ type: 'no_change', key, before: existingEntryFromIndex, after: existingEntryFromIndex });
            }
        } else {
            log.warn(`[updateFromCsv] CSV row with objectId [${key}] has no matching entry in canonical data. Skipping.`);
        }
    }

    // 3. Return results (convert map back to array)
    return { updated: Object.values(updatedDataMap), changes: changeLog };
}