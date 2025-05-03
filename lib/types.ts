// lib/types.ts

// Type for raw data parsed from Office365 CSV
export type RawOfficeCsvRow = {
  "Display Name"?: string; // Allow undefined after trim/parse
  "Mobile Phone"?: string;
  "Object ID"?: string;
  "User Principal Name"?: string;
  "Title"?: string;
  "Department"?: string;
}; 