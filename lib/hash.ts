import { createHash } from "crypto";
import { ContactEntity, Location } from "./schema.js";

// Note: Locations array may be populated now
export function computeHash(contacts: ContactEntity[], locations: Location[]): string {
  const h = createHash("sha256");

  // Sort contacts deterministically by ID
  const sortedContacts = [...contacts].sort((a, b) => a.id.localeCompare(b.id));

  // Sort locations deterministically by ID 
  const sortedLocations = [...locations].sort((a, b) => a.id.localeCompare(b.id));

  // Use stable JSON stringification (optional, but good practice)
  // For simple objects, standard stringify is often sufficient, but consider
  // libraries like 'json-stable-stringify' if object key order becomes an issue.
  h.update(JSON.stringify(sortedContacts));
  h.update(JSON.stringify(sortedLocations));
  return h.digest("hex");
} 