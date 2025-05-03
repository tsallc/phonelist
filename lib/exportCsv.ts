// lib/exportCsv.ts
import fs from "fs";
import { ContactEntity, ContactPoint } from "./schema.js";
import { format } from "fast-csv";

export async function exportCsv(entities: ContactEntity[], outPath: string): Promise<void> {
  // In Phase 1, source will always be Office365, but keep filter for future phases
  const filtered = entities.filter(e => e.source === "Office365" || e.source === "Merged");

  const rows = filtered.map(e => ({
    "Display Name": e.displayName,
    // Find the first mobile contact point, if any
    "Mobile Phone": e.contactPoints.find((cp: ContactPoint) => cp.type === "mobile")?.value ?? "",
    "Object ID": e.objectId ?? "",
    "User Principal Name": e.upn ?? "",
    // Use the title from the first role, if any
    "Title": e.roles[0]?.title ?? "",
    "Department": e.department ?? "",
  }));

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