// scripts/tests/canonicalize.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ContactEntity, ContactPoint, CanonicalExport } from '../../lib/schema.js';

// Path to the compiled script
const scriptPath = path.resolve(process.cwd(), 'dist/canon/scripts/canonicalize.js');

// Temporary directory for test files
let tempDir: string;

// --- Declare path variables outside hooks ---
let liveJsonPath: string;
let invalidJsonPath: string;
let updateCsvPath: string;
let exportCsvPath: string;
let outputJsonPath: string;

// Sample valid canonical JSON content
const sampleCanonicalJson = {
  ContactEntities: [
    {
      id: 'a', displayName: 'Alice', contactPoints: [], 
      roles: [{office: 'PLY', title: 'Eng', priority: 1}], 
      source: 'Office365', upn: 'a@a.com', 
      objectId: 'obj-a', 
      kind: 'external' // Ensure kind
    },
    {
      id: 'b', displayName: 'Bob', contactPoints: [], 
      roles: [{office: 'FTL', title: 'Mgr', priority: 1}], 
      source: 'Merged', upn: 'b@b.com', 
      objectId: 'obj-b', 
      kind: 'external' // Ensure kind
    },
    {
      id: 'internal-res', displayName: 'Internal Resource', contactPoints: [],
      roles: [{office: 'PLY', title: 'Utility', priority: 1}],
      source: 'Manual',
      objectId: 'manual-internal-res-abcdef', 
      kind: 'internal' // Ensure kind
    }
  ],
  Locations: [],
  _meta: { generatedFrom: ['test.json'], generatedAt: '2023-01-01', version: 1, hash: 'abc-initial' }
};

// Sample invalid canonical JSON (duplicate objectId)
const invalidCanonicalJson = {
  ContactEntities: [
    { 
        id: 'a', displayName: 'Alice', objectId: 'obj-a', kind: 'external', // Ensure kind
        roles: [], contactPoints: [], source: 'Office365' 
    },
    { 
        id: 'a-dup', displayName: 'Alice Duplicate?', objectId: 'obj-a', kind: 'external', // Ensure kind
        roles: [], contactPoints: [], source: 'Office365' 
    }
  ],
  Locations: [],
  _meta: { generatedFrom: ['test.json'], generatedAt: '2023-01-01', version: 1 }
};

// Sample CSV content for update tests
const sampleUpdateCsv = `"DisplayName","ObjectId","MobilePhone","Title"
"Alice Updated","obj-a","123-456-7890","Engineer II"
"Charlie New","obj-c","","Manager"
`; // obj-c doesn't exist in sampleCanonicalJson, obj-a does

// Function to run the script via node
const runScript = (args: string[] = []) => {
    return execa('node', [scriptPath, ...args], {
        reject: false, 
        cwd: process.cwd() 
    });
};

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'canon-test-'));
});

afterAll(async () => {
  await fs.remove(tempDir);
});

beforeEach(async () => {
    await fs.emptyDir(tempDir);
    liveJsonPath = path.join(tempDir, 'liveData.json');
    invalidJsonPath = path.join(tempDir, 'invalidData.json');
    updateCsvPath = path.join(tempDir, 'update.csv');
    exportCsvPath = path.join(tempDir, 'export.csv');
    outputJsonPath = path.join(tempDir, 'outputData.json');
});

