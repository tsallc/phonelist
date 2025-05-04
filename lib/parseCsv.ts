// lib/parseCsv.ts
import fs from "fs";
import { parse, ParserHeaderTransformFunction } from "fast-csv";
import { RawOfficeCsvRow } from "./types.js";

/* // Removed local type definition
type RawOfficeCsvRow = {
  "Display Name"?: string; // Make optional to allow undefined
  "Mobile Phone"?: string;
  "Object ID"?: string;
  "User Principal Name"?: string;
  "Title"?: string;
  "Department"?: string;
};
*/

// --- Shared Key Normalization & Sanitation --- 
function normalizeKey(key: string | undefined | null): string {
  // Ensure input is a string, remove BOM, replace NBSP, trim, AND lowercase
  return key?.toString()
    .replace(/\uFEFF/g, "")  // Remove BOM
    .replace(/\u00A0/g, " ") // Replace Non-Breaking Space with regular space
    .trim() // Trim leading/trailing standard whitespace
    .toLowerCase() // Add lowercase normalization
    ?? ""; 
}

// --- Build the Canonical Header Map using Normalized Keys --- 
const buildCanonicalHeaderMap = (): Record<string, keyof RawOfficeCsvRow> => {
  const map: Record<string, keyof RawOfficeCsvRow> = {};
  // Define canonical target -> array of possible input variations
  const mappings: [keyof RawOfficeCsvRow, string[]][] = [
    ["user principal name", ["User Principal Name", "UserPrincipalName"]],
    ["display name", ["Display Name", "DisplayName"]],
    ["mobile phone", ["Mobile Phone", "MobilePhone"]],
    ["object id", ["Object ID", "ObjectId"]],
    ["title", ["Title"]], 
    ["department", ["Department"]]
  ];

  for (const [canonicalKey, variations] of mappings) {
    // Ensure the canonical key itself maps to itself (already normalized)
    map[canonicalKey] = canonicalKey;
    for (const variation of variations) {
      const normalizedVariation = normalizeKey(variation);
      if (normalizedVariation && normalizedVariation !== canonicalKey) { // Avoid redundant self-mapping
        map[normalizedVariation] = canonicalKey; 
        // console.log(`DEBUG [buildMap]: Added map['${normalizedVariation}'] = '${canonicalKey}'`);
      }
    }
  }
  // console.log("Built Canonical Header Map:", map); // Optional: Log map once
  return map;
};

const canonicalHeaderMap = buildCanonicalHeaderMap();

// Function to apply the canonical mapping using the normalized key
const canonicalizeHeaderKey = (originalKey: string | undefined | null): keyof RawOfficeCsvRow | null => {
    const normalizedKeyStr = normalizeKey(originalKey);
    if (!normalizedKeyStr) return null;
    // Look up the NORMALIZED key in the map
    const canonicalKey = canonicalHeaderMap[normalizedKeyStr];
    return canonicalKey || null; 
};

export async function parseCsv(path: string): Promise<RawOfficeCsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: RawOfficeCsvRow[] = [];
    let rowCount = 0; 
    fs.createReadStream(path)
      .pipe(parse({ headers: true }))
      .on("data", (originalData: Record<string, string | undefined>) => { 
        rowCount++; 
        
        const canonicalData: Partial<RawOfficeCsvRow> = {}; 
        
        // Log Headers and Map Lookup for first row
        if (rowCount === 1) {
            console.log(`DEBUG [parseCsv.ts] ----- Header Processing -----`);
        }
        for (const originalKey in originalData) {
            if (originalData.hasOwnProperty(originalKey)) {
                const normalizedKey = normalizeKey(originalKey);
                const canonicalKey = canonicalizeHeaderKey(originalKey);

                if (rowCount === 1) { 
                    const rawCodes = [...originalKey].map(c => c.charCodeAt(0));
                    const normalizedCodes = [...normalizedKey].map(c => c.charCodeAt(0));
                    const mapHasNormalizedKey = canonicalHeaderMap.hasOwnProperty(normalizedKey);
                    
                    console.log(`  Original Key: '${originalKey}'`);
                    console.log(`    Raw Codes:      [${rawCodes.join(', ')}]`);
                    console.log(`    Normalized Key: '${normalizedKey}'`);
                    console.log(`    Norm. Codes:    [${normalizedCodes.join(', ')}]`);
                    console.log(`    Map Hit:        ${mapHasNormalizedKey ? '✅' : '❌'}`);
                    console.log(`    Mapped To:      '${canonicalKey}'`);
                }

                if (canonicalKey) { 
                    canonicalData[canonicalKey] = originalData[originalKey]?.trim(); 
                }
            }
        }
        if (rowCount === 1) { 
             console.log(`DEBUG [parseCsv.ts] ----- End Header Processing -----`);
             console.log(`DEBUG [parseCsv.ts] Manually Canonicalized data object:`, JSON.stringify(canonicalData, null, 2));
         }

        // Extract data (now uses canonicalData which has correct keys)
        const objectId = canonicalData["object id"] || undefined;
        // Enforcement: Check for required ObjectId
        if (!objectId) {
            return reject(new Error(`Missing or empty required field 'Object ID' in CSV row number ${rowCount}. Original row data: ${JSON.stringify(originalData)}`));
        }

        // Create final object, converting empty strings to undefined
        const finalObject: RawOfficeCsvRow = {
          "display name": canonicalData["display name"] === "" ? undefined : canonicalData["display name"],
          "mobile phone": canonicalData["mobile phone"] === "" ? undefined : canonicalData["mobile phone"],
          "object id": objectId, // Already checked
          "user principal name": canonicalData["user principal name"] === "" ? undefined : canonicalData["user principal name"],
          "title": canonicalData["title"] === "" ? undefined : canonicalData["title"],
          "department": canonicalData["department"] === "" ? undefined : canonicalData["department"],
        };

        if (rowCount === 1) { 
            console.log(`DEBUG [parseCsv.ts] Final object pushed:`, JSON.stringify(finalObject, null, 2));
        }

        results.push(finalObject);
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
} 