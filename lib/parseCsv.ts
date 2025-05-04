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
    ["title", ["Title"]], // Assumes Title is consistent
    ["department", ["Department"]] // Assumes Department is consistent
  ];

  for (const [canonicalKey, variations] of mappings) {
    for (const variation of variations) {
      const normalizedVariation = normalizeKey(variation);
      if (normalizedVariation) { // Only add if normalized key is non-empty
        // Also map the already canonical key to itself
        map[canonicalKey] = canonicalKey;
        map[normalizedVariation] = canonicalKey; 
      }
    }
  }
  // Log the final map once during build for verification (optional)
  // console.log("Built Canonical Header Map:", map);
  return map;
};

const canonicalHeaderMap = buildCanonicalHeaderMap();

// Function to apply the canonical mapping using the normalized key
const canonicalizeHeaderKey = (originalKey: string | undefined | null): keyof RawOfficeCsvRow | null => {
    const normalizedKeyStr = normalizeKey(originalKey);
    if (!normalizedKeyStr) return null;
    // Look up the NORMALIZED key in the map
    const canonicalKey = canonicalHeaderMap[normalizedKeyStr];
    // if (!canonicalKey) { // Log unmapped headers
    //     console.warn(`[parseCsv] Unmapped header encountered: raw='${originalKey}', normalized='${normalizedKeyStr}'`);
    // }
    return canonicalKey || null; 
};

// REMOVED transformHeaders wrapper function

export async function parseCsv(path: string): Promise<RawOfficeCsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: RawOfficeCsvRow[] = [];
    let rowCount = 0; 
    fs.createReadStream(path)
      .pipe(parse({ headers: true }))
      .on("data", (originalData: Record<string, string | undefined>) => { 
        rowCount++; 
        
        const canonicalData: Partial<RawOfficeCsvRow> = {}; 
        
        // --- Log Original Keys and Mapping Attempt --- 
        if (rowCount === 1) {
            console.log(`DEBUG [parseCsv.ts] ----- Header Processing for First Row -----`);
        }
        for (const originalKey in originalData) {
            if (originalData.hasOwnProperty(originalKey)) {
                const normalizedOriginalKey = normalizeKey(originalKey);
                const canonicalKey = canonicalizeHeaderKey(originalKey); // Use the function that internally normalizes

                if (rowCount === 1) { // Log details only for the first row's headers
                    const rawCodes = [...originalKey].map(c => c.charCodeAt(0));
                    const trimmedCodes = [...originalKey.trim()].map(c => c.charCodeAt(0)); // Check basic trim
                    const normalizedCodes = [...normalizedOriginalKey].map(c => c.charCodeAt(0));
                    const mapHasNormalizedKey = canonicalHeaderMap.hasOwnProperty(normalizedOriginalKey);
                    
                    console.log(`  Original Key: '${originalKey}'`);
                    console.log(`    Raw Codes:      [${rawCodes.join(', ')}]`);
                    // console.log(`    Trimmed Codes:  [${trimmedCodes.join(', ')}]`); // Optional: See if trim changes anything
                    console.log(`    Normalized Key: '${normalizedOriginalKey}'`);
                    console.log(`    Norm. Codes:    [${normalizedCodes.join(', ')}]`);
                    console.log(`    Map Has NormKey: ${mapHasNormalizedKey ? '✅' : '❌'}`);
                    console.log(`    Mapped To:      '${canonicalKey}'`);
                }
                // --- End Log --- 

                if (canonicalKey) { 
                    const valueToAssign = originalData[originalKey]?.trim();
                    // --- DEBUG: Log Assignment --- 
                    if(rowCount === 1) {
                         console.log(`DEBUG [parseCsv.ts] Assigning to canonicalData['${canonicalKey}'] value: '${valueToAssign}'`);
                    }
                    // --- End DEBUG ---
                    canonicalData[canonicalKey] = valueToAssign; 
                }
            }
        }
        if (rowCount === 1) { 
             console.log(`DEBUG [parseCsv.ts] ----- End Header Processing -----`);
             console.log(`DEBUG [parseCsv.ts] Manually Canonicalized data object:`, JSON.stringify(canonicalData, null, 2));
         }

        // Extract data directly from the canonicalData object, converting empty strings to undefined
        const displayName = canonicalData["display name"] || undefined;
        const mobilePhone = canonicalData["mobile phone"] || undefined;
        const objectId = canonicalData["object id"] || undefined;
        const userPrincipalName = canonicalData["user principal name"] || undefined;
        const title = canonicalData["title"] || undefined; 
        const department = canonicalData["department"] || undefined;

        // Re-create the object for pushing, ensuring empty strings are undefined
        const finalObject: RawOfficeCsvRow = {
          "display name": displayName === "" ? undefined : displayName,
          "mobile phone": mobilePhone === "" ? undefined : mobilePhone,
          "object id": objectId === "" ? undefined : objectId,
          "user principal name": userPrincipalName === "" ? undefined : userPrincipalName,
          "title": title === "" ? undefined : title,
          "department": department === "" ? undefined : department,
        };

        // --- DEBUG: Log extracted values before push ---
        if (rowCount === 1) { 
            console.log(`DEBUG [parseCsv.ts] Extracted values: displayName=${finalObject["display name"] }, mobilePhone=${finalObject["mobile phone"] }, objectId=${finalObject["object id"] }, userPrincipalName=${finalObject["user principal name"] }, title=${finalObject["title"] }, department=${finalObject["department"] }`);
        }
        // --- End DEBUG ---

        // --- Enforcement: Check for required ObjectId --- 
        if (!objectId) { // Check if objectId (extracted using canonical key) is missing or empty
             // Throw an error instead of just warning
            // Include the row number for better context if possible (rowCount is available)
            return reject(new Error(`Missing or empty required field 'Object ID' in CSV row number ${rowCount}. Original row data: ${JSON.stringify(originalData)}`));
        }
        // --- End Enforcement ---

        // Push the final object with canonical keys 
        results.push(finalObject);
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
} 