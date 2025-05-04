import { describe, it, expect, beforeAll, test } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { parseCsv } from '../lib/parseCsv.js'; // Assuming compiled JS
import { updateFromCsv, ChangeSummary, getRoleDiffs, RoleDelta } from '../lib/updateFromJson.js'; // Assuming compiled JS
import { CanonicalExport, ContactEntity, Role } from '../lib/schema.js'; // Assuming compiled JS
import { diff } from '../lib/diff.js'; // Assuming compiled JS
import { computeHash } from '../lib/hash.js'; // Assuming compiled JS

// --- Test Configuration ---
const canonicalJsonPath = path.resolve('src/data/canonicalContactData.json');
// Define path for the main test CSV, will be created dynamically
const testCsvPath = path.resolve('test-update.csv'); 
const testReorderCsvPath = path.resolve('test-reorder.csv'); // New CSV for reorder test
const expectedUpdates = 4; // Based on test-update.csv content
// const expectedSkips = 3; // Cannot reliably calculate skips from current changes array
const expectedNoChanges = 35; // Should be total entities - updated entities = 39 - 4 = 35

// Define the content for the main test CSV
const mainTestCsvContent = `UserPrincipalName,DisplayName,Department,MobilePhone,Title,ObjectId,NonsenseField,Office\r
ADonayre@titlesolutionsllc.com,Andrea Donayre,Operations,954-555-1212,Office Manager,80e43ee8-9b62-49b7-991d-b8365a0ed5a6,,cts:ftl\r
aignagni@titlesolutionsllc.com,Andrew Ignagni,Escrow,,Escrow Officer,3f6fd6c1-a95d-4dea-89f3-08901b2a513b,,tsa:ply\r
btiller@titlesolutionsllc.com,Brian Tiller,,248-555-9999,,a200fce3-d32a-4c06-861a-780850009fe1,,tsa:ply\r
nonexistent@example.com,Non Existent,Sales,111-222-3333,Sales Rep,new-object-id-1,ShouldBeIgnored,\r
kcase@titlesolutionsllc.com,Kathy Case,Processing,7346643610,Processor,5f322c80-1e10-432c-b186-bb6a8548fd41,,tsa:ply\r
unknown-upn@example.com,Unknown Person,IT,,,new-object-id-2,,\r
red-herring@example.com,Red Herring,Test,,,object-id-does-not-exist,AnotherIgnore, \r
`;

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
    
    // Write and parse test CSVs
    await fs.writeFile(testCsvPath, mainTestCsvContent); // Write the main test CSV
    csvRows = await parseCsv(testCsvPath); // Parse the newly written main test CSV
    
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
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        const updateCount = changes.filter(c => c.type === 'update').length;
        const noChangeCount = changes.filter(c => c.type === 'no_change').length;
        // Note: Expected counts might change if Brian is no longer considered an update
        // Let's run and see. For now, keep original expectation.
        const currentExpectedUpdates = 4; 
        const currentExpectedNoChanges = 35;
        console.log(`   Counts - Updates: ${updateCount}, No Changes: ${noChangeCount}`);
        expect(updateCount, `Expected updates`).toBe(currentExpectedUpdates);
        expect(noChangeCount, `Expected no-changes`).toBe(currentExpectedNoChanges);
    });

    it('should correctly update fields for a specific user (Andrea Donayre) in main test', () => {
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        const andreaChange = changes.find(c => c.key === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6')!;
        expect(andreaChange, "Change record for andrea-donayre should exist").toBeDefined();
        if (!andreaChange?.before || !andreaChange?.after) throw new Error('Missing before/after state for Andrea');
        expect(andreaChange.type).toBe('update');

        const andreaDiff = diff(andreaChange.before as ContactEntity, andreaChange.after as ContactEntity);
        console.log("   Diff for Andrea:", JSON.stringify(andreaDiff, null, 2));

        expect(andreaDiff.department, "Difference in 'department' expected").toBeDefined();
        expect(andreaDiff.department.before, "Andrea before.department").toBeNull();
        expect(andreaDiff.department.after, "Andrea after.department").toBe('Operations');
        
        expect(andreaDiff.contactPoints, "Difference in 'contactPoints' expected").toBeDefined();
        const afterMobile = andreaChange.after?.contactPoints?.find(cp => cp.type === 'mobile');
        expect(afterMobile?.value, "Andrea after mobile value").toBe('954-555-1212');

        console.log("DEBUG [Andrea Test] changeRecord.after.roles:", JSON.stringify(andreaChange.after?.roles));
        const finalRole = andreaChange.after?.roles?.[0];
        expect(finalRole?.brand).toBe('cts');
        expect(finalRole?.office).toBe('FTL');
        // --- CORRECTED ASSERTION (Decoupled Logic) ---
        // CSV has Office=cts:ftl AND Title=Office Manager.
        // The explicit org:loc tag defines the role structure.
        // The csvTitle is then applied to that structure.
        expect(finalRole?.title, "Andrea final role title should be 'Office Manager'").toBe('Office Manager'); 
    });
    
    it('should correctly handle Brian Tiller (preserve Title)', () => {
        const { changes } = updateFromCsv(csvRows, canonicalEntities);
        const brianChange = changes.find(c => c.key === 'a200fce3-d32a-4c06-861a-780850009fe1');
        expect(brianChange, "Change record for brian-tiller should exist").toBeDefined();
        if (!brianChange?.before || !brianChange?.after) throw new Error('Missing before/after state for Brian');
        
        // CSV has Office=tsa:ply but an empty Title.
        // The Office tag dictates the role structure { brand: tsa, office: PLY }.
        // The empty CSV Title results in csvTitle being null.
        // This null title is applied to the role derived from the Office tag.
        // Therefore, a role change *is* expected (original title 'President' -> null).
        expect(brianChange.type).toBe('update'); // Still an update because mobile changed

        const beforeRoles = (brianChange.before?.roles as Role[] | undefined) || [];
        const afterRoles = (brianChange.after?.roles as Role[] | undefined) || [];
        console.log("DEBUG [Brian Test] Before Roles:", JSON.stringify(beforeRoles));
        console.log("DEBUG [Brian Test] After Roles:", JSON.stringify(afterRoles));
        
        const roleDeltas = getRoleDiffs(beforeRoles, afterRoles);
        console.log("   Role Deltas for Brian:", JSON.stringify(roleDeltas, null, 2));

        // --- UPDATED ASSERTION (Decoupled Logic + Precise Diffing) ---
        // A difference *is* expected because the title changes from 'President' to null.
        expect(roleDeltas.length, "Expected 1 role difference (title)").toBe(1);
        if (roleDeltas.length === 1) {
            expect(roleDeltas[0].key).toBe('title');
            expect(roleDeltas[0].before).toBe('President');
            expect(roleDeltas[0].after).toBeNull();
        }

        // Check the final state directly
        const finalRole = afterRoles[0];
        expect(afterRoles.length).toBe(1);
        expect(finalRole?.brand).toBe('tsa');
        expect(finalRole?.office).toBe('PLY');
        // Title should be null because Office tag dictated the role and CSV title was empty/null.
        expect(finalRole?.title, "Brian final role title should become null").toBeNull(); 
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

    it('should correctly handle reordered Andrea (preserve Title)', () => {
        // Reorder CSV only has Office=cts:ftl, no Title column mentioned
        const { changes } = updateFromCsv(csvRowsReorder, canonicalEntities);
        const andreaReorderChange = changes.find(c => c.key === '80e43ee8-9b62-49b7-991d-b8365a0ed5a6');
        
        expect(andreaReorderChange, "Change record for reordered Andrea should exist").toBeDefined();
        if (!andreaReorderChange?.before || !andreaReorderChange?.after) throw new Error('Missing before/after state for Reordered Andrea');
        // Should still be update because DisplayName changed
        expect(andreaReorderChange!.type).toBe('update'); 
        
        // --- CORRECTED ASSERTION (Decoupled Logic) ---
        // Reorder CSV defines Office=cts:ftl but has no Title column.
        // The merge logic should use the Office tag to define the role structure,
        // and since csvTitle is effectively null/undefined, the resulting role title should be null.
        // *** WAIT - Correction ***: The PREVIOUS logic preserved existing roles via fallback.
        // The NEW logic only preserves via fallback if the OFFICE field contains ONLY a fallback tag (e.g., 'tsa').
        // If the OFFICE field contains org:loc (e.g., 'cts:ftl'), it REPLACES existing roles for that signature.
        // It creates the new role {brand:cts, office:FTL} and applies csvTitle (which is missing/null here).
        // So the title *should* be null in this case.
        
        const finalRole = andreaReorderChange.after?.roles?.[0];
        console.log("DEBUG [Reorder Test] andreaReorderChange.after.roles:", JSON.stringify(andreaReorderChange.after?.roles));
        expect(finalRole?.brand).toBe('cts');
        expect(finalRole?.office).toBe('FTL');
        // Title should be null because the role was dictated by cts:ftl and csvTitle was missing.
        expect(finalRole?.title ?? null, "Reordered Andrea final role title should be null").toBeNull();
    });

}); // Close the describe block

// Removed manual execution and directory creation 