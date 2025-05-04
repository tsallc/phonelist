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
            if (entityKey && entityKey !== 'contactPoints' && entityKey !== 'roles') { 
                const incomingValue = incoming[canonicalKey]?.trim() || null;
                const existingValue = existing[entityKey];
                
                if (!isEqual(existingValue, incomingValue)) {
                    log.verbose(`[mergeEntry] Basic field change detected for '${entityKey}': FROM=${JSON.stringify(existingValue)} TO=${JSON.stringify(incomingValue)}`);
                    (updated as any)[entityKey] = incomingValue; 
                    changed = true;
                }
            }
            // Special cases are handled separately below
        }
    }

    // --- Handle Nested Structures using helpers, tracking changes --- 

    // MobilePhone → contactPoints.type === 'mobile'
    if (incoming.hasOwnProperty('mobile phone')) { 
        const mobileValue = incoming['mobile phone'] || null;
        const originalContactPoints = existing.contactPoints || [];
        const newContactPoints = updateContactPoint(updated.contactPoints, 'mobile', mobileValue);
        
        // Compare sorted versions to ignore order
        const originalSorted = originalContactPoints.slice().sort(compareContactPoints);
        const newSorted = newContactPoints.slice().sort(compareContactPoints);

        if (!isEqual(originalSorted, newSorted)) { // Compare sorted arrays
             log.verbose(`[mergeEntry] contactPoints change detected (order ignored).`);
             updated.contactPoints = newContactPoints; 
             changed = true;
        }
    }

    // Title → roles 
    if (incoming.hasOwnProperty('title')) { 
        const titleValue = incoming['title'] || null; 
        const primaryOffice = existing.roles?.[0]?.office; 
        
        if (primaryOffice) {
             const originalRoles = existing.roles || []; 
             const newRoles = updateRole(updated.roles, primaryOffice, titleValue);
             
             // Compare sorted versions to ignore order
             const originalSortedRoles = originalRoles.slice().sort(compareRoles);
             const newSortedRoles = newRoles.slice().sort(compareRoles);

             if (!isEqual(originalSortedRoles, newSortedRoles)) { // Compare sorted arrays
                  log.verbose(`[mergeEntry] roles change detected (order ignored).`);
                  updated.roles = newRoles; 
                  changed = true;
             }
        } else if (titleValue) {
            log.warn(`[mergeEntry]: Cannot update Title='${titleValue}' for user ID ${existing.id} because primary office context is missing.`);
        }
    }
    
    // --- Final Validation --- 
    if (changed) {
        const validation = ContactEntitySchema.safeParse(updated);
        if (!validation.success) {
            log.error(`[mergeEntry]: Merged entity failed validation for key [${existing.id}]:`, validation.error.errors);
            // Log the object that failed validation for inspection
            log.error("Failing object state:", JSON.stringify(updated, null, 2));
            return null; 
        }
        // Return the validated, changed data
        log.verbose(`[mergeEntry] Final result for ID ${existing.id}: CHANGES DETECTED.`);
        return validation.data; 
    } else {
        // No changes detected
        log.verbose(`[mergeEntry] Final result for ID ${existing.id}: NO CHANGES.`);
        return null;
    }
}

// --- Sorter functions for consistent array comparison ---
function compareContactPoints(a: ContactPoint, b: ContactPoint): number {
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
}

function compareRoles(a: Role, b: Role): number {
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
    originalCanonicalData: ReadonlyArray<ContactEntity>, 
    // Mapper function is no longer needed, as we assume objectId is present in csvRows
    // csvToCanonicalIdMapper: (csvRow: Record<string, any>) => string | undefined | null 
): { updated: ContactEntity[], changes: ChangeSummary[] } {

    const canonicalDataCopy = JSON.parse(JSON.stringify(originalCanonicalData));

    // 1. Index Canonical Data by 'objectId'
    const keyFn = (row: ContactEntity) => row.objectId; // Use objectId as the key
    // Need to handle potential missing objectId in existing data if schema wasn't enforced before
    const canonicalIndex: Record<string, ContactEntity> = {};
    for (const entity of canonicalDataCopy) {
        if (entity.objectId) {
            if (canonicalIndex[entity.objectId]) {
                log.warn(`[updateFromCsv] Duplicate objectId found in existing canonical data: ${entity.objectId}. Overwriting entry.`);
            }
            canonicalIndex[entity.objectId] = entity;
        } else {
            log.warn(`[updateFromCsv] Entity with id '${entity.id}' missing objectId in existing data. Cannot be updated.`);
        }
    }
    
    const updatedDataMap = { ...canonicalIndex }; 
    const changeLog: ChangeSummary[] = [];

    // 2. Process CSV Rows
    let rowNum = 0;
    for (const csvRow of csvRows) {
        rowNum++;
        // Log first csv row (verbose)
        if (rowNum === 1) { 
            log.verbose(`[updateFromCsv loop] First csvRow object:`, JSON.stringify(csvRow, null, 2));
        }
        
        const key = csvRow["object id"]; 
        if (!key) {
             log.error(`[updateFromCsv] ERROR: CSV row number ${rowNum} is missing the required 'object id' after parsing. Skipping.`);
            continue;
        }
        const existingEntryFromIndex = canonicalIndex[key]; 
        if (existingEntryFromIndex) {
            const merged = mergeEntry(existingEntryFromIndex, csvRow);
            if (merged) {
                log.verbose(`[updateFromCsv] Changes detected for objectId: ${key}. Logging as UPDATE.`);
                updatedDataMap[key] = merged;
                const detailedDiff = diff(existingEntryFromIndex, merged); 
                changeLog.push({ type: 'update', key, before: existingEntryFromIndex, after: merged, diff: detailedDiff });
            } else {
                 log.verbose(`[updateFromCsv] No changes detected for objectId: ${key}. Logging as NO_CHANGE.`);
                 changeLog.push({ type: 'no_change', key, before: existingEntryFromIndex, after: existingEntryFromIndex }); 
            }
        } else {
             log.warn(`[updateFromCsv] CSV row with objectId [${key}] has no matching entry in canonical data. Skipping potential insert.`);
        }
    }

    // 3. Return results
    return { updated: Object.values(updatedDataMap), changes: changeLog };
}
