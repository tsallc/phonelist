// lib/tests/validateCanonical.test.ts
import { describe, it, expect } from 'vitest';
import { validateCanonical } from '../validate.js';
import { CanonicalExport, ContactEntity } from '../schema.js';

// Helper creates a *valid* base entity
const createBaseEntity = (id: string, name: string): ContactEntity => ({
  id: id,
  displayName: name,
  contactPoints: [],
  roles: [{ office: 'PLY', title: 'Tester', priority: 1 }],
  source: 'Office365',
  upn: `${id}@example.com`,
  objectId: `obj-${id}`,
  department: null
});

// Helper creates a *valid* base export
const createValidData = (entities: ContactEntity[]): CanonicalExport => ({
  ContactEntities: entities,
  Locations: [],
  _meta: {
    generatedFrom: ['test.csv'],
    generatedAt: new Date().toISOString(),
    version: 1,
    hash: 'valid-hash'
  },
});

describe('validateCanonical', () => {
  it('should pass validation for valid data', () => {
    const validData = createValidData([createBaseEntity('test-1', 'Test User')]);
    const result = validateCanonical(validData);
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail validation for duplicate IDs', () => {
    const entity1 = createBaseEntity('test-1', 'User One');
    const entity2 = createBaseEntity('test-1', 'User Two'); // Same ID
    const invalidData = createValidData([entity1, entity2]);
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate IDs found: test-1']);
  });

  it('should fail validation for missing required fields (e.g., displayName)', () => {
    const entity = createBaseEntity('test-1', 'Test User');
    const invalidEntity = { ...entity };
    delete (invalidEntity as any).displayName; 
    // We need to pass the modified entity within a valid CanonicalExport structure
    const invalidData = {
        ...createValidData([]), // Use base structure
        ContactEntities: [invalidEntity] // Add the invalid entity
    }
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['ContactEntities.0.displayName - Required']);
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

  it('should fail validation for missing required fields (objectId)', () => {
    const invalidData = {
      ContactEntities: [
        { 
            id: 'test', 
            displayName: 'Valid Name', 
            // objectId is missing 
            roles: [], 
            contactPoints: [],
            source: "Office365"
        }
      ],
      Locations: [],
      _meta: { generatedFrom: [], generatedAt: 'now', version: 1 },
    };
    const result = validateCanonical(invalidData as any);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['ContactEntities.0.objectId - Required']); // Updated expected error
  });
}); 