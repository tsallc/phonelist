// lib/tests/parseCsv.test.ts
import { describe, it, expect, vi } from 'vitest';
import { parseCsv } from '../parseCsv';
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
      "Display Name": "Alice Smith",
      "Mobile Phone": "111-222-3333",
      "User Principal Name": "alice@example.com",
      "Title": "Engineer",
      "Object ID": undefined, // Ensure unspecified fields are undefined
      "Department": undefined,
    });
    expect(result[1]).toEqual({
      "Display Name": "Bob Johnson",
      "Mobile Phone": undefined, // Handled empty string
      "User Principal Name": "bob@example.com",
      "Title": "Manager",
      "Object ID": undefined,
      "Department": undefined,
    });
  });

  it('should handle lowercase headers (assuming fast-csv handles it)', async () => {
    // fast-csv with headers:true is generally case-insensitive if mapping is consistent
    // We rely on the library's behavior here, but verify our extraction logic
    const csvData = `"display name","mobile phone","user principal name","title"
"Charlie Brown","4445556666","charlie@example.com","Analyst"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    expect(result).toHaveLength(1);
    // IMPORTANT: Our code looks for specific casing ('Display name', 'Mobile Phone')
    // The test verifies that IF fast-csv maps lowercase headers correctly, our extraction still works.
    // If fast-csv DOESN'T map, the result would have undefined for these fields.
    expect(result[0]).toEqual({
      "Display Name": "Charlie Brown", // Expect correct extraction based on our key lookup
      "Mobile Phone": "4445556666",
      "User Principal Name": "charlie@example.com",
      "Title": "Analyst",
      "Object ID": undefined,
      "Department": undefined,
    });
  });

  it('should handle missing or empty display names by setting undefined', async () => {
    const csvData = `"Display name","Mobile Phone","User principal name","Title"
"","111-222-3333","empty@example.com","Tester"
" ","","space@example.com","QA"
"David Lee","555-666-7777","david@example.com","Developer"`; // Valid one to ensure loop continues
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');

    // Expect only the valid row to be fully processed, others have undefined display name
    expect(result).toHaveLength(3);
    expect(result[0]["Display Name"]).toBeUndefined();
    expect(result[1]["Display Name"]).toBeUndefined();
    expect(result[2]).toEqual({
        "Display Name": "David Lee",
        "Mobile Phone": "555-666-7777",
        "User Principal Name": "david@example.com",
        "Title": "Developer",
        "Object ID": undefined,
        "Department": undefined,
    });
  });

   it('should handle CSV rows with extra columns gracefully', async () => {
    const csvData = `"Display name","Mobile Phone","User principal name","Title","Extra Column"
"Alice Smith","111-222-3333","alice@example.com","Engineer","ExtraValue"`;
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    // Check that extra columns are ignored
    expect(result[0]).toEqual({
      "Display Name": "Alice Smith",
      "Mobile Phone": "111-222-3333",
      "User Principal Name": "alice@example.com",
      "Title": "Engineer",
      "Object ID": undefined,
      "Department": undefined,
    });
    expect(result[0]).not.toHaveProperty('Extra Column');
  });

  it('should handle CSV rows with missing expected columns gracefully', async () => {
    const csvData = `"Display name","Mobile Phone"
"Bob Johnson",""`; // Missing UPN, Title
    const mockStream = createMockStream(csvData);
    vi.mocked(fs.createReadStream).mockReturnValue(mockStream as any);

    const result = await parseCsv('dummy_path');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "Display Name": "Bob Johnson",
      "Mobile Phone": undefined,
      "User Principal Name": undefined, // Expect undefined
      "Title": undefined, // Expect undefined
      "Object ID": undefined,
      "Department": undefined,
    });
  });
}); 