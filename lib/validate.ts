import { CanonicalExportSchema, ContactEntity, CanonicalExport } from "./schema.js";

export function validateCanonical(data: unknown): { success: boolean; errors?: string[] } {
  try {
    const parsed = CanonicalExportSchema.parse(data as any);

    // Check for duplicate internal IDs
    const ids = parsed.ContactEntities.map((c: ContactEntity) => c.id);
    const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicateIds.length) {
      return {
        success: false,
        errors: [`Duplicate internal IDs found: ${[...new Set(duplicateIds)].join(", ")}`],
      };
    }

    // Check for duplicate objectIds (considering both kinds, as even manual ones should be unique)
    const objectIds = parsed.ContactEntities.map((c: ContactEntity) => c.objectId).filter(Boolean);
    const duplicateObjectIds = objectIds.filter((oid, idx) => objectIds.indexOf(oid) !== idx);
    if (duplicateObjectIds.length) {
        return {
            success: false,
            errors: [`Duplicate objectIds found: ${[...new Set(duplicateObjectIds)].join(", ")}`],
        };
    }

    // Specific check: Ensure all 'external' kind entities have a non-empty objectId
    // (This might be redundant if the schema parsing catches it, but good for explicit validation)
    const externalMissingObjectId = parsed.ContactEntities.filter(
        c => c.kind === 'external' && !c.objectId
    );
    if (externalMissingObjectId.length > 0) {
        return {
            success: false,
            errors: [`External contacts missing required objectId: ${externalMissingObjectId.map(c => c.id).join(", ")}`],
        };
    }

    // Add any other custom validation rules here...

    return { success: true };
  } catch (e: any) {
    // Check if it's a ZodError for better error reporting
    if (e.errors && Array.isArray(e.errors)) { // Check if e.errors exists and is an array
        return {
            success: false,
            errors: e.errors.map((err: { path?: (string | number)[], message?: string }) => `${err.path?.join('.') ?? 'unknown_path'} - ${err.message ?? 'Unknown error detail'}`) // Format Zod errors safely
        };
    }
    // Fallback for other error types
    return {
      success: false,
      errors: [e.message ?? 'Unknown validation error'],
    };
  }
}

 