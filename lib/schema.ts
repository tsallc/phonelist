// lib/schema.ts
import { z } from "zod";

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

export const ContactEntitySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  contactPoints: z.array(ContactPointSchema).optional().default([]),
  roles: z.array(RoleSchema).optional().default([]),
  objectId: z.string().optional(),
  upn: z.string().email().optional(),
  department: z.string().nullable().optional(),
  source: z.enum(["Office365", "App.jsx", "Merged", "ArtifactCode.jsx"]),
});

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