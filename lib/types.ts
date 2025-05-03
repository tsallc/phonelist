// lib/types.ts

// Type for raw data parsed from Office365 CSV
// Keys MUST be lowercase to match normalized headers from fast-csv
export type RawOfficeCsvRow = {
  "display name"?: string; // Allow undefined after trim/parse
  "mobile phone"?: string;
  "object id"?: string;
  "user principal name"?: string;
  "title"?: string;
  "department"?: string;
}; 