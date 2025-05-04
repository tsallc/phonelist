console.log('--- Script Starting --- (compareCanonicals.ts)');

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { CanonicalExportSchema, CanonicalExport, ContactEntity, Location } from '../lib/schema.js';
import { z } from 'zod';
import { isEqual } from 'lodash'; // Using lodash for deep equality check
import fsExtra from 'fs-extra';
import { diff } from '../lib/diff.js';
import { computeHash } from '../lib/hash.js';
import { execa } from 'execa';

// --- Types ---

interface DiffResult {
    summary: {
        totalComparedA: number;
        totalComparedB: number;
        added: number;
        removed: number;
        modified: number;
        metadata: {
            fileA: string;
            hashA: string | undefined;
            fileB: string;
            hashB: string | undefined;
            timestamp: string;
        };
    };
    addedEntities: ContactEntity[];
    removedEntities: ContactEntity[];
    modifiedEntities: {
        objectId: string;
        diffs: Record<string, { fileA: any; fileB: any }>;
    }[];
}

// --- Helper Functions ---

/**
 * Reads, parses, and validates a canonical JSON file.
 */
function readFileAndValidate(filePath: string): CanonicalExport {
    console.log(`Reading file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let jsonData: unknown;
    try {
        jsonData = JSON.parse(fileContent);
    } catch (error: any) {
        throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
    }

    try {
        const validatedData = CanonicalExportSchema.parse(jsonData);
        console.log(`Successfully validated ${filePath} against schema.`);
        if (!validatedData._meta?.hash) {
            console.warn(`⚠️ Warning: _meta.hash is missing or undefined in ${filePath}`);
        } else {
            console.log(`  _meta.hash: ${validatedData._meta.hash}`);
        }
        return validatedData;
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error(`❌ Schema validation failed for ${filePath}:`, JSON.stringify(error.errors, null, 2));
        } else {
            console.error(`❌ Unexpected validation error for ${filePath}:`, error);
        }
        throw new Error(`Schema validation failed for ${filePath}.`);
    }
}

/**
 * Normalizes contact points for consistent comparison.
 */
function normalizeContactPoints(contactPoints: ContactEntity['contactPoints']) {
    if (!contactPoints) return [];
    // Sort by type, then value, then source
    return [...contactPoints].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.value !== b.value) return a.value.localeCompare(b.value);
        return (a.source || '').localeCompare(b.source || '');
    });
}

/**
 * Normalizes roles for consistent comparison.
 */
function normalizeRoles(roles: ContactEntity['roles']) {
    if (!roles) return [];
    // Sort by brand, office, then priority (Match hash.ts logic)
    return [...roles].sort((a, b) => {
        const brandA = a.brand ?? '';
        const brandB = b.brand ?? '';
        if (brandA !== brandB) return brandA.localeCompare(brandB);
        const officeA = a.office ?? ''; 
        const officeB = b.office ?? '';
        if (officeA !== officeB) return officeA.localeCompare(officeB);
        return (a.priority ?? 0) - (b.priority ?? 0);
    });
}

/**
 * Normalizes the canonical data for comparison (sorts arrays).
 * Creates a deep copy to avoid modifying the original object.
 */
function normalizeData(data: CanonicalExport): CanonicalExport {
    // Ensure ContactEntities is an array and sort by objectId
    const sortedContacts = [...(data.ContactEntities || [])].sort((a: ContactEntity, b: ContactEntity) => 
        (a.objectId ?? '').localeCompare(b.objectId ?? '')
    );

    // Normalize each contact
    const normalizedContacts = sortedContacts.map((entity: ContactEntity) => {
        // Ensure nested arrays exist and are sorted using LOCAL helpers
        const normalizedContactPoints = normalizeContactPoints(entity.contactPoints);
        const normalizedRoles = normalizeRoles(entity.roles);
        return {
            ...entity,
            contactPoints: normalizedContactPoints,
            roles: normalizedRoles
        };
    });

    // Ensure Locations is an array and sort by id
    const sortedLocations = [...(data.Locations || [])].sort((a: Location, b: Location) => 
        (a.id ?? '').localeCompare(b.id ?? '')
    );

    return {
        ...data,
        ContactEntities: normalizedContacts,
        Locations: sortedLocations
    };
}

// --- Main Comparison Logic ---

function compareCanonicals(dataA: CanonicalExport, dataB: CanonicalExport, fileAPath: string, fileBPath: string, verbose: boolean): DiffResult {
    const normalizedA = normalizeData(dataA);
    const normalizedB = normalizeData(dataB);

    const entitiesA = new Map<string, ContactEntity>(normalizedA.ContactEntities.map((e: ContactEntity) => [e.objectId!, e]));
    const entitiesB = new Map<string, ContactEntity>(normalizedB.ContactEntities.map((e: ContactEntity) => [e.objectId!, e]));

    const addedEntities: ContactEntity[] = [];
    const removedEntities: ContactEntity[] = [];
    const modifiedEntities: DiffResult['modifiedEntities'] = [];

    // Find added and modified entities
    for (const [objectId, entityA] of entitiesA.entries()) {
        const entityB = entitiesB.get(objectId);
        if (!entityB) {
            addedEntities.push(entityA);
            if (verbose) console.log(`➕ Added: ${objectId} (${entityA.displayName || 'N/A'})`);
        } else {
            // Compare common entities
            const diffs: Record<string, { fileA: any; fileB: any }> = {};
            const fieldsToCompare: (keyof ContactEntity)[] = ['displayName', 'contactPoints', 'roles', 'department', 'upn', 'source', 'kind']; // Ensure objectId is used for matching, not diffing

            fieldsToCompare.forEach(field => {
                const valueA = entityA[field];
                const valueB = entityB[field];

                // Use lodash isEqual for deep comparison, handling arrays/objects correctly after normalization
                if (!isEqual(valueA, valueB)) {
                    diffs[field] = { fileA: valueA, fileB: valueB };
                }
            });

            if (Object.keys(diffs).length > 0) {
                modifiedEntities.push({ objectId, diffs });
                if (verbose) {
                    console.log(`🔄 Modified: ${objectId} (${entityA.displayName || entityB.displayName || 'N/A'})`);
                    Object.entries(diffs).forEach(([field, diff]) => {
                       console.log(`    Field: ${field}`);
                       // Avoid overly verbose logging for complex objects unless needed
                       try {
                           console.log(`      File A (--a): ${JSON.stringify(diff.fileA)}`);
                           console.log(`      File B (--b): ${JSON.stringify(diff.fileB)}`);
                       } catch { // Handle potential circular structures, though unlikely here
                           console.log(`      File A (--a): [Complex Value]`);
                           console.log(`      File B (--b): [Complex Value]`);
                       }
                    });
                }
            }
        }
    }

    // Find removed entities
    for (const [objectId, entityB] of entitiesB.entries()) {
        if (!entitiesA.has(objectId)) {
            removedEntities.push(entityB);
            if (verbose) console.log(`➖ Removed: ${objectId} (${entityB.displayName || 'N/A'})`);
        }
    }

    // --- Prepare Result ---
    const timestamp = new Date().toISOString();
    const result: DiffResult = {
        summary: {
            totalComparedA: normalizedA.ContactEntities.length,
            totalComparedB: normalizedB.ContactEntities.length,
            added: addedEntities.length,
            removed: removedEntities.length,
            modified: modifiedEntities.length,
            metadata: {
                fileA: path.basename(fileAPath),
                hashA: normalizedA._meta?.hash,
                fileB: path.basename(fileBPath),
                hashB: normalizedB._meta?.hash,
                timestamp: timestamp,
            },
        },
        addedEntities: addedEntities,
        removedEntities: removedEntities,
        modifiedEntities: modifiedEntities,
    };

    return result;
}

// --- Output Functions ---

function writeDiffReport(result: DiffResult, fileAPath: string, fileBPath: string) {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
        console.log(`Created logs directory: ${logsDir}`);
    }

    // Sanitize file names for the output file name
    const safeFileA = path.basename(fileAPath).replace(/[^a-z0-9_.-]/gi, '_');
    const safeFileB = path.basename(fileBPath).replace(/[^a-z0-9_.-]/gi, '_');
    const timestamp = result.summary.metadata.timestamp.replace(/[:.]/g, '-');
    const outputFileName = `diff-${safeFileA}-vs-${safeFileB}-${timestamp}.json`;
    const outputPath = path.join(logsDir, outputFileName);

    try {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`
📝 Diff report written to: ${outputPath}`);
    } catch (error: any) {
        console.error(`❌ Failed to write diff report to ${outputPath}: ${error.message}`);
    }
}

// --- CLI Setup ---

const program = new Command();

program
    .version('1.0.0')
    .description('Compares two canonical JSON files (A vs B) for differences.')
    .requiredOption('--a <path>', 'Path to the first canonical JSON file (e.g., the new/modified one)')
    .requiredOption('--b <path>', 'Path to the second canonical JSON file (e.g., the reference/old one)')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .parse(process.argv);

const options = program.opts();

// --- Execution ---

try {
    const fileAPath = path.resolve(options.a);
    const fileBPath = path.resolve(options.b);

    console.log('--- Starting Canonical Comparison ---');
    console.log(`File A (--a): ${fileAPath}`);
    console.log(`File B (--b): ${fileBPath}`);
    console.log(`Verbose: ${options.verbose}`);
    console.log('-----------------------------------');

    // 1. Read and Validate
    const dataA = readFileAndValidate(fileAPath);
    const dataB = readFileAndValidate(fileBPath);

    // 2. Compare (includes normalization)
    console.log('\n--- Comparing Files ---');
    const diffResult = compareCanonicals(dataA, dataB, fileAPath, fileBPath, options.verbose);
    console.log('--- Comparison Complete ---');

    // 3. Report Summary
    console.log('\n--- Summary ---');
    console.log(`Total Entities in File A (--a): ${diffResult.summary.totalComparedA}`);
    console.log(`Total Entities in File B (--b): ${diffResult.summary.totalComparedB}`);
    console.log(`Added (in A, not B):       ${diffResult.summary.added}`);
    console.log(`Removed (in B, not A):     ${diffResult.summary.removed}`);
    console.log(`Modified (different):        ${diffResult.summary.modified}`);
    console.log('---------------');

    // 4. Write JSON Report
    writeDiffReport(diffResult, fileAPath, fileBPath);

    // 5. Exit Code (Optional: Exit with non-zero if differences found)
    if (diffResult.summary.added > 0 || diffResult.summary.removed > 0 || diffResult.summary.modified > 0) {
        console.log('\nDifferences detected between files.');
        // process.exit(1); // Uncomment to exit with error code on diff
    } else {
        console.log('\nNo differences detected between files.');
    }

    // 6. Print detailed differences
    console.log('\n--- Detailed Differences ---');
    diffResult.modifiedEntities.forEach(entity => {
        console.log(`\n  Entity ObjectId: ${entity.objectId}`);
        console.log(`    File A DisplayName: ${entity.diffs.displayName?.fileA?.displayName}`);
        console.log(`    File B DisplayName: ${entity.diffs.displayName?.fileB?.displayName}`);
        console.log("    Differences:");
        Object.keys(entity.diffs).forEach((field: string) => {
            if (entity.diffs[field]) {
                console.log(`      ${field}:`);
                console.log(`        File A: ${JSON.stringify(entity.diffs[field]?.fileA)}`);
                console.log(`        File B: ${JSON.stringify(entity.diffs[field]?.fileB)}`);
            }
        });
    });

} catch (error: any) {
    console.error(`\nERROR: An error occurred: ${error.message}`);
    process.exit(1);
} 