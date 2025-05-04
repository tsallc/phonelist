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
  DataValidationError
} from '../lib/contactDataService';

// Legacy data fallback - to be used only in legacy mode
import { RAW_OFFICE_DATA, OfficeRoomData } from '../ArtifactCode';

// Define the context state type
interface ContactDataContextType {
  // Data state
  contacts: ContactEntity[];
  locations: Location[];
  loading: boolean;
  error: Error | null;
  
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
    // Reload data with the new source
    loadData();
  };
  
  // Function to load data based on current mode
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (useCanonicalData) {
        // Load from canonical source
        const data = await loadCanonicalData(true); // Force refresh
        setContacts(data.ContactEntities);
        setLocations(data.Locations);
        calculateStats(data.ContactEntities);
      } else {
        // Legacy data mode - convert from RAW_OFFICE_DATA
        // This is temporary and should be removed once migration is complete
        const legacyContacts = convertLegacyData();
        setContacts(legacyContacts);
        setLocations([]); // No locations in legacy data
        calculateStats(legacyContacts);
      }
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading data'));
      
      // If canonical fails but legacy is available as fallback
      if (useCanonicalData && err instanceof DataValidationError) {
        console.warn('Falling back to legacy data due to validation error');
        const legacyContacts = convertLegacyData();
        setContacts(legacyContacts);
        calculateStats(legacyContacts);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh data
  const refreshData = async () => {
    await loadData();
  };
  
  // Search function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    if (useCanonicalData) {
      // Use the service
      const results = await searchContactsService(query);
      setSearchResults(results);
    } else {
      // Simple client-side search for legacy data
      const normalizedQuery = query.toLowerCase().trim();
      const results = contacts.filter(contact => 
        contact.displayName.toLowerCase().includes(normalizedQuery) ||
        contact.contactPoints.some(cp => cp.value.includes(normalizedQuery))
      );
      setSearchResults(results);
    }
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
    if (!RAW_OFFICE_DATA) return [];
    
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