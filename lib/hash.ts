import { createHash } from "crypto";
import { ContactEntity, Location, ContactPoint, Role } from "./schema.js";
import stableStringify from 'json-stable-stringify';
import { log } from "./logger.js"; // Import logger

// --- Sorter functions ---
function compareContactPoints(a: ContactPoint, b: ContactPoint): number {
    if (!a || !b) return 0; 
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
}

function compareRoles(a: Role, b: Role): number {
    if (!a || !b) return 0; 
    if (a.office < b.office) return -1;
    if (a.office > b.office) return 1;
    if ((a.title || '') < (b.title || '')) return -1; 
    if ((a.title || '') > (b.title || '')) return 1;
    return (a.priority || 0) - (b.priority || 0);
}
// ---------------------------

// Note: Locations array may be populated now
export function computeHash(contacts: ReadonlyArray<ContactEntity>, locations: ReadonlyArray<Location>, label: string = ""): string {
  // --- DEBUG: Log raw inputs --- 
  log.verbose(`[computeHash - ${label}] ENTERED. Received contacts: ${contacts?.length ?? 'null/undefined'}, locations: ${locations?.length ?? 'null/undefined'}`);
  if (contacts) { // Log first few contact IDs/names for reference
      log.verbose(`[computeHash - ${label}] First few contact IDs/names: ${contacts.slice(0, 3).map(c => `${c.id}(${c.displayName})`).join(', ')}`);
  }
  // --- End DEBUG ---
  
  const h = createHash("sha256");

  // Filter and sort ALL contacts deterministically by objectId (since all should have one now)
  // No longer need separate valid/invalid filtering based on objectId presence
  const sortedContacts = [...contacts].sort((a, b) => 
    (a.objectId ?? 'manual-error').localeCompare(b.objectId ?? 'manual-error') // Use fallback for safety
  );

  // Filter and sort locations deterministically by ID
  const validLocations = locations ? locations.filter(l => l.id) : [];
  const invalidLocations = locations ? locations.filter(l => !l.id) : [];
    if (invalidLocations.length > 0) {
      log.verbose(`[computeHash - ${label}] Skipping ${invalidLocations.length} locations lacking id during hash calculation.`);
  }
  const sortedLocations = [...validLocations].sort((a, b) => 
      (a.id ?? '').localeCompare(b.id ?? '') 
  );

  // Process each contact (both external and internal)
  sortedContacts.forEach((contact, index) => {
    try {
        const contactToHash = {
            // Explicitly select fields defined in schema to avoid extra data
            kind: contact.kind, // Include kind in hash
            id: contact.id,
            displayName: contact.displayName,
            objectId: contact.objectId,
            upn: contact.upn,
            department: contact.department,
            source: contact.source,
            // Ensure nested arrays are always present and sorted
            contactPoints: [...(contact.contactPoints || [])].sort(compareContactPoints),
            roles: [...(contact.roles || [])].sort(compareRoles)
        };
        const stringifiedContact = stableStringify(contactToHash);
        if (stringifiedContact) {
            log.verbose(`[computeHash - ${label}] Hashing Contact (${contact.kind}) ${contact.objectId}: ${stringifiedContact}`);
            h.update(stringifiedContact);
        } else {
            log.warn(`[computeHash - ${label}] stableStringify returned empty for contact ${contact.objectId}`);
        }
    } catch (error: any) {
        log.error(`[computeHash - ${label}] Error processing contact ${contact.objectId} (kind: ${contact.kind}): ${error.message}`);
    }
  });

  // Process each valid location
  sortedLocations.forEach(location => {
      try {
        // Similarly, create a normalized structure for locations if needed
        // For now, assuming Location structure is simpler and less prone to issues
        // Consider sorting internal arrays like rooms/desks if they exist and matter for hashing
        const locationToHash = { ...location }; // Adjust if internal sorting needed

        const stringifiedLocation = stableStringify(locationToHash);
         if (stringifiedLocation) {
            // --- DEBUG: Log stringified location --- 
            log.verbose(`[computeHash - ${label}] Hashing Location ${location.id}: ${stringifiedLocation}`);
            // --- End DEBUG ---
            h.update(stringifiedLocation);
        } else {
            log.warn(`[computeHash - ${label}] stableStringify returned empty for location ${location.id}`);
        }
      } catch (error: any) {
          log.error(`[computeHash - ${label}] Error processing location ${location.id}: ${error.message}`);
          // throw error; // Option: Fail hard
      }
  });

  const finalHash = h.digest("hex");
  log.verbose(`[computeHash - ${label}] Final computed hash: ${finalHash}`);
  return finalHash;
} 