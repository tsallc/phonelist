import { createHash } from "crypto";
import { ContactEntity } from "./schema.js";

// Note: Locations array is currently always empty (type never[]) in Phase 1
export function computeHash(contacts: ContactEntity[], locations: never[]): string {
  const h = createHash("sha256");

  // Sort contacts deterministically by ID
  const sortedContacts = [...contacts].sort((a, b) => a.id.localeCompare(b.id));

  // Locations array is always empty in Phase 1
  const sortedLocations = locations; // Assigning the empty array

  // Use stable JSON stringification (optional, but good practice)
  // For simple objects, standard stringify is often sufficient, but consider
  // libraries like 'json-stable-stringify' if object key order becomes an issue.
  h.update(JSON.stringify(sortedContacts));
  h.update(JSON.stringify(sortedLocations)); // Will stringify to '[]'
  return h.digest("hex");
} 