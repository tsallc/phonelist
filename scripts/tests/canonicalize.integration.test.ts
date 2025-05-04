// scripts/tests/canonicalize.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ContactEntity, ContactPoint, CanonicalExport } from '../../lib/schema.js';

// Path to the compiled script
const scriptPath = path.resolve(process.cwd(), 'dist/canon/scripts/canonicalize.js');

// Temporary directory for test files
let tempDir: string;

// Reusable paths and setup files
let initialLivePath: string;
let livePath: string;
let mockDir: string; // Directory for mock files

// Sample initial canonical data
const initialCanonicalData = {
  ContactEntities: [
    { id: 'a', displayName: 'Alice Initial', title: 'Tester', contactPoints: [], roles: [{ office: 'PLY', brand: 'tsa', priority: 1 }], source: 'Merged', objectId: 'obj-a', kind: 'external' },
    { id: 'b', displayName: 'Bob Initial', title: 'Tester', contactPoints: [], roles: [{ office: 'PLY', brand: 'tsa', priority: 1 }], source: 'Merged', objectId: 'obj-b', kind: 'external' },
    { id: 'c', displayName: 'Charlie Initial', title: 'Tester', contactPoints: [], roles: [{ office: 'FTL', brand: 'cts', priority: 1 }], source: 'Merged', objectId: 'obj-c', kind: 'external' },
    { id: 'internal', displayName: 'Internal Conf Room', title: 'Meeting Room', contactPoints: [], roles: [{ office: 'PLY', brand: 'tsa', priority: 1 }], source: 'Manual', objectId: 'manual-conf-123', kind: 'internal' },
  ],
  Locations: [],
  _meta: { generatedFrom: ['initial-test-setup'], generatedAt: new Date().toISOString(), version: 1 }
};

// Function to run the script via node
const runScript = (args: string[] = []) => {
    return execa('node', [scriptPath, ...args], {
        reject: false, 
        cwd: process.cwd() 
    });
};

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'canon-integ-test-'));
  mockDir = path.join(tempDir, 'mocks');
  initialLivePath = path.join(mockDir, 'initialLive.json');
  livePath = path.join(tempDir, 'liveData.json'); // The file that will be modified
  await fs.ensureDir(mockDir);
  await fs.outputJson(initialLivePath, initialCanonicalData, { spaces: 2 });
});

afterAll(async () => {
  await fs.remove(tempDir);
});

beforeEach(async () => {
    // Reset the live file before each test
    await fs.copy(initialLivePath, livePath);
});

