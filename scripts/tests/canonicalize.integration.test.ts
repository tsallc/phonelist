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
      source: 'Office365', upn: 'a@a.com', objectId: 'obj-a'
    },
    {
      id: 'b', displayName: 'Bob', contactPoints: [], 
      roles: [{office: 'FTL', title: 'Mgr', priority: 1}], 
      source: 'Merged', upn: 'b@b.com', objectId: 'obj-b'
    }
  ],
  Locations: [],
  _meta: { generatedFrom: ['ref.json'], generatedAt: '2023-01-01', version: 1, hash: 'abc' }
};

// Sample invalid canonical JSON (duplicate objectId)
const invalidCanonicalJson = {
  ...sampleCanonicalJson,
  ContactEntities: [
      ...sampleCanonicalJson.ContactEntities,
      { id: 'a-dup', displayName: 'Alice Dupe', contactPoints: [], roles: [], source: 'Office365', upn: 'a@a.com', objectId: 'obj-a' }
  ]
};

// Sample O365 CSV for update (MUST include ObjectId)
const sampleUpdateCsv = `"Display name","Mobile Phone","User principal name","Title","Department","Object ID"
"Alice","111-NEW-111","a@a.com","Senior Eng","Tech","obj-a"`;

// Function to run the script via node
const runScript = (args: string[] = []) => {
    return execa('node', [scriptPath, ...args], {
        reject: false, // Don't throw on non-zero exit codes
        cwd: process.cwd() // Ensure it runs from project root
    });
};

beforeAll(async () => {
  // Create a temporary directory before all tests
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'canon-test-'));
});

afterAll(async () => {
  // Clean up the temporary directory after all tests
  await fs.remove(tempDir);
});

beforeEach(async () => {
    // Optional: Ensure temp dir is clean before each test
    await fs.emptyDir(tempDir);
    // --- Define test paths within beforeEach ---
    liveJsonPath = path.join(tempDir, 'liveData.json');
    invalidJsonPath = path.join(tempDir, 'invalidData.json');
    updateCsvPath = path.join(tempDir, 'update.csv');
    exportCsvPath = path.join(tempDir, 'export.csv');
    outputJsonPath = path.join(tempDir, 'outputData.json');
});

