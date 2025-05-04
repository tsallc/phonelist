import { z } from 'zod';

// Schema Definition
// Use the same structure as the canonical data to ensure type safety
export const ContactPointSchema = z.object({
  type: z.string(),
  value: z.string(),
  source: z.string().optional()
});

export const RoleSchema = z.object({
  office: z.string(),
  brand: z.string().nullable(),
  title: z.string().nullable(),
  priority: z.number().default(1)
});

export const ContactEntitySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  contactPoints: z.array(ContactPointSchema).default([]),
  roles: z.array(RoleSchema).default([]),
  objectId: z.string().optional(),
  upn: z.string().optional(),
  department: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  source: z.string().optional(),
  kind: z.enum(['external', 'internal']).default('external')
});

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  rooms: z.array(
    z.object({
      id: z.string(),
      desks: z.array(
        z.object({
          type: z.string(),
          value: z.string()
        })
      )
    })
  )
});

export const CanonicalDataSchema = z.object({
  ContactEntities: z.array(ContactEntitySchema),
  Locations: z.array(LocationSchema),
  _meta: z.object({
    version: z.number(),
    generatedFrom: z.array(z.string()),
    generatedAt: z.string(),
    hash: z.string().optional()
  }).optional()
});

// Derived types
export type ContactPoint = z.infer<typeof ContactPointSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type ContactEntity = z.infer<typeof ContactEntitySchema>;
export type Location = z.infer<typeof LocationSchema>;
export type CanonicalData = z.infer<typeof CanonicalDataSchema>;

// Cache mechanism
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Global in-memory cache
let contactDataCache: CacheEntry<CanonicalData> | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache lifetime

// Feature Flag Management
export const enum DataFeatureFlags {
  USE_CANONICAL_DATA = 'USE_CANONICAL_DATA'
}

const featureFlags: Record<DataFeatureFlags, boolean> = {
  [DataFeatureFlags.USE_CANONICAL_DATA]: true, // Default to using canonical data
};

export function setFeatureFlag(flag: DataFeatureFlags, value: boolean) {
  featureFlags[flag] = value;
}

export function getFeatureFlag(flag: DataFeatureFlags): boolean {
  return featureFlags[flag];
}

// Error types
export class DataValidationError extends Error {
  errors: any[];
  
  constructor(message: string, errors: any[]) {
    super(message);
    this.name = 'DataValidationError';
    this.errors = errors;
  }
}

export class DataLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataLoadError';
  }
}

// Main data access functions
/**
 * Loads canonical data from source with validation and caching
 * @param forceRefresh Force refresh the cache
 * @returns Validated canonical data
 */
export async function loadCanonicalData(forceRefresh = false): Promise<CanonicalData> {
  // Check cache first if not forcing refresh
  if (!forceRefresh && contactDataCache && 
     (Date.now() - contactDataCache.timestamp < CACHE_TTL)) {
    return contactDataCache.data;
  }
  
  try {
    // Load data from source
    const response = await fetch('/data/canonicalContactData.json');
    if (!response.ok) {
      throw new DataLoadError(`Failed to load canonical data: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    
    // Validate against schema
    const validationResult = CanonicalDataSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      throw new DataValidationError(
        'Canonical data failed schema validation',
        validationResult.error.errors
      );
    }
    
    // Store in cache with current timestamp
    contactDataCache = {
      data: validationResult.data,
      timestamp: Date.now(),
      version: validationResult.data._meta?.hash || 'unknown'
    };
    
    return validationResult.data;
  } catch (error) {
    console.error('Error loading canonical data:', error);
    // If we have cache, return stale data rather than failing completely
    if (contactDataCache) {
      console.warn('Returning stale data from cache due to load error');
      return contactDataCache.data;
    }
    throw error;
  }
}

/**
 * Get a specific contact entity by ID
 */
export async function getContactById(id: string): Promise<ContactEntity | null> {
  const data = await loadCanonicalData();
  return data.ContactEntities.find(entity => entity.id === id) || null;
}

/**
 * Get all contact entities
 */
export async function getAllContacts(): Promise<ContactEntity[]> {
  const data = await loadCanonicalData();
  return data.ContactEntities;
}

/**
 * Get all locations
 */
export async function getAllLocations(): Promise<Location[]> {
  const data = await loadCanonicalData();
  return data.Locations;
}

/**
 * Get contact points by type
 */
export async function getContactsByType(type: string): Promise<ContactEntity[]> {
  const data = await loadCanonicalData();
  return data.ContactEntities.filter(entity => 
    entity.contactPoints.some(cp => cp.type === type)
  );
}

/**
 * Search contacts by name or extension with resilience to format differences
 */
export async function searchContacts(query: string): Promise<ContactEntity[]> {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const data = await loadCanonicalData();
  const normalizedQuery = query.toLowerCase().trim();
  
  return data.ContactEntities.filter(entity => {
    // Check displayName
    if (entity.displayName.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check extension numbers
    const hasMatchingExtension = entity.contactPoints.some(cp => 
      cp.type.includes('extension') && cp.value.includes(normalizedQuery)
    );
    
    if (hasMatchingExtension) {
      return true;
    }
    
    // Check phone numbers (with lenient matching to handle formatting differences)
    const hasMatchingPhone = entity.contactPoints.some(cp => {
      if (cp.type.includes('mobile') || cp.type.includes('phone')) {
        // Normalize both strings to digits only for comparison
        const normalizedValue = cp.value.replace(/\D/g, '');
        const normalizedSearchDigits = normalizedQuery.replace(/\D/g, '');
        return normalizedValue.includes(normalizedSearchDigits);
      }
      return false;
    });
    
    return hasMatchingPhone;
  });
}

/**
 * Get contacts filtered by role properties
 */
export async function getContactsByRole(
  officeCode?: string,
  brand?: string
): Promise<ContactEntity[]> {
  const data = await loadCanonicalData();
  
  return data.ContactEntities.filter(entity => {
    // If no filters provided, return all entities with roles
    if (!officeCode && !brand) {
      return entity.roles.length > 0;
    }
    
    // Filter by the specified criteria
    return entity.roles.some(role => {
      let match = true;
      
      if (officeCode) {
        match = match && role.office === officeCode;
      }
      
      if (brand) {
        match = match && role.brand === brand;
      }
      
      return match;
    });
  });
}

/**
 * Clear the data cache
 */
export function clearCache(): void {
  contactDataCache = null;
} 