describe('canonicalize.ts CLI Integration Tests - Update Flow', () => {
    
test('Update: Should update entries based on CSV, detect changes, and write output', async () => {
    // Setup: Create a simple CSV that updates Alice (obj-a)
    const updateCsvPath = path.join(mockDir, 'update_basic.csv');
    await fs.writeFile(updateCsvPath, `objectId,displayName,Office\nobj-a,Updated Name A,tsa:ply`); 
    const initialContent = await fs.readFile(livePath, 'utf-8');

    const { stdout, stderr } = await runScript([
        '--json', livePath, 
        '--update-from-csv', updateCsvPath, 
        '--out', livePath, // Write back to the same file 
        '--verbose'
    ]);
    
    // Assertions
    expect(stdout).toContain('Loading live canonical data');
    expect(stdout).toContain('Parsed 1 rows from update CSV');
    expect(stdout).toContain('Performing selective update');
    expect(stdout).toContain('Matched & Updated: 1'); 
    expect(stdout).toContain('Matched & No Change: 3'); // Check corrected count
    expect(stdout).toContain('Overall state changes detected:');
    
    // DEBUG: Check stdout before the failing assertion
    console.log("--- Assertion Check (Update Test): 'Writing updated canonical JSON' ---");
    console.log("STDOUT type:", typeof stdout);
    console.log("STDOUT length:", stdout.length);
    // console.log(stdout); // Optional: Log full stdout
    expect(stdout).toContain('Writing updated canonical JSON'); 

    expect(stdout).toContain('Successfully wrote JSON');
    expect(stdout).toContain('Update process complete');
    
    // Check file content changed and Alice was updated
    const finalContent = await fs.readFile(livePath, 'utf-8');
    expect(finalContent).not.toEqual(initialContent);
    const finalData: CanonicalExport = JSON.parse(finalContent);
    const entityA = finalData.ContactEntities.find(e => e.objectId === 'obj-a');
    expect(entityA?.displayName).toBe('Updated Name A');
    expect(entityA?.roles?.[0]?.brand).toBe('tsa');
    expect(entityA?.roles?.[0]?.office).toBe('PLY');
    expect(entityA?.title ?? null).toBeNull();
    expect(finalData._meta.hash).toBeDefined();
    expect(finalData._meta.generatedFrom).toEqual(expect.arrayContaining([expect.stringContaining('updateFromCsv: update_basic.csv')]));
});

test('Update: --dry-run should detect changes but not write file', async () => {
    const updateCsvPath = path.join(mockDir, 'update_dryrun.csv');
    await fs.writeFile(updateCsvPath, `objectId,displayName,Office\nobj-b,Updated DryRun Name B,tsa:ply`);
    const initialContent = await fs.readFile(livePath, 'utf-8');

    const { stdout, stderr } = await runScript([
        '--json', livePath, 
        '--update-from-csv', updateCsvPath, 
        '--out', livePath, 
        '--verbose', 
        '--dry-run'
    ]);

    // Assertions
    expect(stdout).toContain('Matched & Updated: 1');
    expect(stdout).toContain('Matched & No Change: 3'); // Check corrected count
    expect(stdout).toContain('Overall state changes detected:');
    
    // DEBUG: Check stdout before the failing assertion
    console.log("--- Assertion Check (Dry Run Test): 'Dry Run: Skipping file writes' ---");
    console.log("STDOUT type:", typeof stdout);
    console.log("STDOUT length:", stdout.length);
    // console.log(stdout); // Optional: Log full stdout
    expect(stdout).toContain('Dry Run: Skipping file writes'); 

    expect(stdout).not.toContain('Writing updated canonical JSON'); 
    expect(stdout).toContain('Update process complete');

    // Verify file wasn't changed
    const finalContent = await fs.readFile(livePath, 'utf-8');
    expect(finalContent).toEqual(initialContent);
});

test('Verbose: Should show detailed logs during update', async () => {
    const updateCsvPath = path.join(mockDir, 'update_verbose.csv');
    // CSV provides Office=cts:ftl AND Title=Updated Title
    await fs.writeFile(updateCsvPath, `objectId,displayName,Office,Title\nobj-c,Updated Verbose Name C,cts:ftl,Updated Title`);

    const { stdout, stderr } = await runScript([
        '--json', livePath, 
        '--update-from-csv', updateCsvPath, 
        '--out', livePath, 
        '--verbose'
    ]);

    // Assertions for specific verbose logs
    expect(stdout).toContain('[VERBOSE]');
    expect(stdout).toContain('[canonicalize.ts] First parsed CSV row:');
    expect(stdout).toContain('[mergeEntry] Processing external entity UNKNOWN_UPN (obj-c)');
    expect(stdout).toContain('-> Field change \'displayName\': Charlie Initial -> Updated Verbose Name C');
    expect(stdout).toContain('[canonicalize.ts] Hash Checkpoint 4: hasChanges = true');
    
    // Check final state directly 
    const finalContent = await fs.readFile(livePath, 'utf-8');
    const finalData: CanonicalExport = JSON.parse(finalContent);
    const entityC = finalData.ContactEntities.find(e => e.objectId === 'obj-c');
    expect(entityC?.displayName).toBe('Updated Verbose Name C');
    expect(entityC?.roles?.length).toBe(1);
    expect(entityC?.roles?.[0]?.brand).toBe('cts');
    expect(entityC?.roles?.[0]?.office).toBe('FTL');
    expect(entityC?.title).toBe('Updated Title');

    expect(stdout).toContain('Overall state changes detected:');
});

// ... potentially add tests for no changes, fail-on-diff, etc. ...

});