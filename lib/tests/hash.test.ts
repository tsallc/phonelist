// lib/tests/hash.test.ts
import { describe, it, expect } from 'vitest';
import { computeHash } from '../hash.js';
import { ContactEntity } from '../schema.js'; // Added .js

// Helper to create mock entities (simplified)
const createEntity = (id: string, name: string): ContactEntity => ({
  id,
  displayName: name,
  contactPoints: [],
  roles: [{ office: 'PLY', title: 'Test', priority: 1 }],
  objectId: `obj-${id}`,
  source: 'Office365',
  upn: `${id}@example.com`,
});

describe('computeHash', () => {
  const entityA = createEntity('a', 'Alice');
  const entityB = createEntity('b', 'Bob');
  const entityA_prime = createEntity('a', 'Alice'); // Identical to entityA
  const entityA_modified = createEntity('a', 'Alice M'); // Different name

  const locations: never[] = []; // Locations are always empty in Phase 1

  it('should produce the same hash for identical inputs', () => {
    const hash1 = computeHash([entityA, entityB], locations);
    const hash2 = computeHash([entityA, entityB], locations);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // Check for SHA-256 format
  });

  it('should produce the same hash regardless of entity order', () => {
    const hash1 = computeHash([entityA, entityB], locations);
    const hash2 = computeHash([entityB, entityA], locations); // Different order
    expect(hash1).toBe(hash2);
  });

  it('should produce a different hash for different inputs', () => {
    const hash1 = computeHash([entityA, entityB], locations);
    const hash2 = computeHash([entityA, entityA_modified], locations); // Changed entity A
    expect(hash1).not.toBe(hash2);
  });

  it('should produce the same hash for identical entities created separately', () => {
     const hash1 = computeHash([entityA], locations);
     const hash2 = computeHash([entityA_prime], locations);
     expect(hash1).toBe(hash2);
  });

   it('should produce a consistent hash for empty entity array', () => {
     const hash1 = computeHash([], locations);
     const hash2 = computeHash([], locations);
     expect(hash1).toBe(hash2);
     expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });
}); 