// lib/schema.ts
import { z } from "zod";

// Zod Schemas
export const ContactPointSchema = z.object({
  type: z.literal("mobile"),
  value: z.string(),
  source: z.literal("Office365"),
});

export const RoleSchema = z.object({
  office: z.literal("UNK"),
  title: z.string().nullable(),
  priority: z.literal(1),
});

export const ContactEntitySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  contactPoints: z.array(ContactPointSchema),
  roles: z.array(RoleSchema),
  objectId: z.string().optional(),
  upn: z.string().optional(),
  department: z.string().nullable().optional(),
  source: z.literal("Office365"),
});

export const LocationSchema = z.never(); // No location data in Phase 1

export const CanonicalMetaSchema = z.object({
  generatedFrom: z.array(z.string()),
  generatedAt: z.string(),
  version: z.literal(1),
  hash: z.string(),
});

export const CanonicalExportSchema = z.object({
  ContactEntities: z.array(ContactEntitySchema),
  Locations: z.array(LocationSchema), // Always empty in Phase 1
  _meta: CanonicalMetaSchema,
});

// TypeScript Types derived from Zod schemas
export type ContactPoint = z.infer<typeof ContactPointSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type ContactEntity = z.infer<typeof ContactEntitySchema>;
export type CanonicalMeta = z.infer<typeof CanonicalMetaSchema>;
export type CanonicalExport = z.infer<typeof CanonicalExportSchema>; 