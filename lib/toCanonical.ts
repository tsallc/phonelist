import * as slugifyNs from "slugify";
import { createHash } from "crypto";
import { ContactEntity, CanonicalExport, ContactPoint, Role, ContactEntitySchema } from "./schema.js";
import { RawOfficeCsvRow } from "./types.js";

const slugify = (slugifyNs as any).default ?? slugifyNs;

/** Generates a URL-friendly slug */
function generateSlug(name?: string): string {
  if (!name) return `unknown-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
  return slugify(name, { lower: true, strict: true });
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
    // Add a default null role if title is empty/missing?
    // Or omit roles entirely? For now, let's add a null title role.
    // roles.push({ office: "PLY", title: null, priority: 1 });
  }

  return {
    displayName,
    contactPoints,
    roles,
    objectId, // Required: string
    upn,
    department,
    source: source as any, // Assuming source is valid for simplicity
  };
}

/**
 * Transforms an array of raw CSV row objects into the canonical JSON structure.
 * Handles ID generation (slug/hash), uniqueness checks, and sorting.
 */
export function toCanonical(rawRows: RawOfficeCsvRow[], inputPath: string, verbose: boolean = false): CanonicalExport {
  const contactEntitiesMap = new Map<string, ContactEntity>();
  const potentialSlugs: { [key: string]: number } = {};
  const objectIdSet = new Set<string>();

  // First pass: Prepare entities, check for objectId duplicates, count slug collisions
  const partialEntities: Omit<ContactEntity, 'id'>[] = [];
  rawRows.forEach((row, index) => {
    try {
      const partialEntity = rawToPartialContactEntity(row);

      if (objectIdSet.has(partialEntity.objectId)) {
        console.warn(`[toCanonical] Duplicate objectId '${partialEntity.objectId}' found in input CSV for displayName '${partialEntity.displayName}'. Skipping row ${index + 1}.`);
        return;
      }
      objectIdSet.add(partialEntity.objectId);

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
      if (verbose) console.log(`[toCanonical] Slug collision for '${partialEntity.displayName}'. Using hash of objectId '${partialEntity.objectId}' for internal ID.`);
      finalId = createHash("sha256").update(partialEntity.objectId).digest("hex").substring(0, 16);
    } else {
      finalId = slug;
    }

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

    const validation = ContactEntitySchema.safeParse(finalEntity);
    if (!validation.success) {
      console.warn(`[toCanonical] Skipping entity for objectId ${finalEntity.objectId} due to validation error after creation:`, validation.error.errors);
      return;
    }

    contactEntitiesMap.set(uniqueId, validation.data);
  });

  const contactEntities = Array.from(contactEntitiesMap.values());
  contactEntities.sort((a, b) =>
    (a.displayName ?? '').localeCompare(b.displayName ?? '')
  );

  if (verbose) console.log(`DEBUG [toCanonical]: Assembled ${contactEntities.length} final entities.`);

  return {
    ContactEntities: contactEntities,
    Locations: [], // Keep Locations handling separate
    _meta: {
      generatedFrom: [inputPath],
      generatedAt: new Date().toISOString(),
      version: 1,
      hash: "", // Hash to be computed later
    },
  };
}