// lib/parseCsv.ts
import fs from "fs";
import { parse, ParserHeaderTransformFunction } from "fast-csv"; // Import necessary types
import { RawOfficeCsvRow } from "./types.js"; // Import shared type

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

// Helper to normalize header keys (e.g., to lowercase and trim)
const normalizeHeaders: ParserHeaderTransformFunction = (headers: (string | null | undefined)[]): (string | null | undefined)[] => {
    return headers.map(header => header?.toLowerCase()?.trim() ?? header);
};

export async function parseCsv(path: string): Promise<RawOfficeCsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: RawOfficeCsvRow[] = [];
    fs.createReadStream(path)
      .pipe(parse({ 
          headers: normalizeHeaders, // Normalize headers before parsing
          renameHeaders: true // Use normalized headers as keys in the data object
       }))
      .on("data", (data: Record<string, string | undefined>) => { // Allow undefined values from CSV
        // Extract data using the normalized (lowercase) keys
        const displayName = data["display name"]?.trim() || undefined;
        const mobilePhone = data["mobile phone"]?.trim() || undefined;
        const objectId = data["object id"]?.trim() || undefined;
        const userPrincipalName = data["user principal name"]?.trim() || undefined;
        const title = data["title"]?.trim() || undefined;
        const department = data["department"]?.trim() || undefined;

        // Push object conforming to RawOfficeCsvRow type (with lowercase keys)
        results.push({
          "display name": displayName,
          "mobile phone": mobilePhone,
          "object id": objectId,
          "user principal name": userPrincipalName,
          "title": title,
          "department": department,
        });
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
} 