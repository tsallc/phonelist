// scripts/canonicalize.ts
/**
 * @file scripts/canonicalize.ts
 * @description CLI script to validate, export, and potentially update
 *              the canonical contact data JSON file.
 *              Serves as a stop-gap utility for O365 CSV sync.
 */
import { Command } from "commander";
import fs from "fs-extra";
import path from "path"; // Import path for resolving paths
import { parseCsv } from "../lib/parseCsv.js";
import { toCanonical } from "../lib/toCanonical.js";
import { validateCanonical } from "../lib/validate.js";
import { diffCanonical, DiffResult } from "../lib/diff.js"; // Import DiffResult type
import { computeHash } from "../lib/hash.js";
import { exportCsv } from "../lib/exportCsv.js";
import { CanonicalExport, ContactEntity } from "../lib/schema.js"; // Import CanonicalExport and ContactEntity
import { updateFromCsv, ChangeSummary } from "../lib/updateFromJson.js"; // Import new function and type

const program = new Command();

program
  // Input/Output for the LIVE canonical file
  .option("-j, --json <path>", "Path to the LIVE canonical JSON file", "src/data/canonicalContactData.json")
  .option("-o, --out <path>", "Output path for updated canonical JSON (used by --update-from-csv)", "src/data/canonicalContactData.json")
  
  // Modes of operation
  .option("-u, --update-from-csv <path>", "Path to NEW Office365 CSV to selectively update the live JSON file")
  .option("-e, --export-csv <path>", "Export the live JSON data to Office365 CSV format at specified path")

  // Modifiers
  .option("-f, --fail-on-diff", "Exit with code 1 if --update-from-csv causes changes", false)
  .option("-d, --dry-run", "Perform --update-from-csv checks without writing output file", false)
  .option("-v, --verbose", "Enable verbose debug logging", false)
  .version("1.1.0") // Increment version
  .description("Validates, exports, or selectively updates the live canonical JSON contact data.");

program.parse(process.argv);
const opts = program.opts<{ json: string; out: string; updateFromCsv?: string; exportCsv?: string; failOnDiff: boolean; dryRun: boolean; verbose: boolean }>();

/**
 * Main execution function for the CLI script.
 * Handles argument parsing, loads data, performs validation,
 * and orchestrates export or update operations.
 */
