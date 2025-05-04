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
const normalizeRole = (role: Role): string => {
  // Ensure all keys are present with null defaults for consistent stringification
  // Explicitly list keys in a fixed order for stringify
  const normalized = {
    brand: role.brand ?? null,
    office: role.office ?? null,
    priority: role.priority ?? 1,
    title: role.title ?? null
  };
  // Use JSON.stringify on the object with guaranteed key order
  return JSON.stringify(normalized);
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

/**
 * Merges specific fields from an incoming CSV-derived object into an existing canonical entity.
 * Avoids overwriting fields that are typically managed manually or from other sources.
 *
 * @param existing The current ContactEntity from the canonical data array.
 * @param incoming A record derived from a single CSV row, where keys are likely lowercase headers.
 * @returns The merged and validated ContactEntity if changes were made, otherwise null.
 *          Returns null if the merged entity fails validation or no changes detected.
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

    // --- ADDED: Helper to normalize empty strings/undefined to null --- 
    const normalize = (value: any): string | null => {
        const trimmed = typeof value === 'string' ? value.trim() : value;
        return (trimmed === null || trimmed === undefined || trimmed === '') ? null : String(trimmed);
    };
    // --- END HELPER --- 

    // Map canonical keys (used in incoming) to ContactEntity keys
    // Expect incoming keys to be LOWERCASE from csv-parse
    const keyMap: Partial<Record<keyof RawOfficeCsvRow, keyof ContactEntity>> = {
        "user principal name": "upn",
        "display name": "displayName",
        "department": "department",
        "object id": "objectId",
        "mobile phone": "contactPoints", // Handled below
        "title": "roles" // Handled below (part of role generation)
    };

    // Iterate through incoming canonical keys for simple field updates
    for (const incomingKey in incoming) {
        if (incoming.hasOwnProperty(incomingKey)) {
            const entityKey = keyMap[incomingKey as keyof RawOfficeCsvRow];

            // Skip keys handled separately (roles/contactPoints)
            if (!entityKey || entityKey === 'contactPoints' || entityKey === 'roles') {
                continue;
            }

            const incomingValue = incoming[incomingKey]?.trim() || null;
            let existingValue: any = existing[entityKey];
            
            log.verbose(`  [mergeEntry] PRE-COMPARE Field '${entityKey}':\n    Existing: ${JSON.stringify(existingValue)}\n    Incoming: ${JSON.stringify(incomingValue)}`);
            
            const valuesAreDifferent = !isEqual(existingValue, incomingValue);

            if (valuesAreDifferent) {
                log.verbose(`    -> Basic field change DETECTED for '${entityKey}'`);
                (updated as any)[entityKey] = incomingValue;
                changed = true;
            } 
        }
    }

    // --- Handle Nested Structures --- 

    // MobilePhone
    if (incoming.hasOwnProperty('mobile phone')) { 
        const mobileValue = incoming['mobile phone'] || null;
        const updatedContactPoints = updateContactPoint(updated.contactPoints, 'mobile', mobileValue);
        const normalizedExistingCP = normalizeAndSortContactPoints(existing.contactPoints);
        const normalizedNewCP = normalizeAndSortContactPoints(updatedContactPoints);
        log.verbose(`  [mergeEntry] PRE-COMPARE Field 'contactPoints':\n    Existing (Norm+Sorted): ${JSON.stringify(normalizedExistingCP)}\n    New      (Norm+Sorted): ${JSON.stringify(normalizedNewCP)}`);
        if (!isEqual(normalizedExistingCP, normalizedNewCP)) {
             log.verbose(`    -> contactPoints change DETECTED.`);
             updated.contactPoints = updatedContactPoints; 
             changed = true;
        }
    }

    // --- NEW Role Handling Logic --- 
    const csvOfficeString = incoming['office'] || null;
    // --- UPDATED: Use normalize helper --- 
    const csvTitle = normalize(incoming['title']); 
    const existingRoles = existing.roles || [];
    const parsedCsvRoles: Role[] = [];
    const parsedFallbackBrands = new Set<string>();

    if (csvOfficeString) {
        const officeSegments = csvOfficeString.split(';').map((s: string) => s.trim()).filter(Boolean);

        for (const segment of officeSegments) {
            if (segment.includes(':')) {
                const parts = segment.split(':');
                if (parts.length === 2 && parts[0] && parts[1]) {
                    const brand = parts[0].toLowerCase();
                    const office = parts[1].toUpperCase(); // Canonical office is UPPERCASE
                    parsedCsvRoles.push({
                        brand: brand,
                        office: office,
                        title: csvTitle,
                        priority: 1 
                    });
                    log.verbose(`    [mergeEntry] Parsed role from segment '${segment}': { brand: ${brand}, office: ${office}, title: ${csvTitle} }`);
                } else {
                    log.warn(`[mergeEntry] Malformed org:location segment '${segment}' for user ${existing.id}. Ignoring segment.`);
                }
            } else {
                // Check for standalone fallback tags (single or comma-separated)
                const potentialFallbackBrands = segment.split(',').map((b: string) => b.trim().toLowerCase()).filter(Boolean);
                let isValidFallback = true;
                potentialFallbackBrands.forEach((brand: string) => {
                    if (validFallbackBrands.has(brand)) {
                        parsedFallbackBrands.add(brand);
                        log.verbose(`    [mergeEntry] Parsed fallback brand '${brand}' from segment '${segment}'`);
                    } else {
                        isValidFallback = false;
                    }
                });
                if (!isValidFallback) {
                    log.warn(`[mergeEntry] Invalid fallback segment '${segment}' for user ${existing.id}. Contains unknown brands. Ignoring segment.`);
                }
            }
        }
    }
    log.verbose(`[mergeEntry] Parsed CSV roles:`, parsedCsvRoles);
    log.verbose(`[mergeEntry] Parsed fallback brands:`, Array.from(parsedFallbackBrands));
    
    // --- Determine final roles based on CSV & Preservation Rules (Code Block 2) --- 
    const finalRolesCalculation = (): Role[] => { // Wrap calculation in a function
        const calculatedFinalRoles: Role[] = [];
        const finalRoleSignatures = new Set<string>();

        // 1. Add roles explicitly defined by `org:location` in CSV
        for (const csvRole of parsedCsvRoles) {
            const sig = `${csvRole.brand}:${csvRole.office}`;
            if (!finalRoleSignatures.has(sig)) { 
                calculatedFinalRoles.push(csvRole); 
                finalRoleSignatures.add(sig);
            }
        }

        // 2. Preserve existing roles if allowed by fallback AND not overwritten by CSV
        for (const existingRole of existingRoles) {
            const sig = `${existingRole.brand}:${existingRole.office}`;
            if (!finalRoleSignatures.has(sig)) { 
                if (existingRole.brand && parsedFallbackBrands.has(existingRole.brand)) {
                    log.verbose(`    [mergeEntry] Preserving existing role via fallback '${existingRole.brand}': ${JSON.stringify(existingRole)}`);
                    calculatedFinalRoles.push(existingRole); 
                    finalRoleSignatures.add(sig); 
                }
            }
        }
        return calculatedFinalRoles;
    };
    // --- End Code Block 2 ---
    
    // --- Conditional Update Logic (Code Block 3 - Preserved and Updated) --- 
    if (parsedCsvRoles.length > 0 || parsedFallbackBrands.size > 0) {
        // Valid tags found, calculate final roles and compare
        const finalRoles = finalRolesCalculation();
        const sortedExistingRoles = [...existingRoles].sort(compareRoles);
        const sortedFinalRoles = [...finalRoles].sort(compareRoles);

        // --- CORRECTED: Always assign the recalculated roles --- 
        updated.roles = [...finalRoles]; 
        log.verbose(`    [mergeEntry] Assigned updated.roles with: ${JSON.stringify(updated.roles)}`); 
        
        // --- Now, check if this assignment actually represents a change vs original --- 
        log.verbose(`[mergeEntry] Comparing roles:\n  existing: ${JSON.stringify(sortedExistingRoles)}\n  final(assigned): ${JSON.stringify(sortedFinalRoles)}`);
        if (!rolesMatch(sortedExistingRoles, sortedFinalRoles)) {
            log.verbose(`    -> roles change DETECTED.`);
            changed = true; // Mark overall change *only if* roles actually differ
            // --- ADDED TEST DEBUG --- 
            console.log('[TEST DEBUG] Role mismatch detected for objectId:', incoming['object id']);
            console.log('  Existing:', JSON.stringify(sortedExistingRoles));
            console.log('  Final:   ', JSON.stringify(sortedFinalRoles));
            // --- END DEBUG ---
        }
    } else if (csvOfficeString) {
        // Office string was provided but resulted in NO valid roles or fallbacks
        log.warn(`[mergeEntry] User ${existing.id}: Office field '${csvOfficeString}' contained no valid tags. Existing roles will NOT be modified based on this invalid input.`);
        // No change to updated.roles needed, it already holds existingRoles via deep copy
    } else {
        // No Office string provided in CSV, don't touch roles
        // No change to updated.roles needed
    }
    // --- End Code Block 3 ---

    // --- Final Validation & Return --- 
    log.verbose(`[mergeEntry] Reached end for ID ${existing.id}. Final computed changed flag: ${changed}`); 
    if (changed) {
        log.verbose(`  [mergeEntry] -> Entered if(changed) block.`);
        log.verbose(`  [mergeEntry] Validating updated object for ID ${existing.id}:`, JSON.stringify(updated, null, 2));
        const validation = ContactEntitySchema.safeParse(updated);
        if (!validation.success) {
            log.error(`[mergeEntry]: Merged entity FAILED validation for key [${existing.id}]:`);
            log.error("  Validation Errors:", JSON.stringify(validation.error.errors, null, 2)); 
            log.error("  [mergeEntry] Failing object state was:", JSON.stringify(updated, null, 2));
            log.verbose(`  [mergeEntry] -> Validation FAILED. Returning null.`);
            return null; 
        }
        log.verbose(`  [mergeEntry] -> Validation SUCCEEDED. Returning the 'updated' object directly.`);
        // --- MODIFIED DEBUG LOG --- 
        log.verbose(`  [mergeEntry] FINAL updated object roles: ${JSON.stringify(updated.roles)}`);
        // --- END MODIFIED DEBUG LOG --- 
        return updated;
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
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    
    // --- UPDATED: Handle nullable office --- 
    const officeA = a.office ?? ''; // Treat null as empty string for comparison
    const officeB = b.office ?? '';
    if (officeA < officeB) return -1;
    if (officeA > officeB) return 1;
    
    // --- ADDED: Compare by brand next --- 
    const brandA = a.brand ?? '';
    const brandB = b.brand ?? '';
    if (brandA < brandB) return -1;
    if (brandA > brandB) return 1;
    
    // Compare by title (handle nulls)
    const titleA = a.title ?? ''; 
    const titleB = b.title ?? ''; 
    if (titleA < titleB) return -1;
    if (titleA > titleB) return 1;
    
    // Compare by priority (handle nulls/undefined)
    return (a.priority ?? 0) - (b.priority ?? 0);
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
    const processedObjectIds = new Set<string>(); // Keep track of IDs found in CSV
    let rowNum = 0;

    for (const csvRow of csvRows) {
        rowNum++;
        const key = csvRow["object id"]; 

        if (!key) {
            log.warn(`[updateFromCsv] Skipping CSV row ${rowNum} due to missing 'object id'. Data: ${JSON.stringify(csvRow)}`);
            continue;
        }

        processedObjectIds.add(key); // Mark this ID as processed
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
                    // --- ADDED LOG --- 
                    log.verbose(`  [updateFromCsv] About to push changeLog UPDATE. merged.roles: ${JSON.stringify(merged.roles)}`);
                    // --- END LOG --- 
                    changeLog.push({ 
                        type: 'update', 
                        key, 
                        before: cloneDeep(existingEntryFromIndex), // Deep clone before state
                        after: cloneDeep(merged), // Deep clone after state
                        diff: detailedDiff 
                    });
                } else {
                    log.verbose(`  [updateFromCsv] -> Entered else block (merged is null).`); 
                    log.verbose(`[updateFromCsv] No changes detected for external key: ${key}. Logging as NO_CHANGE.`);
                    // --- UPDATED: Use cloneDeep --- 
                    changeLog.push({ 
                        type: 'no_change', 
                        key, 
                        before: cloneDeep(existingEntryFromIndex), // Clone just in case 
                        after: cloneDeep(existingEntryFromIndex) // Clone just in case
                    });
                }
            } else {
                 log.verbose(`[updateFromCsv] Matched internal entity for key: ${key}. Logging as NO_CHANGE (Internal).`);
                 changeLog.push({ type: 'no_change', key, before: cloneDeep(existingEntryFromIndex), after: cloneDeep(existingEntryFromIndex) });
            }
        } else { // No match found in canonicalIndex
            log.warn(`[updateFromCsv] CSV row with objectId [${key}] has no matching entry in canonical data. Skipping.`);
            // Optionally add a 'skipped' entry to changeLog here
            // changeLog.push({ type: 'skipped', key, after: csvRow });
        }
    } // End CSV row loop

    // 3. Add 'no_change' entries for original entities NOT processed by the CSV
    log.verbose('[DEBUG updateFromCsv] Entering final loop to add unprocessed entities to changeLog. Processed IDs:', Array.from(processedObjectIds));
    for (const originalObjectId in canonicalIndex) {
        if (!processedObjectIds.has(originalObjectId)) {
            log.verbose(`[DEBUG updateFromCsv] Adding NO_CHANGE for unprocessed ID: ${originalObjectId}`);
            const originalEntry = canonicalIndex[originalObjectId];
            // Clone here too for consistency, though less critical if only logging
            changeLog.push({ type: 'no_change', key: originalObjectId, before: cloneDeep(originalEntry), after: cloneDeep(originalEntry) });
        }
    }

    // --- Add final log before return ---
    log.verbose('[DEBUG updateFromCsv] Final changeLog before return:', JSON.stringify(changeLog.map(c => ({ key: c.key, type: c.type })))); 

    // 4. Return results (convert map back to array)
    return { updated: Object.values(updatedDataMap), changes: changeLog };
}