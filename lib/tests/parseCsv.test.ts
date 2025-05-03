// lib/tests/parseCsv.test.ts
import { describe, it, expect, vi } from 'vitest';
import { parseCsv } from '../parseCsv.js';
import fs from 'fs';
import { Readable } from 'stream';

// Mock fs.createReadStream
vi.mock('fs');

// Helper to create a mock stream from a string
function createMockStream(content: string): Readable {
  const stream = new Readable();
  stream.push(content);
  stream.push(null); // Signal end of stream
  return stream;
}

describe('parseCsv', () => {
  it('should parse normal CSV data correctly', async () => {
    const csvData = `"Display name","Mobile Phone","User principal name","Title"
"Alice Smith","111-222-3333","alice@example.com","Engineer"
"Bob Johnson","","bob@example.com","Manager"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      "display name": "Alice Smith",
      "mobile phone": "111-222-3333",
      "user principal name": "alice@example.com",
      "title": "Engineer",
      "object id": undefined,
      "department": undefined,
    });
    expect(result[1]).toEqual({
      "display name": "Bob Johnson",
      "mobile phone": undefined,
      "user principal name": "bob@example.com",
      "title": "Manager",
      "object id": undefined,
      "department": undefined,
    });
  });

  it('should handle lowercase headers', async () => {
    const csvData = `"display name","mobile phone","user principal name","title"
"Charlie Brown","4445556666","charlie@example.com","Analyst"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Charlie Brown",
      "mobile phone": "4445556666",
      "user principal name": "charlie@example.com",
      "title": "Analyst",
      "object id": undefined,
      "department": undefined,
    });
  });

  it('should handle missing or empty display names by setting undefined', async () => {
    const csvData = `"Display name","Mobile Phone","User principal name","Title"
"","111-222-3333","empty@example.com","Tester"
" ","","space@example.com","QA"
"David Lee","555-666-7777","david@example.com","Developer"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(3);
    expect(result[0]?.[ "display name"]).toBeUndefined();
    expect(result[1]?.[ "display name"]).toBeUndefined();
    expect(result[2]).toEqual({
        "display name": "David Lee",
        "mobile phone": "555-666-7777",
        "user principal name": "david@example.com",
        "title": "Developer",
        "object id": undefined,
        "department": undefined,
    });
  });

   it('should handle CSV rows with extra columns gracefully', async () => {
    const csvData = `"Display name","Mobile Phone","User principal name","Title","Extra Column"
"Alice Smith","111-222-3333","alice@example.com","Engineer","ExtraValue"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Alice Smith",
      "mobile phone": "111-222-3333",
      "user principal name": "alice@example.com",
      "title": "Engineer",
      "object id": undefined,
      "department": undefined,
    });
  });

  it('should handle CSV rows with missing expected columns gracefully', async () => {
    const csvData = `"Display name","Mobile Phone"
"Bob Johnson",""`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Bob Johnson",
      "mobile phone": undefined,
      "user principal name": undefined,
      "title": undefined,
      "object id": undefined,
      "department": undefined,
    });
  });
}); 