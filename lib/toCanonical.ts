// import slugify from "slugify"; // Original ESM import attempt
import * as slugifyNs from "slugify"; // Import namespace
// import slugify from "slugify"; // CommonJS default import style for potentially non-ESM library (didn't work)
import { createHash } from "crypto";
import { ContactEntity, CanonicalExport, ContactPoint, Role } from "./schema.js";
import { RawOfficeCsvRow } from "./types.js"; // Import shared type

const slugify = (slugifyNs as any).default ?? slugifyNs; // Access default, with fallback

/** Generates a URL-friendly slug */
function generateSlug(name: string): string { // Add return type
  // return slugify(name, { lower: true, strict: true }); // Original call
  return (slugify as (str: string, opts?: any) => string)(name, { lower: true, strict: true }); // Cast slugify if needed
}

/** Generates a SHA256 hash for ID collision fallback */
function hashId(upn: string, source: string): string { // Add return type
  return createHash("sha256").update(upn + source).digest("hex");
}

/**
 * Transforms an array of raw CSV row objects into the canonical JSON structure.
 * Handles ID generation (slug/hash), default values, and field mapping.
 * @param rawRows Parsed rows from the CSV file.
 * @param inputPath Basename of the input CSV file (for metadata).
 * @param verbose Enable debug logging.
 * @returns The structured CanonicalExport object.
 */
export function toCanonical(
  rawRows: RawOfficeCsvRow[],
  inputPath: string,
  verbose: boolean = false
): CanonicalExport {
  const entities: Omit<ContactEntity, 'id'>[] = []; // Use Omit initially
  const potentialSlugs: { [key: string]: number } = {}; // Track slug counts

  // First pass: Prepare entities and count potential slug collisions
  for (const row of rawRows) {
    const displayName = row["display name"];
    if (verbose) console.log(`DEBUG [toCanonical Loop Start]: Processing row = ${JSON.stringify(row)}`);
    if (verbose) console.log(`DEBUG [toCanonical Loop Start]: Processing row. displayName = '${displayName}' (Type: ${typeof displayName})`);
    if (!displayName) continue; // Skip if undefined/empty after parsing

    if (verbose) console.log(`DEBUG [toCanonical Loop Body]: Entered loop body for '${displayName}'`);
    const slug = generateSlug(displayName);
    potentialSlugs[slug] = (potentialSlugs[slug] || 0) + 1;

    const contactPoints: ContactPoint[] = [];
    const mobilePhoneValue = row["mobile phone"]?.trim(); // Use lowercase key
    if (mobilePhoneValue) {
      const parts = mobilePhoneValue.split(/[,\/;]/);
      const firstPhonePart = parts[0];
      const firstPhone = firstPhonePart ? firstPhonePart.trim() : undefined;
      if (firstPhone) {
        if (verbose) console.log(`DEBUG [toCanonical ContactPoint]: Adding mobile ${firstPhone} for ${displayName}`);
        contactPoints.push({
          type: "mobile",
          value: firstPhone,
          source: "Office365",
        });
      }
    }

    const roles: Role[] = [];
    const titleValue = row["title"]?.trim(); // Use lowercase key
    if (verbose) console.log(`DEBUG [toCanonical Role Check]: Checking title for ${displayName}. Value = '${titleValue}'`);
    // if (row["title"]?.trim()) { // Original check
    if (titleValue) { // Check the trimmed value
       if (verbose) console.log(`DEBUG [toCanonical Role]: Adding role with title '${titleValue}' for ${displayName}`);
       roles.push({
          office: "PLY",
          title: titleValue,
          priority: 1,
       });
    } else {
        if (verbose) console.log(`DEBUG [toCanonical Role]: Adding role with NULL title for ${displayName}`);
        roles.push({
            office: "PLY",
            title: null,
            priority: 1,
        });
    }

    entities.push({
      // id will be assigned in the second pass
      displayName: displayName,
      contactPoints,
      roles,
      objectId: row["object id"]?.trim() || undefined, // Use lowercase key
      upn: row["user principal name"]?.trim() || undefined, // Use lowercase key
      department: row["department"]?.trim() || undefined, // Use lowercase key
      source: "Office365",
    });
    if (verbose) console.log(`DEBUG [toCanonical Loop]: Pushed entity for ${displayName}. entities.length = ${entities.length}`);
  }
  // *** End of first loop ***

  if (verbose) console.log(`DEBUG [toCanonical AfterLoop]: entities array contains ${entities.length} entities before map.`);

  // Second pass: Assign final IDs based on slug uniqueness
  const finalEntities: ContactEntity[] = entities.map(entity => {
      const slug = generateSlug(entity.displayName);
      let finalId: string;
      const source = entity.source;

      // Check potentialSlugs explicitly for undefined, although || 0 should handle it
      const collisionCount = potentialSlugs[slug] ?? 0;

      if (collisionCount > 1) {
          // Collision detected, use hash
          const upn = entity.upn ?? "";
          if (!upn) {
              console.warn(`WARN: Slug collision for '${entity.displayName}' but no UPN available for hashing. Using potentially unstable hash based on displayName.`);
              // Fallback hash if UPN is missing - less stable
              finalId = createHash("sha256").update(entity.displayName + entity.source).digest("hex");
          } else {
              finalId = hashId(upn, entity.source);
          }
      } else {
          // Slug is unique
          finalId = slug;
      }

      return {
          ...entity,
          id: finalId,
      };
  });

  // Sort final entities by display name
  const sortedEntities = finalEntities.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  if (verbose) console.log(`DEBUG [toCanonical]: sortedEntities contains ${sortedEntities.length} entities before returning.`);

  // Assemble the final export object
  return {
    ContactEntities: sortedEntities,
    Locations: [], // No location data in Phase 1
    _meta: {
      generatedFrom: [inputPath],
      generatedAt: new Date().toISOString(),
      version: 1,
      hash: "", // computed later in diff stage
    },
  };
} 