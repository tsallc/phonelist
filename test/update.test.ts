import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { parseCsv } from '../lib/parseCsv.js'; // Assuming compiled JS
import { updateFromCsv, ChangeSummary } from '../lib/updateFromJson.js'; // Assuming compiled JS
import { CanonicalExport, ContactEntity } from '../lib/schema.js'; // Assuming compiled JS
import { diff } from '../lib/diff.js'; // Assuming compiled JS
import { computeHash } from '../lib/hash.js'; // Assuming compiled JS

// --- Test Configuration ---
const canonicalJsonPath = path.resolve('src/data/canonicalContactData.json');
const testCsvPath = path.resolve('test-update.csv'); // Use the CSV at the root for now
const expectedUpdates = 4;
const expectedSkips = 2;

// --- Test Setup & Data Loading (using beforeAll) ---
let liveData: CanonicalExport;
let originalHash: string;
let canonicalEntities: ContactEntity[];
let csvRows: Record<string, any>[];
let updateResult: { updated: ContactEntity[], changes: ChangeSummary[] };
let finalCanonicalExport: CanonicalExport;
let finalHash: string;

beforeAll(async () => {
    // 1. Load Data
    liveData = await fs.readJson(canonicalJsonPath);
    // Calculate or retrieve original hash
    const loadedHash = liveData._meta?.hash;
    if (loadedHash) {
        originalHash = loadedHash;
        console.log(`   - Found existing hash in canonical data: ${originalHash}`);
    } else {
        console.warn("   - WARNING: No hash found in canonical data. Calculating initial hash for test comparison.");
        originalHash = computeHash(liveData.ContactEntities, liveData.Locations);
        if (!originalHash) throw new Error("Failed to compute initial hash for canonical data.");
        console.log(`   - Calculated initial hash: ${originalHash}`);
    }
    canonicalEntities = liveData.ContactEntities;
    csvRows = await parseCsv(testCsvPath);
    if (!(csvRows.length > 0)) throw new Error("Test CSV must contain rows.");
    console.log(`   - Loaded ${canonicalEntities.length} canonical entities.`);
    console.log(`   - Parsed ${csvRows.length} CSV rows.`);

    // 2. Create ID Mapper (REMOVED - Not needed with objectId)
    
    // 3. Run Update Function
    // Pass original entities (updateFromCsv makes its own copy)
    updateResult = updateFromCsv(csvRows, canonicalEntities);
    console.log("   DEBUG: updateResult.changes:", JSON.stringify(updateResult.changes, null, 2));
    
    // 4. Prepare Final State for Hash Comparison
    finalCanonicalExport = {
        ...liveData,
        ContactEntities: updateResult.updated,
        _meta: { 
            ...liveData._meta,
            generatedFrom: [...new Set([...liveData._meta.generatedFrom, `updateFromCsv: ${path.basename(testCsvPath)}`])],
            generatedAt: new Date().toISOString(),
            // Hash will be added after calculation
        }
    };
    finalHash = computeHash(finalCanonicalExport.ContactEntities, finalCanonicalExport.Locations);
    finalCanonicalExport._meta.hash = finalHash;
});

// --- Test Suite ---
describe('Canonical Data Update from CSV', () => {

    it('should correctly identify the number of updates, skips, and no-changes', () => {
        const changes = updateResult.changes;
        console.log("   DEBUG [Test 1]: changes array length:", changes.length);
        const updateCount = changes.filter(c => c.type === 'update').length;
        const noChangeCount = changes.filter(c => c.type === 'no_change' && c.key !== 'unknown').length;
        const skippedCount = changes.filter(c => c.key === 'unknown').length;

        console.log(`   Counts - Updates: ${updateCount}, No Changes: ${noChangeCount}, Skipped: ${skippedCount}`);
        expect(updateCount, `Expected ${expectedUpdates} updates`).toBe(expectedUpdates);
        expect(skippedCount, `Expected ${expectedSkips} skips`).toBe(expectedSkips);
        expect(noChangeCount, `Expected 0 no-changes`).toBe(0);
    });

    it('should correctly update fields for a specific user (Andrea Donayre)', () => {
        const andreaChange = updateResult.changes.find(c => c.key === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6');
        
        expect(andreaChange, "Change record for andrea-donayre should exist").toBeDefined();
        const changeRecord = andreaChange!;
        expect(changeRecord.type, "Andrea Donayre type should be 'update'").toBe('update');
        expect(changeRecord.before, "Andrea Before state must exist").toBeDefined();
        expect(changeRecord.after, "Andrea After state must exist").toBeDefined();

        const andreaDiff = diff(changeRecord.before, changeRecord.after);
        console.log("   Diff for Andrea:", JSON.stringify(andreaDiff, null, 2));

        expect(andreaDiff.department, "Difference in 'department' expected").toBeDefined();
        expect(andreaDiff.department.before, "Andrea before.department").toBeNull();
        expect(andreaDiff.department.after, "Andrea after.department").toBe('Operations');
        
        expect(andreaDiff.contactPoints, "Difference in 'contactPoints' expected").toBeDefined();
        const afterMobile = andreaChange.after?.contactPoints?.find(cp => cp.type === 'mobile');
        expect(afterMobile?.value, "Andrea after mobile value").toBe('954-555-1212');
    });
    
    it('should correctly remove fields (Brian Tiller Title)', () => {
        const brianChange = updateResult.changes.find(c => c.key === 'a200fce3-d32a-4c06-861a-780850009fe1');
        expect(brianChange, "Change record for brian-tiller should exist").toBeDefined();
        const changeRecord = brianChange!;
        expect(changeRecord.type).toBe('update');
        const brianDiff = diff(changeRecord.before, changeRecord.after);
        console.log("   Diff for Brian:", JSON.stringify(brianDiff, null, 2));

        expect(brianDiff.roles, "Difference in 'roles' expected").toBeDefined();
        expect(brianDiff.roles.before?.length, "Brian before roles length").toBe(1);
        expect(brianDiff.roles.after?.length, "Brian after roles length").toBe(0); // Title removed -> role removed
    });

    it('should result in an overall hash change', () => {
        console.log(`   - Original Hash: ${originalHash}`);
        console.log(`   - Final Hash:    ${finalHash}`);
        expect(finalHash, "Final hash should not equal original hash").not.toBe(originalHash);
    });

});

// Removed manual execution and directory creation 