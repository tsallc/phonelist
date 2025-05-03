// lib/tests/toCanonical.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCanonical } from '../toCanonical';
import { RawOfficeCsvRow } from '../types'; // Assuming types.ts exists

// Mock console.warn for the missing UPN test
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('toCanonical', () => {
  const mockInputPath = 'test.csv';

  beforeEach(() => {
    // Reset mocks before each test if needed, especially global ones
    vi.resetAllMocks(); 
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  it('should transform basic CSV data to canonical format', () => {
    const rawRows: RawOfficeCsvRow[] = [
      {
        "Display name": "Alice Smith",
        "Mobile Phone": "111-222-3333",
        "User principal name": "alice@example.com",
        "Title": "Engineer",
        "Object ID": "obj-1",
        "Department": "Tech",
      },
    ];
    const result = toCanonical(rawRows, mockInputPath);

    expect(result.ContactEntities).toHaveLength(1);
    const entity = result.ContactEntities[0];
    expect(entity.id).toBe('alice-smith');
    expect(entity.displayName).toBe('Alice Smith');
    expect(entity.contactPoints).toEqual([{ type: 'mobile', value: '111-222-3333', source: 'Office365' }]);
    expect(entity.roles).toEqual([{ office: 'UNK', title: 'Engineer', priority: 1 }]);
    expect(entity.objectId).toBe('obj-1');
    expect(entity.upn).toBe('alice@example.com');
    expect(entity.department).toBe('Tech');
    expect(entity.source).toBe('Office365');
    expect(result.Locations).toEqual([]);
    expect(result._meta.generatedFrom).toEqual([mockInputPath]);
    expect(result._meta.version).toBe(1);
  });

  it('should handle missing optional fields', () => {
    const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "Bob Johnson", "User principal name": "bob@example.com" },
    ];
    const result = toCanonical(rawRows, mockInputPath);
    const entity = result.ContactEntities[0];

    expect(entity.id).toBe('bob-johnson');
    expect(entity.displayName).toBe('Bob Johnson');
    expect(entity.contactPoints).toEqual([]); // Empty array
    expect(entity.roles).toEqual([{ office: 'UNK', title: null, priority: 1 }]); // Role with null title
    expect(entity.objectId).toBeUndefined();
    expect(entity.upn).toBe('bob@example.com');
    expect(entity.department).toBeUndefined();
  });

  it('should handle mobile phone variations (take first part)', () => {
    const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "Charlie", "Mobile Phone": "1234567890 / 0987654321" },
      { "Display name": "David", "Mobile Phone": "" },
      { "Display name": "Eve", "Mobile Phone": "  " },
    ];
    const result = toCanonical(rawRows, mockInputPath);

    expect(result.ContactEntities[0].contactPoints).toEqual([{ type: 'mobile', value: '1234567890', source: 'Office365' }]);
    expect(result.ContactEntities[1].contactPoints).toEqual([]);
    expect(result.ContactEntities[2].contactPoints).toEqual([]);
  });

  it('should handle slug collisions using hash fallback', async () => {
    // Use vi.doMock for localized mocking
    await vi.doMock('crypto', () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockDigest = vi.fn()
        .mockReturnValueOnce('hash-for-john1') // First call
        .mockReturnValueOnce('hash-for-john2'); // Second call
      return {
        createHash: vi.fn(() => ({ update: mockUpdate, digest: mockDigest })),
      };
    });

    // Dynamically import the module *after* mocking crypto
    const { toCanonical: toCanonicalWithMock } = await import('../toCanonical');

    const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "John Smith", "User principal name": "john.smith1@example.com" },
      { "Display name": "John Smith", "User principal name": "john.smith2@example.com" },
      { "Display name": "Jane Doe", "User principal name": "jane@example.com" },
    ];
    
    const result = toCanonicalWithMock(rawRows, mockInputPath);
    const crypto = await import('crypto'); // Get the mocked crypto instance
    const mockedCreateHash = vi.mocked(crypto.createHash);
    const mockUpdate = vi.mocked(mockedCreateHash().update);

    expect(result.ContactEntities).toHaveLength(3);
    const jane = result.ContactEntities.find(e => e.displayName === 'Jane Doe')!;
    const johns = result.ContactEntities.filter(e => e.displayName === 'John Smith');

    expect(jane.id).toBe('jane-doe');
    expect(johns[0].id).toBe('hash-for-john1');
    expect(johns[1].id).toBe('hash-for-john2');
    expect(mockUpdate).toHaveBeenCalledWith('john.smith1@example.comOffice365');
    expect(mockUpdate).toHaveBeenCalledWith('john.smith2@example.comOffice365');

    vi.doUnmock('crypto'); // Clean up the mock
  });

  it('should sort entities by display name', () => {
    const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "Charlie" },
      { "Display name": "Alice" },
      { "Display name": "Bob" },
    ];
    const result = toCanonical(rawRows, mockInputPath);

    expect(result.ContactEntities.map(e => e.displayName)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should skip rows with no display name', () => {
     const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "Alice" },
      { "Display name": undefined }, // Parsed as undefined
      { "Display name": "Bob" },
    ];
     const result = toCanonical(rawRows, mockInputPath);
     expect(result.ContactEntities).toHaveLength(2);
     expect(result.ContactEntities.map(e => e.displayName)).toEqual(['Alice', 'Bob']);
  });

  it('should handle slug collision with missing UPN (console warn expected)', async () => {
    await vi.doMock('crypto', () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockDigest = vi.fn().mockReturnValue('hash-no-upn');
      return {
        createHash: vi.fn(() => ({ update: mockUpdate, digest: mockDigest })),
      };
    });

    const { toCanonical: toCanonicalWithMock } = await import('../toCanonical');

    const rawRows: RawOfficeCsvRow[] = [
      { "Display name": "No UPN" },
      { "Display name": "No UPN" },
    ];

    const result = toCanonicalWithMock(rawRows, mockInputPath);
    const crypto = await import('crypto');
    const mockedCreateHash = vi.mocked(crypto.createHash);
    const mockUpdate = vi.mocked(mockedCreateHash().update);

    expect(result.ContactEntities).toHaveLength(2);
    expect(result.ContactEntities[0].id).toBe('hash-no-upn');
    expect(result.ContactEntities[1].id).toBe('hash-no-upn');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("WARN: Slug collision for 'No UPN' but no UPN available"));
    expect(mockUpdate).toHaveBeenCalledWith('No UPNOffice365');

    vi.doUnmock('crypto');
  });
}); 