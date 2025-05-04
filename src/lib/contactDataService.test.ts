import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loadCanonicalData, 
  ContactEntity, 
  searchContacts, 
  getContactsByRole, 
  DataFeatureFlags,
  getFeatureFlag,
  setFeatureFlag
} from './contactDataService';
import { RAW_OFFICE_DATA } from '../ArtifactCode';

// Mock fetch for canonical data loading
global.fetch = vi.fn();

describe('contactDataService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear any stored feature flags
    localStorage.clear();
  });

  // Clean up after tests
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load canonical data from JSON file', async () => {
      // Mock a successful fetch response with sample data
      const mockData = {
        schemaVersion: "1.0",
        ContactEntities: [
          {
            id: "test-id-1",
            objectId: "123456",
            displayName: "Test User",
            roles: [{ office: "PLY", brand: "tsa", priority: 1, title: null }],
            contactPoints: [{ type: "mobile", value: "123-456-7890", source: "test" }],
            kind: "external"
          }
        ],
        Locations: [{ code: "PLY", name: "Plymouth Office" }]
      };

      // @ts-ignore - Mock implementation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loadCanonicalData(true);
      
      // Verify fetch was called with the correct path
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('canonicalContactData.json'),
        expect.anything()
      );
      
      // Check the returned data structure
      expect(result).toHaveProperty('ContactEntities');
      expect(result).toHaveProperty('Locations');
      expect(result.ContactEntities).toHaveLength(1);
      expect(result.ContactEntities[0].id).toBe("test-id-1");
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock a failed fetch response
      // @ts-ignore - Mock implementation
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Expect the loadCanonicalData function to throw
      await expect(loadCanonicalData(true)).rejects.toThrow();
    });

    it('should handle schema validation errors', async () => {
      // Mock a successful fetch with invalid data
      const invalidData = {
        schemaVersion: "1.0",
        ContactEntities: [
          {
            // Missing required fields
            id: "test-id-1"
            // No displayName, which is required
          }
        ],
        Locations: []
      };

      // @ts-ignore - Mock implementation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData,
      });

      // Expect validation error
      await expect(loadCanonicalData(true)).rejects.toThrow();
    });
  });

  describe('Feature Flags', () => {
    it('should get default value when feature flag is not set', () => {
      expect(getFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA)).toBe(true);
    });

    it('should set and get feature flag', () => {
      setFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA, false);
      expect(getFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA)).toBe(false);
      
      setFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA, true);
      expect(getFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA)).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('should search contacts by name', async () => {
      // Setup test data
      const testContacts: ContactEntity[] = [
        { 
          id: "1", 
          displayName: "John Smith", 
          contactPoints: [], 
          roles: [], 
          kind: "external" 
        },
        { 
          id: "2", 
          displayName: "Jane Doe", 
          contactPoints: [], 
          roles: [], 
          kind: "external" 
        }
      ];
      
      // Mock the data loading
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          schemaVersion: "1.0",
          ContactEntities: testContacts,
          Locations: []
        }),
      } as any);
      
      // Load the data first
      await loadCanonicalData(true);
      
      // Then test search
      const results = await searchContacts("John");
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
    
    it('should search contacts by contact point', async () => {
      // Setup test data
      const testContacts: ContactEntity[] = [
        { 
          id: "1", 
          displayName: "John Smith", 
          contactPoints: [{ type: "mobile", value: "123-456-7890", source: "test" }], 
          roles: [], 
          kind: "external" 
        },
        { 
          id: "2", 
          displayName: "Jane Doe", 
          contactPoints: [{ type: "mobile", value: "987-654-3210", source: "test" }], 
          roles: [], 
          kind: "external" 
        }
      ];
      
      // Mock the data loading
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          schemaVersion: "1.0",
          ContactEntities: testContacts,
          Locations: []
        }),
      } as any);
      
      // Load the data first
      await loadCanonicalData(true);
      
      // Then test search
      const results = await searchContacts("123-456");
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
  });

  describe('Data Filtering', () => {
    it('should filter contacts by role/office', async () => {
      // Setup test data
      const testContacts: ContactEntity[] = [
        { 
          id: "1", 
          displayName: "John Smith", 
          contactPoints: [], 
          roles: [{ office: "PLY", brand: "tsa", priority: 1, title: null }], 
          kind: "external" 
        },
        { 
          id: "2", 
          displayName: "Jane Doe", 
          contactPoints: [], 
          roles: [{ office: "FTL", brand: "cts", priority: 1, title: null }], 
          kind: "external" 
        }
      ];
      
      // Mock the data loading
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          schemaVersion: "1.0",
          ContactEntities: testContacts,
          Locations: []
        }),
      } as any);
      
      // Load the data first
      await loadCanonicalData(true);
      
      // Then test filtering
      const results = await getContactsByRole("PLY");
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
  });

  describe('Legacy Data Integration', () => {
    it('should verify ArtifactCode RAW_OFFICE_DATA is properly exported', () => {
      // This test verifies that the data from ArtifactCode is properly exported
      expect(RAW_OFFICE_DATA).toBeDefined();
      expect(Array.isArray(RAW_OFFICE_DATA)).toBe(true);
      expect(RAW_OFFICE_DATA.length).toBeGreaterThan(0);
    });

    it('should verify first entry in legacy data has expected structure', () => {
      // Check the structure of the first entry
      const firstEntry = RAW_OFFICE_DATA[0];
      expect(firstEntry).toHaveProperty('id');
      expect(firstEntry).toHaveProperty('name');
      expect(firstEntry).toHaveProperty('location');
      expect(firstEntry).toHaveProperty('floor');
      expect(firstEntry).toHaveProperty('type');
      expect(firstEntry).toHaveProperty('status');
    });
  });
}); 