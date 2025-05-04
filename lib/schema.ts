// lib/schema.ts
import { z } from "zod";
import { createHash } from "crypto"; // For default internal objectId

// Helper for default internal objectId
const generateInternalObjectId = (id: string) => `manual-${id}-${createHash("sha256").update(id).digest("hex").substring(0, 8)}`;

// Zod Schemas
export const ContactPointSchema = z.object({
  type: z.enum(["mobile", "desk-extension"]),
  value: z.string(),
  source: z.enum(["Office365", "App.jsx", "ArtifactCode.jsx"]),
});

export const RoleSchema = z.object({
  office: z.enum(["PLY", "FTL"]),
  title: z.string().nullable(),
  priority: z.number().int().min(1),
});

const DeskSchema = z.object({
    type: z.literal("desk-extension"),
    value: z.string(),
});

const RoomSchema = z.object({
    id: z.string(),
    desks: z.array(DeskSchema),
});

export const LocationSchema = z.object({
  id: z.enum(["PLY", "FTL"]),
  name: z.string(),
  rooms: z.array(RoomSchema).optional(),
});

export const CanonicalMetaSchema = z.object({
  generatedFrom: z.array(z.string()),
  generatedAt: z.string(),
  version: z.literal(1),
  hash: z.string().optional(),
});

// Base schema containing common fields
const BaseContactSchema = z.object({
  id: z.string().min(1), // Internal identifier (e.g., slug)
  displayName: z.string().min(1).optional(),
  contactPoints: z.array(ContactPointSchema).optional().default([]),
  roles: z.array(RoleSchema).optional().default([]),
  source: z.enum(["Office365", "App.jsx", "Merged", "ArtifactCode.jsx", "Manual"]), // Added Manual source?
  department: z.string().nullable().optional(),
  upn: z.string().email().optional(), // Optional for internal?
});

// Schema for external contacts (synced from O365)
const ExternalContactSchema = BaseContactSchema.extend({
  kind: z.literal("external"),
  objectId: z.string().min(1), // REQUIRED for external
  // upn might be considered required for external? z.string().email()
});

// Schema for internal contacts (shared resources, manual entries)
const InternalContactSchema = BaseContactSchema.extend({
  kind: z.literal("internal"),
  // objectId is still required, but generation logic is moved elsewhere (e.g., retrofit script)
  objectId: z.string().min(1), 
  // upn is likely not applicable/optional here
  upn: z.string().email().optional().nullable(),
});

// The main discriminated union schema
export const ContactEntitySchema = z.discriminatedUnion("kind", [
  ExternalContactSchema,
  InternalContactSchema
]);

export const CanonicalExportSchema = z.object({
  ContactEntities: z.array(ContactEntitySchema),
  Locations: z.array(LocationSchema),
  _meta: CanonicalMetaSchema,
});

// TypeScript Types derived from Zod schemas
export type ContactPoint = z.infer<typeof ContactPointSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Desk = z.infer<typeof DeskSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type ContactEntity = z.infer<typeof ContactEntitySchema>;
export type CanonicalMeta = z.infer<typeof CanonicalMetaSchema>;
export type CanonicalExport = z.infer<typeof CanonicalExportSchema>; 