async function main() {
  try {
    // --- Load the LIVE Canonical JSON --- 
    if (!opts.json || !fs.existsSync(opts.json)) {
        console.error(`❌ Error: Live canonical JSON file not found at path: ${opts.json}`);
        process.exit(1);
    }
    console.log(`📘 Loading live canonical data from: ${opts.json}`);
    let liveData: CanonicalExport;
    try {
        liveData = await fs.readJson(opts.json);
    } catch (err: any) {
        console.error(`❌ Error parsing live canonical JSON file: ${err.message}`);
        process.exit(1);
    }

    // --- Validate the loaded live data --- 
    console.log(`🛡️  Validating structure of loaded live data...`);
    const validation = validateCanonical(liveData);
    if (!validation.success) {
      console.error("❌ Live data validation failed:");
      validation.errors?.forEach(err => console.error(`   - ${err}`))
      // Allow continuing for export, but maybe not for update?
      // For now, we exit if initial data is invalid, unless exporting.
      if (!opts.exportCsv) {
          process.exit(1);
      }
       console.warn("⚠️ Warning: Live data failed validation, export may be incomplete/incorrect.");
    } else {
        console.log(`✅ Live data validation successful.`);
    }

    // --- Mode: Export to CSV ---    
    if (opts.exportCsv) {
        console.log(`📤 Exporting live data to CSV format at: ${opts.exportCsv}`);
        await exportCsv(liveData.ContactEntities, opts.exportCsv);
        console.log(`✅ Successfully exported CSV to: ${opts.exportCsv}`);
        return; // Exit after export
    }

    // --- Mode: Update from CSV --- 
    if (opts.updateFromCsv) {
        if (!fs.existsSync(opts.updateFromCsv)) {
            console.error(`❌ Error: Input CSV file for update not found at path: ${opts.updateFromCsv}`);
            process.exit(1);
        }
        console.log(`📄 Reading CSV data for update from: ${opts.updateFromCsv}`);
        // Assuming parseCsv returns Record<string, any>[] (array of objects with headers as keys)
        const csvRows: Record<string, any>[] = await parseCsv(opts.updateFromCsv);
        console.log(`🔍 Parsed ${csvRows.length} rows from update CSV.`);
        // --- DEBUG: Log first parsed CSV row --- 
        if (csvRows.length > 0) {
            console.log("DEBUG [canonicalize.ts] First parsed CSV row:", JSON.stringify(csvRows[0], null, 2));
        }
        // --- End DEBUG ---

        // --- Create the ID Mapper (NO LONGER NEEDED) --- 
        // console.log("🗺️  Building map from UPN/Email to Canonical ID for matching...");
        // const canonicalEntities = liveData.ContactEntities;
        // const upnToIdMap = new Map<string, string>();
        // ... (map building logic removed) ...
        // console.log(`   - Map created with ${upnToIdMap.size} entries.`);
        // const csvToCanonicalIdMapper = (csvRow: Record<string, any>): string | undefined | null => { ... };
        // --- End ID Mapper --- 
        
        console.log(`⚙️  Performing selective update using updateFromCsv...`);
        let updatedEntities: ContactEntity[];
        let changes: ChangeSummary[];
        try {
            // Call updateFromCsv WITHOUT the mapper function
            const result = updateFromCsv(csvRows, liveData.ContactEntities); // Removed mapper argument
            updatedEntities = result.updated;
            changes = result.changes;
        } catch (validationError: any) {
            console.error(`❌ Error during updateFromCsv execution (likely validation failure):`);
            console.error(validationError.message || validationError);
            process.exit(1);
        }
        
        // Construct the full updated object for validation, hashing, and writing
        const updatedCanonicalExport: CanonicalExport = {
            ...liveData, // Preserve Locations, existing _meta fields
            ContactEntities: updatedEntities,
        };

        console.log(`🛡️  Validating updated data structure...`);
        // Now validate the full updated structure
        const updateValidation = validateCanonical(updatedCanonicalExport);
        if (!updateValidation.success) {
            console.error("❌ Updated data validation failed:");
            updateValidation.errors?.forEach(err => console.error(`   - ${err}`))
            process.exit(1); // Don't proceed if update broke validation
        }
        console.log(`✅ Updated data validation successful.`);

        console.log(`🧮 Computing hash of updated data...`);
        const newHash = computeHash(updatedCanonicalExport.ContactEntities, updatedCanonicalExport.Locations);
        updatedCanonicalExport._meta.hash = newHash; // Update hash in the object
        // Update other meta fields if necessary
        updatedCanonicalExport._meta.generatedFrom = [...new Set([...liveData._meta.generatedFrom, `updateFromCsv: ${path.basename(opts.updateFromCsv)}`])];
        updatedCanonicalExport._meta.generatedAt = new Date().toISOString();
        console.log(`   - New Hash: ${newHash}`);

        console.log(`🔄 Comparing updated data with original live version...`);
        const diffResult = diffCanonical(liveData, updatedCanonicalExport); 
        const originalHashForCompare = liveData._meta?.hash; // Use potentially existing hash
        console.log(`   DEBUG [canonicalize.ts] Comparing Hashes: Original='${originalHashForCompare}' New='${newHash}'`); // Added log
        const hasChanges = originalHashForCompare !== newHash;

        // --- Change Reporting --- 
        const updateCount = changes.filter(c => c.type === 'update').length;
        const noChangeCount = changes.filter(c => c.type === 'no_change' && c.key !== 'unknown').length;
        const skippedCount = changes.filter(c => c.key === 'unknown').length;
        console.log(`📊 Update Summary:`);
        console.log(`   - Rows Processed from CSV: ${csvRows.length}`);
        console.log(`   - Matched & Updated: ${updateCount}`);
        console.log(`   - Matched & No Change: ${noChangeCount}`);
        console.log(`   - Skipped (No matching ID found): ${skippedCount}`);
        // Note: 'added' and 'removed' counts from diffCanonical reflect full state changes,
        // while 'changes' from updateFromCsv reflects row-by-row processing.

        if (hasChanges) {
            console.log(`❗️ Overall state changes detected:`);
            console.log(`   - Entities Added (Overall): ${diffResult.added.length}`);
            console.log(`   - Entities Removed (Overall): ${diffResult.removed.length}`);
            console.log(`   - Entities Changed (Overall): ${diffResult.changedCount}`);

            if (opts.dryRun) {
                console.log(`🚫 Dry Run: Skipping file writes.`);
                // Optionally print more detailed change summary for dry run
                 if (opts.verbose) {
                    console.log("Detailed Changes (Dry Run):");
                    changes.forEach(change => {
                        if (change.type === 'update') {
                            console.log(`  [UPDATE] Key: ${change.key}`);
                             // Optionally print diff if available and verbose
                             // if(change.diff) console.log(JSON.stringify(change.diff, null, 2));
                        } else if (change.key === 'unknown') {
                             console.warn(`  [SKIPPED] CSV Row DisplayName: ${change.after?.displayName || 'N/A'}`);
                        }
                    });
                }
            } else {
                if (opts.verbose) {
                    console.log(`DEBUG: Object to be written contains ${updatedCanonicalExport.ContactEntities.length} ContactEntities.`); 
                }
                console.log(`💾 Writing updated canonical JSON to: ${opts.out}`);
                await fs.outputJson(opts.out, updatedCanonicalExport, { spaces: 2 }); 
                console.log(`✅ Successfully wrote JSON.`);
                
                const logDir = path.resolve("logs");
                const logFileName = `diff-update-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const logPath = path.join(logDir, logFileName);
                console.log(`📝 Writing detailed update change log to: ${logPath}`);
                // Log the 'changes' array from updateFromCsv for more specific update details
                await fs.outputJson(logPath, { summary: diffResult, details: changes }, { spaces: 2 }); 
                console.log(`✅ Successfully wrote detailed log.`);
            }

            if (opts.failOnDiff) {
                console.error("❌ Exiting with code 1 due to detected changes (--fail-on-diff specified).");
                process.exit(1);
            }
        } else {
            console.log("✅ No changes detected after update process.");
        }
        console.log("✨ Update process complete.");
        return; // Exit after update
    }

    // --- Default Mode: Just Validate ---    
    console.log("✨ Validation of live canonical data complete. No update or export requested.");

  } catch (error: any) {
    console.error("❌ An unexpected error occurred:");
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

main();
