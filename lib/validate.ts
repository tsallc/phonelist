import { CanonicalExportSchema, ContactEntity, CanonicalExport } from "./schema.js";

export function validateCanonical(data: unknown): { success: boolean; errors?: any[] } {
  try {
    const parsed = CanonicalExportSchema.parse(data as any);

    const ids = parsed.ContactEntities.map((c: ContactEntity) => c.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length) {
      return {
        success: false,
        errors: [`Duplicate IDs found: ${[...new Set(duplicates)].join(", ")}`],
      };
    }

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

 