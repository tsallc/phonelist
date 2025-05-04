// scripts/canonicalize.ts
/**
 * @file scripts/canonicalize.ts
 * @description CLI script to validate, export, and potentially update
 *              the canonical contact data JSON file.
 *              Serves as a stop-gap utility for O365 CSV sync.
 */
import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { parseCsv } from "../lib/parseCsv.js";
import { toCanonical } from "../lib/toCanonical.js";
import { validateCanonical } from "../lib/validate.js";
import { diffCanonical, DiffResult, diff } from "../lib/diff.js";
import { computeHash } from "../lib/hash.js";
import { exportCsv } from "../lib/exportCsv.js";
import { CanonicalExport, ContactEntity } from "../lib/schema.js";
import { updateFromCsv, ChangeSummary } from "../lib/updateFromJson.js";
import { log, setVerbose } from "../lib/logger.js";

const program = new Command();

program
  .option("-j, --json <path>", "Path to the LIVE canonical JSON file", "src/data/canonicalContactData.json")
  .option("-o, --out <path>", "Output path for updated canonical JSON (used by --update-from-csv)", "src/data/canonicalContactData.json")
  .option("-u, --update-from-csv <path>", "Path to NEW Office365 CSV to selectively update the live JSON file")
  .option("-e, --export-csv <path>", "Export the live JSON data to Office365 CSV format at specified path")
  .option("-f, --fail-on-diff", "Exit with code 1 if --update-from-csv causes changes", false)
  .option("-d, --dry-run", "Perform --update-from-csv checks without writing output file", false)
  .option("-v, --verbose", "Enable verbose debug logging", false)
  .version("1.1.0")
  .description("Validates, exports, or selectively updates the live canonical JSON contact data.");

program.parse(process.argv);
const opts = program.opts<{
  json: string;
  out: string;
  updateFromCsv?: string;
  exportCsv?: string;
  failOnDiff: boolean;
  dryRun: boolean;
  verbose: boolean;
}>();

setVerbose(opts.verbose || false);

