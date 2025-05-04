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
import { log, setVerbose } from "../lib/logger.js"; // Import logger

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

// Set verbosity level for the logger
setVerbose(opts.verbose || false);

/**
 * Main execution function for the CLI script.
 * Handles argument parsing, loads data, performs validation,
 * and orchestrates export or update operations.
 */
async function main() {
  try {
    // --- Load the LIVE Canonical JSON --- 
    if (!opts.json || !fs.existsSync(opts.json)) {
        log.error(`Live canonical JSON file not found at path: ${opts.json}`);
        process.exit(1);
    }
    log.info(`📘 Loading live canonical data from: ${opts.json}`);
    let liveData: CanonicalExport;
    try {
        liveData = await fs.readJson(opts.json);
    } catch (err: any) {
        log.error(`Error parsing live canonical JSON file: ${err.message}`);
        process.exit(1);
    }
    // --- Sanitize and log meta.hash --- 
    const metaHash = liveData._meta?.hash;
    if (metaHash) {
        log.warn('meta.hash field detected in source input — ignoring for diff calculation.');
        // Optionally remove it completely if desired, though not strictly necessary for comparison fix
        // delete liveData._meta.hash;
    }
    log.verbose(`[canonicalize.ts] Hash from _meta (will be ignored for comparison): ${metaHash}`);
    
    // --- Compute initial hash using a DEEP COPY to prevent mutation issues --- 
    const initialComputedHash = computeHash(
        JSON.parse(JSON.stringify(liveData.ContactEntities)), 
        JSON.parse(JSON.stringify(liveData.Locations)), 
        "Initial"
    );
    log.verbose(`[canonicalize.ts] Computed initial hash (Post Copy): ${initialComputedHash}`);
    // --- End DEBUG ---

    // --- Validate the loaded live data --- 
    log.info(`🛡️  Validating structure of loaded live data...`);
    const validation = validateCanonical(liveData);
    if (!validation.success) {
      log.error("Live data validation failed:");
      validation.errors?.forEach(err => log.error(`   - ${err}`))
      // Allow continuing for export, but maybe not for update?
      // For now, we exit if initial data is invalid, unless exporting.
      if (!opts.exportCsv) {
          process.exit(1);
      }
       log.warn("Live data failed validation, export may be incomplete/incorrect.");
    } else {
        log.info(`✅ Live data validation successful.`);
    }

    // --- Mode: Export to CSV ---    
    if (opts.exportCsv) {
        log.info(`📤 Exporting live data to CSV format at: ${opts.exportCsv}`);
        await exportCsv(liveData.ContactEntities, opts.exportCsv);
        log.info(`✅ Successfully exported CSV to: ${opts.exportCsv}`);
        return; // Exit after export
    }

    // --- Mode: Update from CSV --- 
    if (opts.updateFromCsv) {
        if (!fs.existsSync(opts.updateFromCsv)) {
            log.error(`Input CSV file for update not found at path: ${opts.updateFromCsv}`);
            process.exit(1);
        }
        log.info(`📄 Reading CSV data for update from: ${opts.updateFromCsv}`);
        // Assuming parseCsv returns Record<string, any>[] (array of objects with headers as keys)
        const csvRows: Record<string, any>[] = await parseCsv(opts.updateFromCsv);
        log.info(`🔍 Parsed ${csvRows.length} rows from update CSV.`);
        // --- DEBUG: Log first parsed CSV row --- 
        if (csvRows.length > 0) {
            log.verbose("[canonicalize.ts] First parsed CSV row:", JSON.stringify(csvRows[0], null, 2));
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
        
        log.info(`⚙️  Performing selective update using updateFromCsv...`);
        let updatedEntities: ContactEntity[];
        let changes: ChangeSummary[];
        try {
            // Call updateFromCsv WITHOUT the mapper function
            const result = updateFromCsv(csvRows, liveData.ContactEntities); // Removed mapper argument
            updatedEntities = result.updated;
            changes = result.changes;
        } catch (validationError: any) {
            log.error(`Error during updateFromCsv execution (likely validation failure):`);
            log.error(validationError.message || validationError);
            process.exit(1);
        }
        
        // Construct the full updated object for validation, hashing, and writing
        const updatedCanonicalExport: CanonicalExport = {
            ...liveData, // Preserve Locations, existing _meta fields
            ContactEntities: updatedEntities,
        };

        log.info(`🛡️  Validating updated data structure...`);
        const updateValidation = validateCanonical(updatedCanonicalExport);
        if (!updateValidation.success) {
            log.error("Updated data validation failed:");
            updateValidation.errors?.forEach(err => log.error(`   - ${err}`))
            process.exit(1); // Don't proceed if update broke validation
        }
        log.info(`✅ Updated data validation successful.`);

        // --- DEBUG: Log the object BEFORE hashing --- 
        log.verbose("[canonicalize.ts] Object being passed to computeHash(..., \"Updated\"):", JSON.stringify(updatedCanonicalExport, null, 2));
        // --- End DEBUG ---
        
        log.info(`🧮 Computing hash of updated data...`);
        // Compute new hash using a DEEP COPY 
        const newHash = computeHash(
            JSON.parse(JSON.stringify(updatedCanonicalExport.ContactEntities)), 
            JSON.parse(JSON.stringify(updatedCanonicalExport.Locations)), 
            "Updated"
        );
        updatedCanonicalExport._meta.hash = newHash; 
        updatedCanonicalExport._meta.generatedFrom = [...new Set([...liveData._meta.generatedFrom, `updateFromCsv: ${path.basename(opts.updateFromCsv)}`])];
        updatedCanonicalExport._meta.generatedAt = new Date().toISOString();
        log.info(`   - New Hash: ${newHash}`);

        log.info(`🔄 Comparing updated data with original live version...`);
        const diffResult = diffCanonical(liveData, updatedCanonicalExport); 
        
        // <<<< CRITICAL: Use initialComputedHash, never trust liveData._meta.hash >>>>
        const originalHashForCompare = initialComputedHash; 
        log.verbose(`[canonicalize.ts] Hash Checkpoint 1: initialComputedHash = ${initialComputedHash}`);
        log.verbose(`[canonicalize.ts] Hash Checkpoint 2: originalHashForCompare = ${originalHashForCompare}`);
        log.verbose(`[canonicalize.ts] Hash Checkpoint 3: newHash = ${newHash}`);

        log.verbose(`[canonicalize.ts] Comparing Hashes: InitialComputed='${originalHashForCompare}' New='${newHash}'`); 
        const hasChanges = originalHashForCompare !== newHash;
        log.verbose(`[canonicalize.ts] Hash Checkpoint 4: hasChanges = ${hasChanges}`);

        // --- Change Reporting --- 
        const updateCount = changes.filter(c => c.type === 'update').length;
        const noChangeCount = changes.filter(c => c.type === 'no_change' && c.key !== 'unknown').length;
        const skippedCount = changes.filter(c => c.key === 'unknown').length;
        log.info(`📊 Update Summary:`);
        log.info(`   - Rows Processed from CSV: ${csvRows.length}`);
        log.info(`   - Matched & Updated: ${updateCount}`);
        log.info(`   - Matched & No Change: ${noChangeCount}`);
        log.info(`   - Skipped (No matching ID found): ${skippedCount}`);
        // Note: 'added' and 'removed' counts from diffCanonical reflect full state changes,
        // while 'changes' from updateFromCsv reflects row-by-row processing.

        if (hasChanges) {
            log.verbose(`[canonicalize.ts] ENTERED if(hasChanges) block.`);
            log.info(`❗️ Overall state changes detected:`);
            log.info(`   - Entities Added (Overall): ${diffResult.added.length}`);
            log.info(`   - Entities Removed (Overall): ${diffResult.removed.length}`);
            log.info(`   - Entities Changed (Overall): ${diffResult.changedCount}`);

            if (opts.dryRun) {
                log.info(`🚫 Dry Run: Skipping file writes.`);
                // Optionally print more detailed change summary for dry run
                 if (opts.verbose) {
                    log.verbose("Detailed Changes (Dry Run):");
                    changes.forEach(change => {
                        if (change.type === 'update') {
                            log.verbose(`  [UPDATE] Key: ${change.key}`);
                             // Optionally print diff if available and verbose
                             // if(change.diff) console.log(JSON.stringify(change.diff, null, 2));
                        } else if (change.key === 'unknown') {
                             log.warn(`  [SKIPPED CSV ROW] DisplayName: ${change.after?.displayName || 'N/A'}`);
                        }
                    });
                }
            } else {
                if (opts.verbose) {
                    log.verbose(`Object to be written contains ${updatedCanonicalExport.ContactEntities.length} ContactEntities.`); 
                }
                log.info(`💾 Writing updated canonical JSON to: ${opts.out}`);
                await fs.outputJson(opts.out, updatedCanonicalExport, { spaces: 2 }); 
                log.info(`✅ Successfully wrote JSON.`);
                
                const logDir = path.resolve("logs");
                const logFileName = `diff-update-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const logPath = path.join(logDir, logFileName);
                log.info(`📝 Writing detailed update change log to: ${logPath}`);
                // Log the 'changes' array from updateFromCsv for more specific update details
                await fs.outputJson(logPath, { summary: diffResult, details: changes }, { spaces: 2 }); 
                log.info(`✅ Successfully wrote detailed log.`);
            }

            if (opts.failOnDiff) {
                log.error("Exiting with code 1 due to detected changes (--fail-on-diff specified).");
                process.exit(1);
            }
        } else {
            log.verbose(`[canonicalize.ts] ENTERED else block (no changes).`);
            log.info("✅ No changes detected after update process.");
        }
        log.info("✨ Update process complete.");
        return; // Exit after update
    }

    // --- Default Mode: Just Validate ---    
    log.info("✨ Validation of live canonical data complete. No update or export requested.");

  } catch (error: any) {
    log.error("An unexpected error occurred:");
    log.error(error.stack || error.message || error);
    process.exit(1);
  }
}

main();
