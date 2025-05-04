// import slugify from "slugify"; // Original ESM import attempt
import * as slugifyNs from "slugify"; // Import namespace
// import slugify from "slugify"; // CommonJS default import style for potentially non-ESM library (didn't work)
import { createHash } from "crypto";
import { ContactEntity, CanonicalExport, ContactPoint, Role, ContactEntitySchema } from "./schema.js";
import { RawOfficeCsvRow } from "./types.js"; // Import shared type

const slugify = (slugifyNs as any).default ?? slugifyNs; // Access default, with fallback

/** Generates a URL-friendly slug */
function generateSlug(name?: string): string { // Allow undefined name
  if (!name) return `unknown-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`; // Fallback ID
  return slugify(name, { lower: true, strict: true });
}

/** Generates a SHA256 hash for ID collision fallback */
function hashId(upn: string, source: string): string { // Add return type
  return createHash("sha256").update(upn + source).digest("hex");
}

/**
 * Transforms a single RawOfficeCsvRow into the main part of a ContactEntity.
 * Does not generate the final internal 'id'.
 * Throws error if required fields (like objectId) are missing.
 */
function rawToPartialContactEntity(row: RawOfficeCsvRow, source: string = 'Office365'): Omit<ContactEntity, 'id'> {
  const objectId = row["object id"]?.trim();
  if (!objectId) {
    throw new Error(`Cannot convert row: Missing required 'object id'. Row: ${JSON.stringify(row)}`);
  }

  const displayName = row["display name"]?.trim() || undefined;
  const mobilePhoneValue = row["mobile phone"]?.trim();
  const upn = row["user principal name"]?.trim() || undefined;
  const titleValue = row["title"]?.trim();
  const department = row["department"]?.trim() || undefined;

  const contactPoints: ContactPoint[] = [];
  if (mobilePhoneValue) {
    // Simple split logic (might need refinement)
    const firstPhone = mobilePhoneValue.split(/[,\/;]/)[0]?.trim();
    if (firstPhone) {
      contactPoints.push({ type: "mobile", value: firstPhone, source: source as any });
    }
  }

  const roles: Role[] = [];
  // Basic role creation - assumes PLY office if title exists
  if (titleValue) {
    roles.push({ office: "PLY", title: titleValue, priority: 1 });
  } else {
    // Ensure roles array exists even if title is null/empty, assuming PLY default
    roles.push({ office: "PLY", title: null, priority: 1 });
  }

  return {
    displayName,
    contactPoints,
    roles,
    objectId, // Already validated as required string
    upn,
    department,
    source: source as any, // Assuming source is valid
  };
}

/**
 * Transforms an array of raw CSV row objects into the canonical JSON structure.
 * Handles ID generation (slug/hash), uniqueness checks, and sorting.
 * @param rawRows Parsed rows from the CSV file.
 * @param inputPath Basename of the input CSV file (for metadata).
 * @param verbose Enable debug logging.
 * @returns The structured CanonicalExport object.
 */
