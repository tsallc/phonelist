// lib/tests/diffCanonical.test.ts
import { describe, it, expect } from 'vitest';
import { diffCanonical } from '../diff.js';
import { CanonicalExport, ContactEntity } from '../schema.js'; // Added .js

// Helper to create a mock ContactEntity
const createEntity = (id: string, objectId: string, title: string | null = 'Test Title'): ContactEntity => ({
  kind: 'external',
  id,
  objectId,
  displayName: `Test ${id}`,
  title: title,
  contactPoints: [{ type: 'mobile', value: '123', source: 'Office365' }],
  roles: [{ office: 'PLY', brand: 'tsa', priority: 1 }],
  source: 'Merged',
  upn: `${id}@test.com`
});

// Helper to create a mock CanonicalExport
const createExport = (entities: ContactEntity[]): CanonicalExport => ({
  ContactEntities: entities,
  Locations: [],
  _meta: {
    generatedFrom: ['test.csv'],
    generatedAt: new Date().toISOString(),
    version: 1,
    hash: 'dummy-hash' // Hash comparison is done separately
  },
});

describe('diffCanonical', () => {
  const entityA = createEntity('a', 'Alice', 'Engineer');
  const entityB = createEntity('b', 'Bob');
  const entityC = createEntity('c', 'Charlie');
  const entityA_modified = createEntity('a', 'Alice M.', 'Senior Engineer'); // Modified A

  it('should return all entities as added when prev is null', () => {
    const next = createExport([entityA, entityB]);
    const result = diffCanonical(null, next);

    expect(result.added).toEqual([entityA, entityB]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual({});
    expect(result.changedCount).toBe(0);
  });

  it('should identify added entities', () => {
    const prev = createExport([entityA]);
    const next = createExport([entityA, entityB]);
    const result = diffCanonical(prev, next);

    expect(result.added).toEqual([entityB]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual({});
    expect(result.changedCount).toBe(0);
  });

  it('should identify removed entities', () => {
    const prev = createExport([entityA, entityB]);
    const next = createExport([entityA]);
    const result = diffCanonical(prev, next);

    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([entityB]);
    expect(result.changed).toEqual({});
    expect(result.changedCount).toBe(0);
  });

  it('should identify changed entities', () => {
    const prev = createExport([entityA, entityB]);
    const next = createExport([entityA_modified, entityB]);
    const result = diffCanonical(prev, next);

    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual({ 'a': { before: entityA, after: entityA_modified } });
    expect(result.changedCount).toBe(1);
  });

  it('should identify added, removed, and changed entities together', () => {
    const prev = createExport([entityA, entityB]);
    const next = createExport([entityA_modified, entityC]); // A changed, B removed, C added
    const result = diffCanonical(prev, next);

    expect(result.added).toEqual([entityC]);
    expect(result.removed).toEqual([entityB]);
    expect(result.changed).toEqual({ 'a': { before: entityA, after: entityA_modified } });
    expect(result.changedCount).toBe(1);
  });

  it('should return no changes if prev and next are identical', () => {
    const prev = createExport([entityA, entityB]);
    const next = createExport([entityA, entityB]); // Identical
    const result = diffCanonical(prev, next);

    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual({});
    expect(result.changedCount).toBe(0);
  });
}); 