// lib/tests/validateCanonical.test.ts
import { describe, it, expect } from 'vitest';
import { validateCanonical } from '../validate';
import { CanonicalExport, ContactEntity } from '../schema'; // Assuming schema.ts defines these

// Helper to create a base valid CanonicalExport object
const createValidData = (overrides: Partial<CanonicalExport> = {}): CanonicalExport => {
  const defaultEntity: ContactEntity = {
    id: 'test-1',
    displayName: 'Test User',
    contactPoints: [],
    roles: [{ office: 'UNK', title: 'Tester', priority: 1 }],
    source: 'Office365',
    upn: 'test@example.com'
  };

  return {
    ContactEntities: [defaultEntity],
    Locations: [],
    _meta: {
      generatedFrom: ['test.csv'],
      generatedAt: new Date().toISOString(),
      version: 1,
      hash: 'valid-hash'
    },
    ...overrides,
  };
};

describe('validateCanonical', () => {
  it('should pass validation for valid data', () => {
    const validData = createValidData();
    const result = validateCanonical(validData);
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail validation for duplicate IDs', () => {
    const entity1 = createValidData().ContactEntities[0];
    const entity2 = { ...createValidData().ContactEntities[0], displayName: 'Duplicate ID User' }; // Same ID 'test-1'
    const invalidData = createValidData({ ContactEntities: [entity1, entity2] });
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Duplicate IDs found: test-1']);
  });

  it('should fail validation for missing required fields (e.g., displayName)', () => {
    const invalidEntity = { ...createValidData().ContactEntities[0] };
    delete (invalidEntity as any).displayName; // Force remove required field
    const invalidData = createValidData({ ContactEntities: [invalidEntity] });
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['ContactEntities.0.displayName - Required']);
  });

  it('should fail validation for incorrect types (e.g., ContactEntities not an array)', () => {
    const invalidData = createValidData({ ContactEntities: { fake: "object" } } as any); // Invalidate ContactEntities
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain('ContactEntities - Expected array'); // Check error message part
  });

  it('should fail validation for invalid enum values (e.g., invalid office)', () => {
    const invalidRole = { office: 'INVALID_OFFICE', title: 'Bad Role', priority: 1 };
    const invalidEntity = { ...createValidData().ContactEntities[0], roles: [invalidRole] };
    // Cast to any to bypass TypeScript check for this intentional type violation
    const invalidData = createValidData({ ContactEntities: [invalidEntity] } as any); 
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toContain('ContactEntities.0.roles.0.office'); // Check path
    expect(result.errors?.[0]).toContain('Invalid literal value'); // Check message part
  });

   it('should fail validation for malformed _meta object', () => {
    const invalidData = createValidData();
    delete (invalidData._meta as any).version;
    const result = validateCanonical(invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['_meta.version - Invalid literal value, expected 1']); // Correct assertion based on Zod
  });

   it('should handle completely invalid input', () => {
    const result = validateCanonical({ just: "a random object" });
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0); // Expect multiple Zod errors
  });
}); 