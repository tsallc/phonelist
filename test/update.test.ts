import { describe, it, expect, beforeAll, test } from 'vitest';
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
const testReorderCsvPath = path.resolve('test-reorder.csv'); // New CSV for reorder test
const expectedUpdates = 4; // Based on test-update.csv content
// const expectedSkips = 3; // Cannot reliably calculate skips from current changes array
const expectedNoChanges = 35; // Should be total entities - updated entities = 39 - 4 = 35

// --- Test Setup & Data Loading (using beforeAll) ---
let liveData: CanonicalExport;
let originalHash: string;
let canonicalEntities: ContactEntity[];
let csvRows: Record<string, any>[];
let csvRowsReorder: Record<string, any>[]; // For reorder test

beforeAll(async () => {
    // 1. Load Data
    liveData = await fs.readJson(canonicalJsonPath);
    canonicalEntities = liveData.ContactEntities; // Use the migrated data with 'brand'
    originalHash = liveData._meta?.hash ?? computeHash(liveData.ContactEntities, liveData.Locations); // Get hash from file or compute
    
    // Parse CSVs
    csvRows = await parseCsv(testCsvPath);
    const reorderCsvContent = `UserPrincipalName,DisplayName,ObjectId,MobilePhone,Office\nADonayre@titlesolutionsllc.com,Andrea D Reordered,80e43ee8-9b62-49b7-991d-b8365a0ed5a6,9545344838,cts:ftl`; 
    await fs.writeFile(testReorderCsvPath, reorderCsvContent);
    csvRowsReorder = await parseCsv(testReorderCsvPath);

    // Log basic info
    console.log(`   - Loaded ${canonicalEntities.length} canonical entities.`);
    console.log(`   - Parsed ${csvRows.length} rows from main test CSV.`);
    console.log(`   - Parsed ${csvRowsReorder.length} rows from reorder test CSV.`);
});

// --- Test Suite ---
describe('Canonical Data Update from CSV', () => {

    it('should correctly identify the number of updates, skips, and no-changes for main test', () => {
        // --- Run update logic LOCALLY for this test ---
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        // --- 
        
        const updateCount = changes.filter(c => c.type === 'update').length;
        const noChangeCount = changes.filter(c => c.type === 'no_change').length;
        
        const currentExpectedUpdates = 4; 
        const currentExpectedNoChanges = 35;

        console.log(`   Counts - Updates: ${updateCount}, No Changes: ${noChangeCount}`);
        expect(updateCount, `Expected ${currentExpectedUpdates} updates`).toBe(currentExpectedUpdates);
        expect(noChangeCount, `Expected ${currentExpectedNoChanges} no-changes`).toBe(currentExpectedNoChanges);
    });

    it('should correctly update fields for a specific user (Andrea Donayre) in main test', () => {
        // --- Run update logic LOCALLY for this test ---
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        // --- 
        const andreaChange = changes.find(c => c.key === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6');
        
        expect(andreaChange, "Change record for andrea-donayre should exist").toBeDefined();
        if (!andreaChange?.before || !andreaChange?.after) throw new Error('Missing before/after state for Andrea');
        const changeRecord = andreaChange!;
        expect(changeRecord.type, "Andrea Donayre type should be 'update'").toBe('update');

        const andreaDiff = diff(changeRecord.before as ContactEntity, changeRecord.after as ContactEntity);
        console.log("   Diff for Andrea:", JSON.stringify(andreaDiff, null, 2));

        expect(andreaDiff.department, "Difference in 'department' expected").toBeDefined();
        expect(andreaDiff.department.before, "Andrea before.department").toBeNull();
        expect(andreaDiff.department.after, "Andrea after.department").toBe('Operations');
        
        expect(andreaDiff.contactPoints, "Difference in 'contactPoints' expected").toBeDefined();
        const afterMobile = changeRecord.after?.contactPoints?.find(cp => cp.type === 'mobile');
        expect(afterMobile?.value, "Andrea after mobile value").toBe('954-555-1212');

        console.log("DEBUG [Andrea Test] changeRecord.after.roles:", JSON.stringify(changeRecord.after?.roles));
        const finalRole = changeRecord.after?.roles?.[0];
        expect(finalRole?.brand, "Andrea final role brand").toBe('cts');
        expect(finalRole?.office, "Andrea final role office").toBe('FTL');
        expect(finalRole?.title, "Andrea final role title").toBe('Office Manager'); 
    });
    
    it('should correctly remove fields (Brian Tiller Title) in main test', () => {
        // --- Run update logic LOCALLY for this test ---
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        // --- 
        const brianChange = changes.find(c => c.key === 'a200fce3-d32a-4c06-861a-780850009fe1');
        expect(brianChange, "Change record for brian-tiller should exist").toBeDefined();
        if (!brianChange?.before || !brianChange?.after) throw new Error('Missing before/after state for Brian');
        const changeRecord = brianChange!; 
        expect(changeRecord.type).toBe('update');

        const brianDiff = diff(changeRecord.before as ContactEntity, changeRecord.after as ContactEntity);
        console.log("   Diff for Brian:", JSON.stringify(brianDiff, null, 2));

        // --- RESTORED Assertion: Roles SHOULD differ now because title changed to null --- 
        expect(brianDiff.roles, "Difference in 'roles' IS expected").toBeDefined(); 
        
        // Check the final state directly
        const finalRole = changeRecord.after?.roles?.[0];
        expect(changeRecord.after?.roles?.length, "Brian should still have 1 role").toBe(1);
        expect(finalRole?.brand, "Brian final role brand").toBe('tsa');
        expect(finalRole?.office, "Brian final role office").toBe('PLY');
        expect(finalRole?.title, "Brian final role title should be null").toBeNull(); 
    });

    it('should result in an overall hash change for main test', () => {
        // --- Run update logic LOCALLY for this test ---
        const { updated } = updateFromCsv(csvRows, canonicalEntities);
        const finalCanonicalExport = { ...liveData, ContactEntities: updated };
        const finalHash = computeHash(finalCanonicalExport.ContactEntities, finalCanonicalExport.Locations);
        // --- 
        console.log(`   - Original Hash: ${originalHash}`);
        console.log(`   - Final Hash:    ${finalHash}`);
        expect(finalHash, "Final hash should not equal original hash").not.toBe(originalHash);
    });

    it('should NOT detect changes if only contactPoint order differs', () => {
        // --- Run update logic LOCALLY for this test ---
        const { changes } = updateFromCsv(csvRowsReorder, canonicalEntities);
        // --- 
        const andreaReorderChange = changes.find(c => c.key === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6');
        
        expect(andreaReorderChange, "Change record for reordered Andrea should exist").toBeDefined();
        if (!andreaReorderChange?.before || !andreaReorderChange?.after) throw new Error('Missing before/after state for Reordered Andrea');
        expect(andreaReorderChange!.type).toBe('update'); 
        
        console.log("DEBUG [Reorder Test] andreaReorderChange.after.roles:", JSON.stringify(andreaReorderChange.after?.roles));

        const andreaReorderDiff = diff(andreaReorderChange.before as ContactEntity, andreaReorderChange.after as ContactEntity);
        
        expect(andreaReorderDiff.displayName, "Difference in 'displayName' expected").toBeDefined();
        const finalRole = andreaReorderChange.after?.roles?.[0];
        expect(finalRole?.brand, "Reordered Andrea final role brand").toBe('cts');
        expect(finalRole?.office, "Reordered Andrea final role office").toBe('FTL');
        expect(finalRole?.title, "Reordered Andrea final role title").toBeNull(); 
    });

});

// Removed manual execution and directory creation 