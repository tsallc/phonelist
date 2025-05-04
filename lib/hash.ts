import { createHash } from "crypto";
import { ContactEntity, Location, ContactPoint, Role } from "./schema.js";
import stableStringify from 'json-stable-stringify';

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
  const h = createHash("sha256");

  // Sort contacts deterministically by objectId, handling potential missing values
  const sortedContacts = [...contacts].sort((a, b) => 
    (a.objectId ?? '').localeCompare(b.objectId ?? '')
  );

  // Sort locations deterministically by ID 
  const sortedLocations = [...locations].sort((a, b) => a.id.localeCompare(b.id));

  // Process each contact
  sortedContacts.forEach(contact => {
    // Create a normalized copy with sorted internal arrays
    const contactToHash = {
      ...contact,
      contactPoints: [...(contact.contactPoints || [])].sort(compareContactPoints),
      roles: [...(contact.roles || [])].sort(compareRoles)
    };
    const stringifiedContact = stableStringify(contactToHash) || "";
    // Log stringified version for specific integration test runs
    if (label === "Initial" || label === "Updated") { 
        console.log(`DEBUG [computeHash - ${label}] Hashing Contact ${contact.objectId}: ${stringifiedContact}`);
    }
    h.update(stringifiedContact);
  });

  // Process each location, sorting internal arrays too
  sortedLocations.forEach(location => {
     const locationToHash = {
         ...location,
         rooms: [...(location.rooms || [])]
           .sort((ra, rb) => ra.id.localeCompare(rb.id))
           .map(room => ({
             ...room,
             // Ensure desks array exists before sorting
             desks: [...(room.desks || [])].sort((da, db) => da.value.localeCompare(db.value))
           }))
     };
     const stringifiedLocation = stableStringify(locationToHash) || "";
      // Log stringified version for specific integration test runs
     if (label === "Initial" || label === "Updated") {
        console.log(`DEBUG [computeHash - ${label}] Hashing Location ${location.id}: ${stringifiedLocation}`);
     }
     h.update(stringifiedLocation);
  });

  return h.digest("hex");
} 