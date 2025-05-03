// lib/exportCsv.ts
/**
 * @module lib/exportCsv
 * @description Exports canonical contact data to an O365-compatible CSV format.
 */
import fs from "fs";
import { ContactEntity, ContactPoint } from "./schema.js";
import { format } from "fast-csv";

/**
 * Writes an array of ContactEntity objects to a CSV file suitable for O365 import.
 * @param entities The array of ContactEntity objects (typically from the live canonical JSON).
 * @param outPath The file path for the output CSV.
 * @returns A promise that resolves when writing is complete.
 */
export async function exportCsv(entities: ContactEntity[], outPath: string): Promise<void> {
  // Filter entities: O365 typically only manages internal users/resources originally synced or added.
  // Keeping 'Merged' might be useful if O365 needs to know about previously merged attributes.
  const filtered = entities.filter(e => e.source === "Office365" || e.source === "Merged");

  const rows = filtered.map(e => ({
    // Mapping assumes O365 import uses these specific header names
    "Display Name": e.displayName,
    // Assumption: Export the *first* mobile contact point found.
    "Mobile Phone": e.contactPoints.find((cp: ContactPoint) => cp.type === "mobile")?.value ?? "",
    "Object ID": e.objectId ?? "",
    "User Principal Name": e.upn ?? "",
    // Assumption: Export the title from the *first* role listed.
    "Title": e.roles[0]?.title ?? "",
    "Department": e.department ?? "",
  }));

  // Use fast-csv to write the data with headers
  return new Promise<void>((resolve, reject) => {
    const csvStream = format({ headers: true });
    const fileStream = fs.createWriteStream(outPath);

    csvStream.pipe(fileStream)
      .on("error", (err) => reject(err))
      .on("finish", () => resolve());

    rows.forEach(row => csvStream.write(row));
    csvStream.end();
  });
} 