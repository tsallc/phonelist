import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  ContactEntity, 
  Location, 
  CanonicalData,
  loadCanonicalData, 
  getFeatureFlag, 
  setFeatureFlag,
  DataFeatureFlags, 
  searchContacts as searchContactsService,
  getContactsByRole,
  DataValidationError,
  DataLoadError,
  ENV
} from '../lib/contactDataService';

// Legacy data fallback - to be used only in legacy mode
import { RAW_OFFICE_DATA, OfficeRoomData } from '../ArtifactCode';

// Define data source state transitions
export enum DataSourceState {
  // Canonical data states
  CANONICAL_LOADING = 'canonical_loading',
  CANONICAL_LOADED = 'canonical_loaded',
  CANONICAL_ERROR = 'canonical_error',
  
  // Legacy data states
  LEGACY_LOADING = 'legacy_loading',
  LEGACY_LOADED = 'legacy_loaded',
  LEGACY_ERROR = 'legacy_error',
  
  // Fallback states 
  FALLBACK_TO_LEGACY = 'fallback_to_legacy',
  FALLBACK_TO_CACHE = 'fallback_to_cache',
  
  // Fatal error state
  FATAL_ERROR = 'fatal_error',
}

// Define the context state type
interface ContactDataContextType {
  // Data state
  contacts: ContactEntity[];
  locations: Location[];
  loading: boolean;
  error: Error | null;
  
  // Source state tracking
  dataSourceState: DataSourceState;
  dataSource: string;
  
  // Feature flag control
  useCanonicalData: boolean;
  toggleDataSource: () => void;
  
  // Cache control
  refreshData: () => Promise<void>;
  
  // Search functionality
  searchQuery: string;
  searchResults: ContactEntity[];
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Filter helpers
  getContactsByOffice: (officeCode: string) => ContactEntity[];
  getContactsByPointType: (type: string) => ContactEntity[];

  // Stats
  dataStats: {
    totalContacts: number;
    externalContacts: number;
    internalContacts: number;
    contactsWithMobile: number;
    contactsWithExtension: number;
  };
}

// Create the context with a default value
const ContactDataContext = createContext<ContactDataContextType | undefined>(undefined);

// Props for the provider
interface ContactDataProviderProps {
  children: ReactNode;
  initialUseCanonical?: boolean;
}

