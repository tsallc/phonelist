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
    const csvData = `"Display Name","Mobile Phone","User Principal Name","Title","Object ID"
"Alice Smith","111-222-3333","alice@example.com","Engineer","obj-1"
"Bob Johnson","","bob@example.com","Manager","obj-2"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      "display name": "Alice Smith",
      "mobile phone": "111-222-3333",
      "user principal name": "alice@example.com",
      "title": "Engineer",
      "object id": "obj-1",
      "department": undefined,
    });
    expect(result[1]).toEqual({
      "display name": "Bob Johnson",
      "mobile phone": undefined,
      "user principal name": "bob@example.com",
      "title": "Manager",
      "object id": "obj-2",
      "department": undefined,
    });
  });

  it('should handle lowercase headers', async () => {
    const csvData = `"display name","mobile phone","user principal name","title","object id"
"Charlie Brown","4445556666","charlie@example.com","Analyst","obj-3"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Charlie Brown",
      "mobile phone": "4445556666",
      "user principal name": "charlie@example.com",
      "title": "Analyst",
      "object id": "obj-3",
      "department": undefined,
    });
  });

  it('should handle missing or empty display names by setting undefined', async () => {
    const csvData = `"Display Name","Mobile Phone","User Principal Name","Title","Object ID"
"","111-222-3333","empty@example.com","Tester","obj-empty"
" ","","space@example.com","QA","obj-space"
"David Lee","555-666-7777","david@example.com","Developer","obj-david"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(3);
    expect(result[0]?.[ "display name"]).toBeUndefined();
    expect(result[0]?.[ "object id"]).toBe("obj-empty");
    expect(result[1]?.[ "display name"]).toBeUndefined();
    expect(result[1]?.[ "object id"]).toBe("obj-space");
    expect(result[2]).toEqual({
        "display name": "David Lee",
        "mobile phone": "555-666-7777",
        "user principal name": "david@example.com",
        "title": "Developer",
        "object id": "obj-david",
        "department": undefined,
    });
  });

   it('should handle CSV rows with extra columns gracefully', async () => {
    const csvData = `"Display Name","Mobile Phone","User Principal Name","Title","Object ID","Extra Column"
"Alice Smith","111-222-3333","alice@example.com","Engineer","obj-1","ExtraValue"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Alice Smith",
      "mobile phone": "111-222-3333",
      "user principal name": "alice@example.com",
      "title": "Engineer",
      "object id": "obj-1",
      "department": undefined,
    });
    expect(result[0]).not.toHaveProperty('extra column');
    expect(result[0]).not.toHaveProperty('Extra Column');
  });

  it('should handle CSV rows with missing expected columns gracefully', async () => {
    const csvData = `"Display Name","Mobile Phone","Object ID"
"Bob Johnson","","obj-bob"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "display name": "Bob Johnson",
      "mobile phone": undefined,
      "object id": "obj-bob",
      "user principal name": undefined,
      "title": undefined,
      "department": undefined,
    });
  });

  it('should reject if required ObjectId is missing', async () => {
    const csvData = `"Display Name","Mobile Phone","User Principal Name","Title"
"Alice Smith","111-222-3333","alice@example.com","Engineer"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    await expect(parseCsv('dummy_path')).rejects.toThrow(
        /Missing or empty required field 'Object ID'/ 
    );
  });
}); 