async function main() {
  try {
    if (!opts.json || !fs.existsSync(opts.json)) {
      log.error(`Live canonical JSON file not found at path: ${opts.json}`);
      process.exit(1);
    }
    log.info(`Loading live canonical data from: ${opts.json}`);
    let liveData: CanonicalExport;
    try {
      liveData = await fs.readJson(opts.json);
    } catch (err: any) {
      log.error(`Error parsing live canonical JSON file: ${err.message}`);
      process.exit(1);
    }

    const metaHash = liveData._meta?.hash;
    if (metaHash) {
      log.warn('meta.hash field detected in source input — ignoring for diff calculation.');
    }
    log.verbose(`[canonicalize.ts] Hash from _meta (will be ignored for comparison): ${metaHash}`);

    const initialComputedHash = computeHash(
      JSON.parse(JSON.stringify(liveData.ContactEntities)),
      JSON.parse(JSON.stringify(liveData.Locations)),
      "Initial"
    );
    log.verbose(`[canonicalize.ts] Computed initial hash (Post Copy): ${initialComputedHash}`);

    log.info(`Validating structure of loaded live data...`);
    const validation = validateCanonical(liveData);
    if (!validation.success) {
      log.error("Live data validation failed:");
      validation.errors?.forEach(err => log.error(`   - ${err}`));
      if (!opts.exportCsv) process.exit(1);
      log.warn("Live data failed validation, export may be incomplete/incorrect.");
    } else {
      log.info(`Live data validation successful.`);
    }

    if (opts.exportCsv) {
      log.info(`Exporting live data to CSV format at: ${opts.exportCsv}`);
      await exportCsv(liveData.ContactEntities, opts.exportCsv);
      log.info(`Successfully exported CSV to: ${opts.exportCsv}`);
      return;
    }

    if (opts.updateFromCsv) {
      if (!fs.existsSync(opts.updateFromCsv)) {
        log.error(`Input CSV file for update not found at path: ${opts.updateFromCsv}`);
        process.exit(1);
      }
      log.info(`Reading CSV data for update from: ${opts.updateFromCsv}`);
      const csvRows: Record<string, any>[] = await parseCsv(opts.updateFromCsv);
      log.info(`Parsed ${csvRows.length} rows from update CSV.`);

      if (csvRows.length > 0) {
        log.verbose("[canonicalize.ts] First parsed CSV row:", JSON.stringify(csvRows[0], null, 2));
      }

      log.info(`Performing selective update using updateFromCsv...`);
      let updatedEntities: ContactEntity[];
      let changes: ChangeSummary[];
      try {
        const result = updateFromCsv(csvRows, liveData.ContactEntities);
        updatedEntities = result.updated;
        changes = result.changes;
      } catch (validationError: any) {
        log.error(`Error during updateFromCsv execution (likely validation failure):`);
        log.error(validationError.message || validationError);
        process.exit(1);
      }

      const updatedCanonicalExport: CanonicalExport = {
        ...liveData,
        ContactEntities: updatedEntities,
      };

      log.info(`Validating updated data structure...`);
      const updateValidation = validateCanonical(updatedCanonicalExport);
      if (!updateValidation.success) {
        log.error("Updated data validation failed:");
        updateValidation.errors?.forEach(err => log.error(`   - ${err}`));
        process.exit(1);
      }
      log.info(`Updated data validation successful.`);

      log.verbose("[canonicalize.ts] Object being passed to computeHash(..., \"Updated\"):", JSON.stringify(updatedCanonicalExport, null, 2));

      log.info(`Computing hash of updated data...`);
      const newHash = computeHash(
        JSON.parse(JSON.stringify(updatedCanonicalExport.ContactEntities)),
        JSON.parse(JSON.stringify(updatedCanonicalExport.Locations)),
        "Updated"
      );

      log.info(`   - New Hash: ${newHash}`);

      log.info(`Comparing updated data with original live version...`);
      const diffResult = diffCanonical(liveData, updatedCanonicalExport);
      const originalHashForCompare = initialComputedHash;
      log.verbose(`[canonicalize.ts] Comparing Hashes: Initial='${originalHashForCompare}' New='${newHash}'`);
      const hasChanges = originalHashForCompare !== newHash;
      log.verbose(`[canonicalize.ts] Hash Checkpoint 4: hasChanges = ${hasChanges}`);

      const updateCount = changes.filter(c => c.type === 'update').length;
      const noChangeCount = changes.filter(c => c.type === 'no_change').length;
      const finalNoChangeCount = noChangeCount;

      log.info(`Update Summary:`);
      log.info(`   - Rows Processed from CSV: ${csvRows.length}`);
      log.info(`   - Matched & Updated: ${updateCount}`);
      log.info(`   - Matched & No Change: ${finalNoChangeCount}`);

      if (hasChanges) {
        updatedCanonicalExport._meta.hash = newHash;
        updatedCanonicalExport._meta.generatedFrom = [...new Set([...liveData._meta.generatedFrom, `updateFromCsv: ${path.basename(opts.updateFromCsv)}`])];
        updatedCanonicalExport._meta.generatedAt = new Date().toISOString();

        log.verbose("--> Preparing to log: Overall state changes detected:");
        log.info('Overall state changes detected:');

        if (opts.dryRun) {
          log.info(`Dry Run: Skipping file writes.`);
          if (opts.verbose) {
            log.verbose("Detailed Changes (Dry Run):");
            changes.forEach(change => {
              if (change.type === 'update') {
                log.verbose(`  [UPDATE] Key: ${change.key}`);
                if (change.before && change.after) {
                  const specificDiff = diff(change.before as ContactEntity, change.after as ContactEntity);
                  if (Object.keys(specificDiff).length > 0) {
                    log.verbose(`    Changes: ${JSON.stringify(specificDiff, null, 2)}`);
                  } else {
                    log.verbose(`    (No significant field changes detected by diff)`);
                  }
                } else {
                  log.verbose(`    (Missing before/after state for diff)`);
                }
              } else if (change.key === 'unknown') {
                const skippedDisplayName = change.after?.displayName || 'N/A';
                log.warn(`  [SKIPPED CSV ROW] DisplayName: ${skippedDisplayName} not found in canonical data (ObjectID: ${change.after?.objectId || 'Missing'}).`);
              }
            });
          }
        } else {
          if (opts.verbose) {
            log.verbose(`Object to be written contains ${updatedCanonicalExport.ContactEntities.length} ContactEntities.`);
          }
          log.info(`Writing updated canonical JSON to: ${opts.out}`);
          await fs.outputJson(opts.out, updatedCanonicalExport, { spaces: 2 });
          log.info(`Successfully wrote JSON.`);

          const logDir = path.resolve("logs");
          const logFileName = `diff-update-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
          const logPath = path.join(logDir, logFileName);
          log.info(`Writing detailed update change log to: ${logPath}`);
          await fs.outputJson(logPath, { summary: diffResult, details: changes }, { spaces: 2 });
          log.info(`Successfully wrote detailed log.`);
        }

        if (opts.failOnDiff) {
          log.error("Exiting with code 1 due to detected changes (--fail-on-diff specified).");
          process.exit(1);
        }
        log.info('Update process complete.');

      } else {
        log.verbose("--> Preparing to log: No changes detected");
        log.info('No changes detected after update process.');
        log.info('Update process complete.');
      }

      return;
    }

    log.info("Default action: Validation complete.");

  } catch (err: any) {
    log.error(`Error during execution: ${err.message}`);
    if (err.stack && opts.verbose) {
      log.error("Stack Trace:", err.stack);
    }
    process.exit(1);
  }
}

main();