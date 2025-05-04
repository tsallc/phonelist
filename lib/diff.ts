import { ContactEntity, CanonicalExport, ContactPoint, Role } from "./schema.js";
import isEqual from 'lodash/isEqual.js';

// --- Robust Deep Equality Check ---

/**
 * Performs a deep equality check between two values.
 * Handles primitives, objects, and arrays.
 * NOTE: Simple implementation; doesn't handle cyclic objects, Maps, Sets, Dates explicitly,
 *       and object key order doesn't matter, but array element order *does* matter here.
 *       For more complex needs, consider a library like lodash.isEqual.
 */
export function deepEqual(val1: any, val2: any): boolean {
    // Strict equality check for primitives or same object reference
    if (val1 === val2) return true;

    // Check for null/undefined mismatch
    if (val1 == null || val2 == null) return false;

    // Check for different types
    if (typeof val1 !== typeof val2) return false;

    // Handle Arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        // Simple order-dependent comparison for arrays
        for (let i = 0; i < val1.length; i++) {
            if (!deepEqual(val1[i], val2[i])) return false;
        }
        return true;
    }

    // Handle Objects (basic)
    if (typeof val1 === 'object' && typeof val2 === 'object') {
        const keys1 = Object.keys(val1);
        const keys2 = Object.keys(val2);
        
        // Check if they have the same number of keys
        if (keys1.length !== keys2.length) return false;

        // Check if keys and values match
        for (const key of keys1) {
            // Ensure val2 also has the key and the values are deep equal
            if (!val2.hasOwnProperty(key) || !deepEqual(val1[key], val2[key])) {
                return false;
            }
        }
        // If all keys and values match
        return true;
    }

    // Not equal if none of the above conditions are met
    return false;
}

// --- Diff Utilities ---

export type DiffResult = {
  added: ContactEntity[];
  removed: ContactEntity[];
  changed: Record<string, { before: ContactEntity; after: ContactEntity }>;
  changedCount: number;
};

export function diffCanonical(
  // Handle cases where prev might be null or undefined (e.g., first run)
  prev: CanonicalExport | null | undefined,
  next: CanonicalExport
): DiffResult {
  // If no previous data, all current entities are considered added
  if (!prev) {
    return {
        added: next.ContactEntities,
        removed: [],
        changed: {},
        changedCount: 0,
    };
  }

  const prevMap = new Map(prev.ContactEntities.map((c: ContactEntity) => [c.id, c]));
  const nextMap = new Map(next.ContactEntities.map((c: ContactEntity) => [c.id, c]));

  const added: ContactEntity[] = [];
  const removed: ContactEntity[] = [];
  const changed: Record<string, { before: ContactEntity; after: ContactEntity }> = {};

  // Check for added and changed entities
  for (const [id, entity] of nextMap.entries()) {
    if (!prevMap.has(id)) {
      added.push(entity);
    } else {
      const before = prevMap.get(id)!;
      const after = entity;
      // Use stringify for simple, effective change detection.
      // For field-level diff, compare properties individually.
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed[id] = { before, after };
      }
    }
  }

  // Check for removed entities
  for (const [id, entity] of prevMap.entries()) {
    if (!nextMap.has(id)) {
      removed.push(entity);
    }
  }

  return {
    added,
    removed,
    changed,
    changedCount: Object.keys(changed).length,
  };
}

/**
 * Performs a comparison between two objects and returns a record
 * detailing the fields that have different values, using deep equality checks.
 *
 * @param obj1 The first object (e.g., the 'before' state).
 * @param obj2 The second object (e.g., the 'after' state).
 * @returns A record where keys are the differing field names, and values
 *          are objects containing the 'before' and 'after' values.
 *          Returns an empty object if no differences are found.
 */
export function diff<T extends Record<string, any>>(
    obj1: T | Partial<T> | undefined | null,
    obj2: T | Partial<T> | undefined | null
): Record<string, { before: any, after: any }> {
    const differences: Record<string, { before: any, after: any }> = {};

    if (!obj1 && !obj2) return {};
    const safeObj1 = obj1 || {};
    const safeObj2 = obj2 || {};

    const allKeys = new Set([...Object.keys(safeObj1), ...Object.keys(safeObj2)]);

    for (const key of allKeys) {
        const value1 = (safeObj1 as any)[key];
        const value2 = (safeObj2 as any)[key];

        // Use lodash isEqual for robust comparison
        if (!isEqual(value1, value2)) {
            differences[key] = { before: value1, after: value2 };
        }
    }

    return differences;
} 