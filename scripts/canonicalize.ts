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

const program = new Command();

program
  .option("-c, --csv <path>", "Path to input Office365 CSV file")
  .option("-j, --json <path>", "Path to existing canonical JSON (required for --export-csv)", "src/data/canonicalContactData.json")
  .option("-o, --out <path>", "Output path for canonical JSON", "src/data/canonicalContactData.json")
  .option("-e, --export-csv <path>", "Optional: Export canonical JSON back to Office365 CSV format at specified path")
  .option("-f, --fail-on-diff", "Exit with code 1 if changes are detected compared to existing JSON", false)
  .option("-d, --dry-run", "Perform all steps except writing output files", false)
  .version("1.0.0") // Add a version
  .description("Processes Office365 CSV into canonical JSON, validates, diffs, and optionally exports back to CSV.");

program.parse(process.argv);
const opts = program.opts();

async function main() {
  try {
    // --- Reverse Export Mode ---    
    if (opts.exportCsv) {
        if (!opts.json || !fs.existsSync(opts.json)) {
            console.error(`❌ Error: Existing canonical JSON file not found at specified path: ${opts.json}`);
            console.error(`       Please provide a valid path using --json <path> for export mode.`);
            process.exit(1);
        }
        console.log(`🔄 Reading canonical data from: ${opts.json}`);
        const canonicalData: CanonicalExport = await fs.readJson(opts.json);
        
        console.log(`📤 Exporting to CSV format at: ${opts.exportCsv}`);
        await exportCsv(canonicalData.ContactEntities, opts.exportCsv);
        console.log(`✅ Successfully exported CSV to: ${opts.exportCsv}`);
        return; // Exit after export
    }

    // --- Standard Processing Mode ---    
    if (!opts.csv || !fs.existsSync(opts.csv)) {
      console.error(`❌ Error: Input CSV file not found at specified path: ${opts.csv}`);
      console.error(`       Please provide a valid path using --csv <path>.`);
      process.exit(1);
    }

    console.log(`📄 Reading CSV data from: ${opts.csv}`);
    const rawRows = await parseCsv(opts.csv);
    console.log(`🔍 Parsed ${rawRows.length} rows from CSV.`);

    console.log(`⚙️  Transforming data to canonical format...`);
    const newCanonicalData = toCanonical(rawRows, path.basename(opts.csv)); // Pass only basename

    console.log(`🛡️  Validating canonical data structure...`);
    const validation = validateCanonical(newCanonicalData);
    if (!validation.success) {
      console.error("❌ Validation failed:");
      validation.errors?.forEach(err => console.error(`   - ${err}`))
      process.exit(1);
    }
    console.log(`✅ Validation successful.`);

    console.log(`🧮 Computing hash...`);
    const newHash = computeHash(newCanonicalData.ContactEntities, newCanonicalData.Locations);
    newCanonicalData._meta.hash = newHash;
    console.log(`   - Hash: ${newHash}`);

    console.log(`⏳ Loading previous canonical data (if exists) from: ${opts.out}`);
    let previousCanonicalData: CanonicalExport | null = null;
    try {
        if (fs.existsSync(opts.out)) {
            previousCanonicalData = await fs.readJson(opts.out);
            console.log(`   - Found previous data with hash: ${previousCanonicalData?._meta?.hash ?? 'N/A'}`);
        } else {
            console.log(`   - No previous data file found.`);
        }
    } catch (err: any) {
        console.warn(`⚠️ Warning: Could not read or parse previous JSON file at ${opts.out}. Assuming no previous data. Error: ${err.message}`);
        previousCanonicalData = null;
    }

    console.log(`🔄 Comparing current data with previous version...`);
    const diffResult: DiffResult | null = diffCanonical(previousCanonicalData, newCanonicalData);
    
    // Explicitly check if previous data exists for change detection
    let hasChanges: boolean;
    if (!previousCanonicalData) {
        console.log("   - No previous data found, considering all current data as added.");
        hasChanges = true; // No previous file means definite changes
    } else {
        // Compare hashes only if previous data exists
        console.log(`   - Comparing new hash (${newHash}) with previous hash (${previousCanonicalData._meta.hash}).`);
        hasChanges = previousCanonicalData._meta.hash !== newHash;
    }

    if (hasChanges) {
      console.log(`❗️ Changes detected:`);
      console.log(`   - Added: ${diffResult?.added.length ?? 'N/A'}`);
      console.log(`   - Removed: ${diffResult?.removed.length ?? 'N/A'}`);
      console.log(`   - Changed: ${diffResult?.changedCount ?? 'N/A'}`);
      
      if (opts.dryRun) {
        console.log(`🚫 Dry Run: Skipping file writes.`);
      } else {
        // Write the main JSON output
        console.log(`DEBUG: Object to be written contains ${newCanonicalData.ContactEntities.length} ContactEntities.`); 
        
        console.log(`💾 Writing updated canonical JSON to: ${opts.out}`);
        await fs.outputJson(opts.out, newCanonicalData, { spaces: 2 }); 
        console.log(`✅ Successfully wrote JSON.`);
        
        // Write the diff log
        const logDir = path.resolve("logs"); // Ensure logs directory path
        const logFileName = `diff-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const logPath = path.join(logDir, logFileName);
        console.log(`📝 Writing diff log to: ${logPath}`);
        await fs.outputJson(logPath, diffResult ?? {}, { spaces: 2 }); // Ensure diffResult is not null when writing log 
        console.log(`✅ Successfully wrote diff log.`);
      }

      if (opts.failOnDiff) {
        console.error("❌ Exiting with code 1 due to detected changes (--fail-on-diff specified).");
        process.exit(1);
      }
    } else {
      console.log("✅ No changes detected compared to previous data.");
    }

    console.log("✨ Canonicalization process complete.");

  } catch (error: any) {
    console.error("❌ An unexpected error occurred during canonicalization:");
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

main();
