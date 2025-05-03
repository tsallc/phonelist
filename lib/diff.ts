import { ContactEntity, CanonicalExport } from "./schema.js";

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