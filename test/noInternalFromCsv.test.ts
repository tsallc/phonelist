// test/noInternalFromCsv.test.ts

import { describe, it, expect } from 'vitest';
import { rowsToCanonical } from "../lib/toCanonical.js";
import { RawOfficeCsvRow } from "../lib/types.js";

describe("CSV import enforces 'external' kind", () => {
  it("throws or skips rows missing required 'object id'", () => {
    const rows: RawOfficeCsvRow[] = [
      // Row 1: Missing object id entirely
      { "display name": "Shared Copier", "mobile phone": "" }, 
      // Row 2: Object id is empty string
      { "display name": "Missing ID", "mobile phone": "", "object id": "" }, 
       // Row 3: Object id is null
      { "display name": "Null ID", "mobile phone": "", "object id": null as any }, 
       // Row 4: Valid row for control
      { "display name": "Valid External", "mobile phone": "", "object id": "valid-obj-id" },
    ];

    // rowsToCanonical logs errors and returns only successfully processed entities
    const entities = rowsToCanonical(rows);
    
    // Only the valid row should result in an entity
    expect(entities).toHaveLength(1);
    expect(entities[0].objectId).toBe("valid-obj-id");
    expect(entities[0].kind).toBe("external");
  });

  it("assigns 'external' kind to all valid rows processed", () => {
    const rows: RawOfficeCsvRow[] = [
      { "display name": "Alice", "mobile phone": "555-1234", "object id": "abc-123" },
      { "display name": "Bob",   "mobile phone": "555-5678", "object id": "def-456" },
    ];

    const entities = rowsToCanonical(rows);
    expect(entities).toHaveLength(2);
    entities.forEach(entity => {
        expect(entity.kind).toBe("external");
        expect(entity.objectId).toBeTruthy(); // Ensure objectId was retained
    });
  });
}); 