export const ContactDataProvider: React.FC<ContactDataProviderProps> = ({ 
  children,
  initialUseCanonical = true
}) => {
  // State variables
  const [contacts, setContacts] = useState<ContactEntity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ContactEntity[]>([]);
  const [dataSourceState, setDataSourceState] = useState<DataSourceState>(DataSourceState.CANONICAL_LOADING);
  const [dataSource, setDataSource] = useState<string>('initializing');
  const [dataStats, setDataStats] = useState({
    totalContacts: 0,
    externalContacts: 0,
    internalContacts: 0,
    contactsWithMobile: 0,
    contactsWithExtension: 0
  });
  
  // Feature toggle state
  const [useCanonicalData, setUseCanonicalData] = useState<boolean>(
    initialUseCanonical || getFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA)
  );
  
  // Function to toggle between canonical and legacy data
  const toggleDataSource = () => {
    const newValue = !useCanonicalData;
    setUseCanonicalData(newValue);
    setFeatureFlag(DataFeatureFlags.USE_CANONICAL_DATA, newValue);
    
    // Reset other state
    setLoading(true);
    setError(null);
    setDataSourceState(newValue ? DataSourceState.CANONICAL_LOADING : DataSourceState.LEGACY_LOADING);
    
    // Reload data with the new source
    loadData();
  };
  
  // Load canonical data with proper error handling
  const loadCanonicalDataWithTracking = async (forceRefresh = false) => {
    setDataSourceState(DataSourceState.CANONICAL_LOADING);
    
    try {
      const data = await loadCanonicalData(forceRefresh);
      setContacts(data.ContactEntities);
      setLocations(data.Locations);
      calculateStats(data.ContactEntities);
      setDataSourceState(DataSourceState.CANONICAL_LOADED);
      
      // If data was loaded from cache, note this
      if (!forceRefresh) {
        setDataSource('canonical (cached)');
      } else if (data._meta?.generatedFrom) {
        setDataSource(`canonical (${data._meta.generatedFrom.join(', ')})`);
      } else {
        setDataSource('canonical');
      }
      
      return true;
    } catch (error) {
      console.error('Error loading canonical data:', error);
      
      if (error instanceof DataValidationError) {
        setError(new Error(`Schema validation failed: ${error.message}`));
        setDataSourceState(DataSourceState.CANONICAL_ERROR);
      } else if (error instanceof DataLoadError) {
        setError(new Error(`Data loading failed: ${error.message}`));
        setDataSourceState(DataSourceState.CANONICAL_ERROR);
      } else {
        setError(error instanceof Error ? error : new Error('Unknown error'));
        setDataSourceState(DataSourceState.CANONICAL_ERROR);
      }
      
      return false;
    }
  };
  
  // Load legacy data with proper tracking
  const loadLegacyData = () => {
    setDataSourceState(DataSourceState.LEGACY_LOADING);
    
    try {
      if (!RAW_OFFICE_DATA || !Array.isArray(RAW_OFFICE_DATA) || RAW_OFFICE_DATA.length === 0) {
        throw new Error('Legacy data is not available or empty');
      }
      
      const legacyContacts = convertLegacyData();
      setContacts(legacyContacts);
      setLocations([]); // No locations in legacy data
      calculateStats(legacyContacts);
      setDataSourceState(DataSourceState.LEGACY_LOADED);
      setDataSource('legacy (ArtifactCode.jsx)');
      return true;
    } catch (error) {
      console.error('Error loading legacy data:', error);
      setError(error instanceof Error ? error : new Error('Unknown error in legacy data'));
      setDataSourceState(DataSourceState.LEGACY_ERROR);
      return false;
    }
  };
  
  // Function to load data based on current mode
  const loadData = async () => {
    setLoading(true);
    setError(null);
    let success = false;
    
    try {
      if (useCanonicalData) {
        // Try to load canonical data
        success = await loadCanonicalDataWithTracking(true);
        
        // If canonical fails, try legacy as fallback
        if (!success && RAW_OFFICE_DATA) {
          console.warn('Falling back to legacy data due to canonical data error');
          setDataSourceState(DataSourceState.FALLBACK_TO_LEGACY);
          success = loadLegacyData();
        }
      } else {
        // Direct legacy data mode
        success = loadLegacyData();
      }
      
      // If all else fails
      if (!success) {
        setDataSourceState(DataSourceState.FATAL_ERROR);
        setError(new Error('All data loading attempts failed. No data available.'));
      }
    } catch (err) {
      console.error('Unexpected error during data loading:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during data loading'));
      setDataSourceState(DataSourceState.FATAL_ERROR);
      success = false;
    } finally {
      setLoading(false);
    }
    
    // In development, print state for debugging
    if (ENV.isDevelopment) {
      console.log(`Data loading completed. Source: ${dataSource}, State: ${dataSourceState}, Success: ${success}`);
    }
    
    return success;
  };
  
  // Function to refresh data
  const refreshData = async () => {
    await loadData();
    return;
  };
  
  // Search function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    if (useCanonicalData && 
        (dataSourceState === DataSourceState.CANONICAL_LOADED || 
         dataSourceState === DataSourceState.FALLBACK_TO_CACHE)) {
      // Use the service for canonical data
      try {
        const results = await searchContactsService(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        // Fall back to client-side search if service fails
        performClientSideSearch(query);
      }
    } else {
      // Any other state, use simple client-side search
      performClientSideSearch(query);
    }
  };
  
  // Client-side search implementation
  const performClientSideSearch = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    const results = contacts.filter(contact => 
      contact.displayName.toLowerCase().includes(normalizedQuery) ||
      contact.contactPoints.some(cp => cp.value.includes(normalizedQuery))
    );
    setSearchResults(results);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Helper to get contacts by office
  const getContactsByOffice = (officeCode: string): ContactEntity[] => {
    return contacts.filter(contact => 
      contact.roles.some(role => role.office === officeCode)
    );
  };
  
  // Helper to get contacts by point type
  const getContactsByPointType = (type: string): ContactEntity[] => {
    return contacts.filter(contact => 
      contact.contactPoints.some(cp => cp.type === type)
    );
  };
  
  // Calculate statistics about the data
  const calculateStats = (contactList: ContactEntity[]) => {
    const stats = {
      totalContacts: contactList.length,
      externalContacts: contactList.filter(c => c.kind === 'external').length,
      internalContacts: contactList.filter(c => c.kind === 'internal').length,
      contactsWithMobile: contactList.filter(c => 
        c.contactPoints.some(cp => cp.type.includes('mobile'))
      ).length,
      contactsWithExtension: contactList.filter(c => 
        c.contactPoints.some(cp => cp.type.includes('extension'))
      ).length
    };
    
    setDataStats(stats);
  };
  
  // Function to convert legacy data to canonical format (temporary)
  const convertLegacyData = (): ContactEntity[] => {
    if (!RAW_OFFICE_DATA) {
      console.error('RAW_OFFICE_DATA is not available for legacy conversion');
      return [];
    }
    
    console.log(`Converting ${RAW_OFFICE_DATA.length} legacy data items`);
    
    // This is a simplified conversion - we'd need more complete mapping in a real app
    return RAW_OFFICE_DATA.map((item: OfficeRoomData) => ({
      id: item.id,
      displayName: item.name,
      contactPoints: item.extension ? [
        {
          type: 'desk-extension',
          value: item.extension,
          source: 'ArtifactCode.jsx'
        }
      ] : [],
      roles: [{
        office: item.floor,
        brand: item.location === 'coastal' ? 'cts' : 'tsa',
        title: null,
        priority: 1
      }],
      kind: item.status === 'active' ? 'external' : 'internal',
      source: 'Legacy',
    }));
  };
  
  // Load data on initial mount and when useCanonicalData changes
  useEffect(() => {
    loadData();
  }, [useCanonicalData]);
  
  // Update search results when search query changes
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, contacts]);
  
  // Create the context value
  const contextValue: ContactDataContextType = {
    contacts,
    locations,
    loading,
    error,
    dataSourceState,
    dataSource,
    useCanonicalData,
    toggleDataSource,
    refreshData,
    searchQuery,
    searchResults,
    setSearchQuery: handleSearch,
    clearSearch,
    getContactsByOffice,
    getContactsByPointType,
    dataStats
  };
  
  return (
    <ContactDataContext.Provider value={contextValue}>
      {children}
    </ContactDataContext.Provider>
  );
};

// Custom hook to use the context
export const useContactData = (): ContactDataContextType => {
  const context = useContext(ContactDataContext);
  if (context === undefined) {
    throw new Error('useContactData must be used within a ContactDataProvider');
  }
  return context;
}; 