export function toCanonical(rawRows: RawOfficeCsvRow[], inputPath: string, verbose: boolean = false): CanonicalExport {
  const contactEntitiesMap = new Map<string, ContactEntity>();
  const potentialSlugs: { [key: string]: number } = {};
  const objectIdSet = new Set<string>(); // Track seen objectIds for duplicates

  // First pass: Prepare entities, check for objectId duplicates, count slug collisions
  const partialEntities: Omit<ContactEntity, 'id'>[] = [];
  rawRows.forEach((row, index) => {
    try {
      const partialEntity = rawToPartialContactEntity(row);
      
      // Check for duplicate objectId from CSV input
      if (objectIdSet.has(partialEntity.objectId)) {
          console.warn(`[toCanonical] Duplicate objectId '${partialEntity.objectId}' found in input CSV for displayName '${partialEntity.displayName}'. Skipping row ${index + 1}.`);
          return; // Skip this row
      }
      objectIdSet.add(partialEntity.objectId);

      // Count potential slug collisions based on displayName
      const slug = generateSlug(partialEntity.displayName); 
      potentialSlugs[slug] = (potentialSlugs[slug] || 0) + 1;
      
      partialEntities.push(partialEntity);

    } catch (error: any) {
      console.warn(`[toCanonical] Skipping row ${index + 1} due to error during initial conversion: ${error.message}`);
    }
  });

  // Second pass: Assign final internal IDs and build final map
  partialEntities.forEach(partialEntity => {
    const slug = generateSlug(partialEntity.displayName);
    let finalId: string;
    const collisionCount = potentialSlugs[slug] ?? 0;

    if (collisionCount > 1) {
      // Collision - use hash of objectId (more stable than UPN)
       if (verbose) console.log(`[toCanonical] Slug collision for '${partialEntity.displayName}'. Using hash of objectId '${partialEntity.objectId}' for internal ID.`);
       finalId = createHash("sha256").update(partialEntity.objectId).digest("hex").substring(0, 16); // Shortened hash
    } else {
      // Slug is unique
      finalId = slug;
    }
    
    // Ensure unique internal ID (append counter if hash/slug still collides - unlikely but possible)
    let uniqueId = finalId;
    let counter = 1;
    while (contactEntitiesMap.has(uniqueId)) {
      uniqueId = `${finalId}-${++counter}`;
      console.warn(`[toCanonical] Internal ID collision for '${finalId}', appending counter: '${uniqueId}'`);
    }

    const finalEntity: ContactEntity = {
      ...partialEntity,
      id: uniqueId
    };

    // Validate the final entity structure before adding
    const validation = ContactEntitySchema.safeParse(finalEntity);
    if (!validation.success) {
      console.warn(`[toCanonical] Skipping entity for objectId ${finalEntity.objectId} due to validation error after creation:`, validation.error.errors);
      return;
    }

    contactEntitiesMap.set(uniqueId, validation.data);
  });

  const contactEntities = Array.from(contactEntitiesMap.values());
  // Sort alphabetically by displayName, handling potential undefined
  contactEntities.sort((a, b) =>
    (a.displayName ?? '').localeCompare(b.displayName ?? '')
  );

  if (verbose) console.log(`DEBUG [toCanonical]: Assembled ${contactEntities.length} final entities.`);

  // Assemble the final export object
  return {
    ContactEntities: contactEntities,
    Locations: [], // Keep Locations handling separate for now
    _meta: {
      generatedFrom: [inputPath],
      generatedAt: new Date().toISOString(),
      version: 1,
      hash: "", // Hash to be computed later by the caller/diff stage
    },
  };
}

// Function to convert RawOfficeCsvRow to Canonical ContactEntity
function rawToContactEntity(row: RawOfficeCsvRow, source: string = 'Office365'): Omit<ContactEntity, 'id'> {
  // Extract and check required objectId early
  const objectId = row["object id"]?.trim(); 
  if (!objectId) {
      throw new Error(`Cannot convert row to ContactEntity: Missing required 'object id'. Row: ${JSON.stringify(row)}`);
  }
  
  const displayName = row["display name"]?.trim() || undefined;
  // ... other extractions ...

  return {
    displayName: displayName,
    contactPoints: contactPoints,
    roles: roles,
    objectId: objectId, // Assign required objectId
    upn: upn,
    department: department,
    source: source as any, 
  };
}

// Main conversion function
export function toCanonical(rawRows: RawOfficeCsvRow[], sourceFileName: string): CanonicalExport {
    const contactEntitiesMap = new Map<string, ContactEntity>();

    rawRows.forEach((row, index) => {
        try {
            const partialEntity = rawToContactEntity(row);
            // Generate internal id based on displayName or fallback
            const slug = generateSlug(partialEntity.displayName); // Pass potentially undefined displayName
            // ... rest of ID generation ...
            
            const finalEntity: ContactEntity = {
                ...partialEntity,
                id: uniqueId
            };

            // ... validation ...

            contactEntitiesMap.set(uniqueId, validation.data);
        } catch (error: any) {
             console.warn(`[toCanonical] Skipping row ${index + 1} due to error during conversion: ${error.message}`);
        }
    });

    const contactEntities = Array.from(contactEntitiesMap.values());
    // Sort alphabetically by displayName, handling potential undefined
    contactEntities.sort((a, b) => 
        (a.displayName ?? '').localeCompare(b.displayName ?? '') // Use nullish coalescing
    );

    // ... rest of function ...
} 