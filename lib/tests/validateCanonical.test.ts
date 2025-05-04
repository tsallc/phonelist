// lib/tests/validateCanonical.test.ts
import { describe, it, expect } from 'vitest';
import { validateCanonical } from '../validate.js';
import { CanonicalExport, ContactEntity } from '../schema.js';

// Helper creates a *base* entity, might need more fields for specific tests
const createBaseEntity = (id: string, name: string): ContactEntity => ({
  id: id,
  displayName: name,
  contactPoints: [],
  roles: [{ office: 'PLY', title: 'Test', priority: 1 }],
  source: "Office365",
  upn: `${id}@example.com`,
  objectId: `obj-${id}`, // Assume external for base helper
  kind: 'external', // Added kind
  department: null
});

// Helper to create a basic valid structure
const createValidData = (entities: any[] = [], locations: any[] = []) => ({
    ContactEntities: entities,
    Locations: locations,
    _meta: { generatedFrom: [], generatedAt: 'now', version: 1, hash: 'test-hash' },
});

describe('validateCanonical', () => {
  it('should pass validation for valid data', () => {
    const validData = createValidData([
        { 
            id: 'test-1', 
            displayName: 'Valid Name 1', 
            objectId: 'obj-1-valid', 
            kind: 'external', // Added kind
            roles: [], 
            contactPoints: [],
            source: "Office365"
        },
         { 
            id: 'test-2', 
            displayName: 'Valid Name 2', 
            objectId: 'manual-test-2-abcdef', 
            kind: 'internal', // Added kind
            roles: [], 
            contactPoints: [],
            source: "Manual"
        }
    ]);
    const result = validateCanonical(validData);
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail validation for duplicate internal IDs', () => {
    const invalidData = createValidData([
        { id: 'test-1', objectId: 'obj-1', kind: 'external', source: "Office365" }, // Added required fields
        { id: 'test-1', objectId: 'obj-2', kind: 'external', source: "Office365" }  // Added required fields
    ]);
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate internal IDs found: test-1']);
  });

  it('should fail validation for duplicate objectIds', () => {
    const invalidData = createValidData([
        { id: 'test-a', objectId: 'same-obj-id', kind: 'external', source: "Office365" }, // Added required fields
        { id: 'test-b', objectId: 'same-obj-id', kind: 'internal', source: "Manual" }  // Added required fields
    ]);
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate objectIds found: same-obj-id']);
  });

  it('should pass validation even if optional fields are missing (e.g., displayName)', () => {
    const entity = { 
        id: 'test-optional', 
        // displayName is missing 
        objectId: 'obj-optional', 
        kind: 'external', // Added kind
        roles: [], 
        contactPoints: [],
        source: "Office365"
    };
    const validData = createValidData([entity as any]);
    const result = validateCanonical(validData);
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail validation for missing required fields (e.g., displayName)', () => {
    const invalidData = {
      ContactEntities: [
        { 
            id: 'test-missing-req', 
            roles: [], 
            contactPoints: [],
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('ContactEntities.0.objectId - Required'); 
    expect(result.errors).toContain('ContactEntities.0.source - Required');
  });

  it('should fail validation for incorrect types (e.g., ContactEntities not an array)', () => {
    const invalidData = {
        ...createValidData([]),
        ContactEntities: { fake: "object" } // Overwrite with invalid type
    }
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain('ContactEntities - Expected array');
  });

  it('should fail validation for invalid enum values (e.g., invalid office)', () => {
    const entity = createBaseEntity('test-1', 'Test User');
    const invalidRole = { office: 'INVALID_OFFICE', title: 'Bad Role', priority: 1 };
    // Create a modified entity with the invalid role, ensuring other required fields are present
    const invalidEntity: any = { 
        ...entity, 
        roles: [invalidRole] 
    };
    const invalidData = createValidData([invalidEntity]); // Pass the array containing the invalid entity
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain('ContactEntities.0.roles.0.office');
    expect(result.errors?.[0]).toContain('Invalid enum value');
  });

   it('should fail validation for malformed _meta object', () => {
    const invalidData = createValidData([createBaseEntity('test-1', 'Test User')]);
    delete (invalidData._meta as any).version;
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['_meta.version - Invalid literal value, expected 1']);
  });

   it('should handle completely invalid input', () => {
    const result = validateCanonical({ just: "a random object" });
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should fail validation for missing required fields (objectId only)', () => {
    // Test focuses ONLY on missing objectId for an external kind
    const invalidData = {
      ContactEntities: [
        { 
            id: 'test-missing-objid', 
            displayName: 'Has DisplayName',
            kind: 'external', // Kind is present
            // objectId is missing
            roles: [], 
            contactPoints: [],
            source: "Office365" // Source is present
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('ContactEntities.0.objectId - Required');
    expect(result.errors?.length).toBe(1); // Expect ONLY the objectId error
  });

  it('should fail validation for multiple missing required fields', () => {
    const invalidData = {
      ContactEntities: [
        { 
            id: 'test-missing-req', 
            roles: [], 
            contactPoints: [],
            // objectId and source and kind are missing
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    // Expect errors for kind, objectId and source
    expect(result.errors).toContain("ContactEntities.0.kind - Invalid discriminator value. Expected 'external' | 'internal'"); 
    expect(result.errors).toContain('ContactEntities.0.objectId - Required'); 
    expect(result.errors).toContain('ContactEntities.0.source - Required');
    expect(result.errors?.length).toBe(3); // Expect 3 errors
  });
}); 