console.log("--- SCRIPT START ---");

import fs from "fs";
import path from "path";
import * as slugifyNs from "slugify"; // Use namespace import for potential CJS/ESM issues
import { createHash } from "crypto"; // For generating part of default ID

console.log("--- IMPORTS LOADED ---");

// Handle potential default export issues with slugify
const slugify = (slugifyNs as any).default ?? slugifyNs;

// Helper function compatible with schema's default generator
const generateInternalObjectId = (id: string | undefined | null): string => {
    const cleanId = id ? slugify(id, { lower: true, strict: true }) : `unknown-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
    // Use same hash logic as schema default for consistency, but based on slugified ID
    return `manual-${cleanId}-${createHash("sha256").update(cleanId).digest("hex").substring(0, 8)}`;
}

const filesToProcess = [
  "src/data/canonicalContactData.json",
  "src/data/reference_example.json"
];

console.log("--- STARTING LOOP --- Files:", filesToProcess);

for (const relativePath of filesToProcess) {
  const filePath = path.resolve(process.cwd(), relativePath);
  console.log(`--- Processing File: ${relativePath} (Resolved: ${filePath}) ---`);
  try {
    console.log(`  Attempting to read file...`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log(`  File read successfully. Length: ${fileContent.length}`);
    console.log(`  Attempting to parse JSON...`);
    const json = JSON.parse(fileContent);
    console.log(`  JSON parsed successfully.`);

    if (!json.ContactEntities || !Array.isArray(json.ContactEntities)) {
        console.warn(`  WARN: Skipping - missing or invalid ContactEntities array.`);
        continue;
    }
    console.log(`  Found ${json.ContactEntities.length} entities. Starting map...`);

    let updatedCount = 0;
    json.ContactEntities = json.ContactEntities.map((c: any, index: number) => {
        const originalKind = c.kind;
        const originalObjectId = c.objectId;

        // Determine the CORRECT kind based on objectId format
        const isLikelyManualObjectId = typeof originalObjectId === 'string' && originalObjectId.startsWith('manual-');
        const correctKind = isLikelyManualObjectId ? "internal" : "external";

        // Ensure objectId exists - generate if internal AND missing (shouldn't happen if previous step ran)
        let finalObjectId = originalObjectId;
        if (correctKind === 'internal' && !originalObjectId) {
            console.warn(`      WARN: Internal entity index ${index} (ID: ${c.id}) was missing objectId. Generating.`);
            finalObjectId = generateInternalObjectId(c.id ?? c.displayName);
        } else if (correctKind === 'external' && !originalObjectId) {
             // This is an error state according to our schema
             console.error(`      ERROR: External entity index ${index} (ID: ${c.id}) is missing required objectId! Setting to null.`);
             finalObjectId = null; // Or throw an error
        }

        // Check if changes are needed
        const changed = originalKind !== correctKind || originalObjectId !== finalObjectId;

        if (changed) {
            updatedCount++;
            console.log(`      Change detected for index ${index} (ID: ${c.id}): Kind ${originalKind} -> ${correctKind}, ObjId ${originalObjectId} -> ${finalObjectId}`);
        }

        return {
          ...c,
          objectId: finalObjectId, // Use the determined/validated objectId
          kind: correctKind // Use the correctly determined kind
        };
    });
    console.log(`  Mapping complete. ${updatedCount} entries flagged for update.`);

    if (updatedCount > 0) {
        console.log(`  Attempting to write file...`);
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
        console.log(`  Updated ${updatedCount} entries in: ${relativePath}`);
    } else {
        console.log(`  No entries needed updating in: ${relativePath}`);
    }

  } catch (error: any) {
      console.error(`  ERROR processing file ${relativePath}: ${error.message}`);
      console.error(error.stack);
  }
  console.log(`--- Finished File: ${relativePath} ---`);
}

console.log("--- SCRIPT END ---");

console.log("Retrofit process complete."); 