describe('canonicalize.ts CLI Integration Tests', () => {
    
    // --- Test Default Mode (Validation) ---
    it('Default: should validate a valid JSON file and exit 0', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', liveJsonPath]);
        
        expect(exitCode).toBe(0);
        expect(stdout).toContain('✅ Live data validation successful');
        expect(stdout).toContain('Validation of live canonical data complete');
        expect(stderr).toBe('');
    });

    it('Default: should fail validation for an invalid JSON file (duplicate objectId) and exit 1', async () => {
        await fs.outputJson(invalidJsonPath, invalidCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', invalidJsonPath]);
        
        expect(exitCode).toBe(1);
        expect(stderr).toContain('❌ Live data validation failed');
        expect(stderr).toContain('Duplicate objectIds found: obj-a');
    });

    it('Default: should exit 1 if JSON file does not exist', async () => {
        const { stdout, stderr, exitCode } = await runScript(['--json', 'nonexistent.json']);
        
        expect(exitCode).toBe(1);
        expect(stderr).toContain('❌ Error: Live canonical JSON file not found');
    });

    // --- Test Export Mode --- 
    it('Export: should export valid JSON to CSV and exit 0', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', liveJsonPath, '--export-csv', exportCsvPath]);
        
        expect(exitCode).toBe(0);
        expect(stdout).toContain(`✅ Successfully exported CSV to: ${exportCsvPath}`);
        expect(stderr).toBe('');
        expect(await fs.pathExists(exportCsvPath)).toBe(true);
        // TODO: Optionally read and validate CSV content
        const csvContent = await fs.readFile(exportCsvPath, 'utf-8');
        expect(csvContent).toContain('Display Name,Mobile Phone'); // Header check
        expect(csvContent).toContain('Alice,'); // Alice has no mobile in sample
        expect(csvContent).toContain('Bob,'); // Bob has no mobile
    });

    it('Export: should warn but still export if source JSON is invalid', async () => {
        await fs.outputJson(invalidJsonPath, invalidCanonicalJson);
        const { stdout, stderr, exitCode } = await runScript(['--json', invalidJsonPath, '--export-csv', exportCsvPath]);
        
        expect(exitCode).toBe(0); // Still exits 0
        expect(stderr).toContain('⚠️ Warning: Live data failed validation');
        expect(stdout).toContain(`✅ Successfully exported CSV to: ${exportCsvPath}`);
        expect(await fs.pathExists(exportCsvPath)).toBe(true);
    });

     // --- Test Update Mode (NEW Logic) --- 
    it('Update: should run, detect changes based on objectId, and write output', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        await fs.writeFile(updateCsvPath, sampleUpdateCsv);
        
        const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, 
            '--update-from-csv', updateCsvPath, 
            '--out', outputJsonPath 
        ]);
        
        expect(exitCode).toBe(0);
        expect(stderr).toBe(''); 
        expect(stdout).toContain('Performing selective update');
        expect(stdout).toContain('📊 Update Summary:');
        expect(stdout).toContain('Matched & Updated: 1'); 
        expect(stdout).toContain('❗️ Overall state changes detected:');
        expect(stdout).toContain(`💾 Writing updated canonical JSON to: ${outputJsonPath}`);
        expect(stdout).toContain(`📝 Writing detailed update change log to:`);
        expect(stdout).toContain('✨ Update process complete.');
        expect(stdout).not.toContain('✅ No changes detected'); 
        expect(await fs.pathExists(outputJsonPath)).toBe(true); 
        
        const outputData: CanonicalExport = await fs.readJson(outputJsonPath);
        const updatedAlice = outputData.ContactEntities.find((e: ContactEntity) => e.objectId === 'obj-a'); 
        expect(updatedAlice?.department).toBe('Tech');
        expect(updatedAlice?.roles?.[0]?.title).toBe('Senior Eng');
        const mobilePoint = updatedAlice?.contactPoints?.find((cp: ContactPoint) => cp.type === 'mobile');
        expect(mobilePoint?.value).toBe('111-NEW-111');
        expect(outputData._meta?.hash).not.toBe('abc'); 
    });

    it('Update: should run with --dry-run, detect changes based on objectId, and not write files', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        await fs.writeFile(updateCsvPath, sampleUpdateCsv);
        
         const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, 
            '--update-from-csv', updateCsvPath, 
            '--out', outputJsonPath,
            '--dry-run'
        ]);
        
        expect(exitCode).toBe(0);
        expect(stderr).toBe('');
        expect(stdout).toContain('Performing selective update');
        expect(stdout).toContain('📊 Update Summary:');
        expect(stdout).toContain('Matched & Updated: 1'); 
        expect(stdout).toContain('❗️ Overall state changes detected:');
        expect(stdout).toContain('🚫 Dry Run: Skipping file writes.'); 
        expect(stdout).toContain('✨ Update process complete.');
        expect(stdout).not.toContain('✅ No changes detected');
        expect(await fs.pathExists(outputJsonPath)).toBe(false); 
    });

    // --- Test Verbose Flag ---
    it('Verbose: should output specific DEBUG logs when --verbose is used during update', async () => {
        await fs.outputJson(liveJsonPath, sampleCanonicalJson);
        await fs.writeFile(updateCsvPath, sampleUpdateCsv);
        
         const { stdout, stderr, exitCode } = await runScript([
            '--json', liveJsonPath, 
            '--update-from-csv', updateCsvPath, 
            '--out', outputJsonPath,
            '--dry-run', 
            '--verbose' 
        ]);
        
        expect(exitCode).toBe(0);
        expect(stderr).toBe('');
        expect(stdout).toContain('DEBUG [canonicalize.ts] First parsed CSV row:');
        expect(stdout).toContain('DEBUG [updateFromCsv loop] First csvRow object:');
        expect(stdout).toContain('DEBUG [mergeEntry] Final result for ID');
        expect(stdout).toContain('DEBUG [updateFromCsv] Changes detected for objectId');
        expect(stdout).toContain('🚫 Dry Run: Skipping file writes.'); 
        expect(stdout).toContain('✨ Update process complete.');
    });
}); 