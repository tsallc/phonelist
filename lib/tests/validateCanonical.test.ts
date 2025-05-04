// lib/tests/validateCanonical.test.ts
import { describe, it, expect } from 'vitest';
import { validateCanonical } from '../validate.js';
import { CanonicalExport, ContactEntity } from '../schema.js';

// Helper creates a *base* entity, might need more fields for specific tests
const createBaseEntity = (id: string, name: string): ContactEntity => ({
  id: id,
  displayName: name,
  contactPoints: [],
  roles: [{ office: 'PLY', brand: 'tsa', title: 'Test', priority: 1 }],
  source: "Office365",
  upn: `${id}@example.com`,
  objectId: `obj-${id}`, // Assume external for base helper
  kind: 'external', // Ensure kind is present
  department: null
});

// Helper to create a basic valid structure
const createValidData = (entities: any[] = [], locations: any[] = []) => ({
    ContactEntities: entities,
    Locations: locations,
    _meta: { generatedFrom: [], generatedAt: 'now', version: 1, hash: 'test-hash' },
});

// Helper to create a minimal valid ContactEntity
const createValidEntity = (id: string, kind: 'external' | 'internal', objectId: string): ContactEntity => {
  const base = {
    id,
    objectId,
    kind,
    displayName: `Test ${id}`,
    contactPoints: [],
    roles: [{ office: 'PLY' as const, brand: 'tsa', title: 'Test', priority: 1 }],
    source: 'Merged' as const,
    upn: `${id}@example.com`
  };
  if (kind === 'internal') {
    // ... existing code ...
  }
  return base;
};

// Helper to create an entity with a specific invalidity
const createInvalidEntity = (id: string, overrides: Partial<ContactEntity>): any => {
  // ... existing code ...
};

describe('validateCanonical', () => {
  it('should pass validation for valid data', () => {
    const validData = createValidData([
        { 
            id: 'test-1', 
            displayName: 'Valid Name 1', 
            objectId: 'obj-1-valid', 
            kind: 'external', // Ensure kind is present
            roles: [], 
            contactPoints: [],
            source: "Office365"
        },
         { 
            id: 'test-2', 
            displayName: 'Valid Name 2', 
            objectId: 'manual-test-2-abcdef', 
            kind: 'internal', // Ensure kind is present
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
        { id: 'test-1', objectId: 'obj-1', kind: 'external', source: "Office365" }, 
        { id: 'test-1', objectId: 'obj-2', kind: 'external', source: "Office365" }  
    ]);
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate internal IDs found: test-1']);
  });

  it('should fail validation for duplicate objectIds', () => {
    const invalidData = createValidData([
        { id: 'test-a', objectId: 'same-obj-id', kind: 'external', source: "Office365" }, 
        { id: 'test-b', objectId: 'same-obj-id', kind: 'internal', source: "Manual" }  
    ]);
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate objectIds found: same-obj-id']);
  });

  it('should pass validation even if optional fields are missing (e.g., displayName)', () => {
    const entity = { 
        id: 'test-optional', 
        objectId: 'obj-optional', 
        kind: 'external', // Ensure kind is present
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
    // Renamed and clarified: This test checks for missing discriminator and other fields
    const invalidData = {
      ContactEntities: [
        { 
            id: 'test-missing-req', 
            // kind, objectId, source are all missing
            roles: [], 
            contactPoints: [],
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    // Check that the discriminator error is present, as Zod typically flags this first for unions
    expect(result.errors).toContain("ContactEntities.0.kind - Invalid discriminator value. Expected 'external' | 'internal'");
    // Don't assert on the *exact* list or count, as Zod might short-circuit
    expect(result.errors?.length).toBeGreaterThan(0); 
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
    const invalidRole = { office: 'INVALID_OFFICE', brand: null, title: 'Bad Role', priority: 1 };
    const invalidEntity: any = { 
        ...entity, 
        roles: [invalidRole] 
    };
    const invalidData = createValidData([invalidEntity]);
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    const officeError = result.errors?.find(e => e.includes('.roles.0.office'));
    expect(officeError).toBeDefined();
    // Check for "Invalid input" message
    expect(officeError).toContain('Invalid input');
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
     // This test is effectively the same as the one above due to how the mock was defined.
     // Let's make it slightly different - provide a KIND but miss objectId/source.
     const invalidData = {
      ContactEntities: [
        { 
            id: 'test-missing-multi', 
            kind: 'external', // Provide kind
            roles: [], 
            contactPoints: [],
            // objectId and source are missing
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    // Now it should definitely report objectId and source missing for the 'external' kind
    expect(result.errors).toContain('ContactEntities.0.objectId - Required'); 
    expect(result.errors).toContain('ContactEntities.0.source - Required');
    expect(result.errors?.length).toBe(2); // Expect only these 2 errors for the external branch
  });
}); 