describe('canonicalize.ts CLI Integration Tests', () => {
    
    it('Default: should validate a valid JSON file and exit 0', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', liveJsonPath]);
        expect(exitCode).toBe(0);
        expect(stdout).toContain('✅ Live data validation successful.');
        expect(stdout).toContain('✨ Validation of live canonical data complete.');
        expect(stderr).toMatch(/(\[WARN\] meta\.hash field detected.*)?$/);
    });

    it('Default: should fail validation for an invalid JSON file (duplicate objectId) and exit 1', async () => {
        await fs.outputJson(invalidJsonPath, invalidCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', invalidJsonPath]);
        expect(exitCode).toBe(1);
        expect(stderr).toContain('[ERROR] Live data validation failed:');
        expect(stderr).toContain('Duplicate objectIds found: obj-a'); 
    });

    it('Default: should exit 1 if JSON file does not exist', async () => {
        const { stdout, stderr, exitCode } = await runScript(['--json', 'nonexistent.json']); 
        expect(exitCode).toBe(1);
        expect(stderr).toContain('[ERROR] Live canonical JSON file not found');
    });

    it('Export: should export valid JSON to CSV and exit 0', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', liveJsonPath, '--export-csv', exportCsvPath]);
        expect(exitCode).toBe(0);
        expect(stderr).toMatch(/(\[WARN\] meta\.hash field detected.*)?$/);
        expect(stdout).toContain('✅ Successfully exported CSV');
        expect(await fs.pathExists(exportCsvPath)).toBe(true);
    });

    it('Export: should warn but still export if source JSON is invalid', async () => {
        await fs.outputJson(invalidJsonPath, invalidCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', invalidJsonPath, '--export-csv', exportCsvPath]);
        expect(exitCode).toBe(0); 
        expect(stderr).toContain('[ERROR] Live data validation failed:');
        expect(stderr).toContain('Duplicate objectIds found: obj-a'); 
        expect(stderr).toContain('[WARN] Live data failed validation, export may be incomplete/incorrect.');
        expect(stdout).toContain(`✅ Successfully exported CSV to: ${exportCsvPath}`); 
        expect(await fs.pathExists(exportCsvPath)).toBe(true);     
    });

     // --- Test Update Mode (NEW Logic) --- 
    it('Update: should run, detect changes based on objectId, and write output', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        await fs.writeFile(updateCsvPath, sampleUpdateCsv);
        const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, '--update-from-csv', updateCsvPath, '--out', outputJsonPath
        ]);
        
        expect(exitCode).toBe(0);
        expect(stderr).toMatch(/(\[WARN\] meta\.hash field detected.*)?$/);
        expect(stdout).toContain('Performing selective update');
        expect(stdout).toContain('❗️ Overall state changes detected:');
        expect(stdout).toContain('Matched & Updated: 1');
        expect(stdout).toContain('Skipped (No matching ID found): 1');
        expect(stdout).toContain(`💾 Writing updated canonical JSON to: ${outputJsonPath}`);
        expect(stdout).toContain('✨ Update process complete.');
        expect(await fs.pathExists(outputJsonPath)).toBe(true); 
        
        const outputData: CanonicalExport = await fs.readJson(outputJsonPath);
        const updatedAlice = outputData.ContactEntities.find((e: ContactEntity) => e.objectId === 'obj-a'); 
        expect(updatedAlice).toBeDefined();
        if (!updatedAlice) return;

        expect(updatedAlice.displayName).toBe('Alice Updated');
        expect(updatedAlice.roles?.[0]?.title).toBe('Engineer II');
        const mobilePoint = updatedAlice.contactPoints?.find((cp: ContactPoint) => cp.type === 'mobile');
        expect(mobilePoint?.value).toBe('123-456-7890');

        expect(updatedAlice.department).toBeUndefined();
        expect(updatedAlice.upn).toBeNull();
        
        const bob = outputData.ContactEntities.find((e: ContactEntity) => e.objectId === 'obj-b');
        expect(bob?.displayName).toBe('Bob');
        const internal = outputData.ContactEntities.find((e: ContactEntity) => e.kind === 'internal');
        expect(internal?.displayName).toBe('Internal Resource');

        expect(outputData._meta?.hash).not.toBe('abc-initial');
    });

    it('Update: should run with --dry-run, detect changes based on objectId, and not write files', async () => {
       await fs.outputJson(liveJsonPath, sampleCanonicalJson);
       await fs.writeFile(updateCsvPath, sampleUpdateCsv);
       const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, '--update-from-csv', updateCsvPath, '--out', outputJsonPath, '--dry-run'
        ]);
        expect(exitCode).toBe(0);
        expect(stderr).toMatch(/(\[WARN\] meta\.hash field detected.*)?$/);
        expect(stdout).toContain('Performing selective update');
        expect(stdout).toContain('Matched & Updated: 1'); 
        expect(stdout).toContain('❗️ Overall state changes detected:');
        expect(stdout).toContain('🚫 Dry Run: Skipping file writes.'); 
        expect(stdout).toContain('✨ Update process complete.');
        expect(await fs.pathExists(outputJsonPath)).toBe(false); 
    });

    it('Verbose: should output specific DEBUG/VERBOSE logs when --verbose is used during update', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        await fs.writeFile(updateCsvPath, sampleUpdateCsv);
        const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, 
            '--update-from-csv', updateCsvPath, 
            '--out', outputJsonPath, 
            '--verbose'
        ]);
        
        expect(exitCode).toBe(0);
        expect(stderr).toMatch(/(\[WARN\] meta\.hash field detected.*)?$/);
        expect(stdout).toContain('[Logger] Verbose logging enabled.');
        expect(stdout).toContain('[VERBOSE] [canonicalize.ts] Computed initial hash (Post Copy):');
        expect(stdout).toContain('[VERBOSE] [canonicalize.ts] First parsed CSV row:');
        expect(stdout).toContain('[VERBOSE] [updateFromCsv loop] First csvRow object:');
        expect(stdout).toContain('[VERBOSE] [mergeEntry] Final result for ID');
        expect(stdout).toContain('DEBUG [computeHash - Initial] Hashing Contact');
        expect(stdout).toContain('DEBUG [computeHash - Updated] Hashing Contact');
        expect(stdout).toContain('❗️ Overall state changes detected:');
        expect(stdout).toContain(`💾 Writing updated canonical JSON to: ${outputJsonPath}`);
        expect(stdout).toContain('✨ Update process complete.');
    });
});