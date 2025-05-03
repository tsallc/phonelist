// scripts/canonicalize.ts
import { Command } from "commander";
import fs from "fs-extra";
import path from "path"; // Import path for resolving paths
import { parseCsv } from "../lib/parseCsv.js";
import { toCanonical } from "../lib/toCanonical.js";
import { validateCanonical } from "../lib/validate.js";
import { diffCanonical, DiffResult } from "../lib/diff.js"; // Import DiffResult type
import { computeHash } from "../lib/hash.js";
import { exportCsv } from "../lib/exportCsv.js";
import { CanonicalExport } from "../lib/schema.js"; // Import CanonicalExport type
import { updateFromJson } from "../lib/updateFromJson.js"; // Import for new logic

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
        const rawUpdateRows = await parseCsv(opts.updateFromCsv);
        console.log(`🔍 Parsed ${rawUpdateRows.length} rows from update CSV.`);
        
        console.log(`⚙️  Performing selective update...`);
        const updatedLiveData = updateFromJson(liveData, rawUpdateRows, opts.verbose);
        
        console.log(`🛡️  Validating updated data structure...`);
        const updateValidation = validateCanonical(updatedLiveData);
        if (!updateValidation.success) {
            console.error("❌ Updated data validation failed:");
            updateValidation.errors?.forEach(err => console.error(`   - ${err}`))
            process.exit(1); // Don't proceed if update broke validation
        }
        console.log(`✅ Updated data validation successful.`);

        console.log(`🧮 Computing hash of updated data...`);
        const newHash = computeHash(updatedLiveData.ContactEntities, updatedLiveData.Locations);
        updatedLiveData._meta.hash = newHash; // Update hash in the object
        // TODO: Consider updating generatedFrom and generatedAt in _meta?
        console.log(`   - New Hash: ${newHash}`);

        console.log(`🔄 Comparing updated data with original live version...`);
        const diffResult = diffCanonical(liveData, updatedLiveData); // Compare original vs updated
        const hasChanges = liveData._meta.hash !== newHash; // Compare hashes

        if (hasChanges) {
            console.log(`❗️ Changes detected by update:`);
            console.log(`   - Added: ${diffResult?.added.length ?? 'N/A'}`);
            console.log(`   - Removed: ${diffResult?.removed.length ?? 'N/A'}`);
            console.log(`   - Changed: ${diffResult?.changedCount ?? 'N/A'}`);

            if (opts.dryRun) {
                console.log(`🚫 Dry Run: Skipping file writes.`);
            } else {
                if (opts.verbose) {
                    console.log(`DEBUG: Object to be written contains ${updatedLiveData.ContactEntities.length} ContactEntities.`); 
                }
                console.log(`💾 Writing updated canonical JSON to: ${opts.out}`);
                await fs.outputJson(opts.out, updatedLiveData, { spaces: 2 }); 
                console.log(`✅ Successfully wrote JSON.`);
                
                const logDir = path.resolve("logs");
                const logFileName = `diff-update-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const logPath = path.join(logDir, logFileName);
                console.log(`📝 Writing update diff log to: ${logPath}`);
                await fs.outputJson(logPath, diffResult ?? {}, { spaces: 2 }); 
                console.log(`✅ Successfully wrote diff log.`);
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
