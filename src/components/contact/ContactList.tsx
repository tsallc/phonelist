import React, { useMemo, useState } from 'react';
import { ContactEntity, ContactPoint } from '../../lib/contactDataService';
import ContactCard from './ContactCard';
import { Search, X, List, Grid, Filter, Users } from 'lucide-react';

interface ContactListProps {
  contacts: ContactEntity[];
  title?: string;
  emptyMessage?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onClearSearch?: () => void;
  className?: string;
  initialLayout?: 'grid' | 'list';
  loading?: boolean;
  compact?: boolean;
}

// Filter options for filtering contacts
type FilterOption = {
  label: string;
  value: string;
  filter: (contact: ContactEntity) => boolean;
};

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  title = "Contacts",
  emptyMessage = "No contacts found",
  searchQuery = '',
  onSearchChange,
  onClearSearch,
  className = '',
  initialLayout = 'grid',
  loading = false,
  compact = false
}) => {
  // Local state
  const [layout, setLayout] = useState<'grid' | 'list'>(initialLayout);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery);
  
  // Filter options
  const filterOptions = useMemo(() => {
    const options: FilterOption[] = [
      { 
        label: 'All', 
        value: 'all', 
        filter: () => true 
      },
      { 
        label: 'Has Mobile', 
        value: 'mobile', 
        filter: (contact: ContactEntity) => 
          contact.contactPoints.some((cp: ContactPoint) => cp.type.includes('mobile'))
      },
      { 
        label: 'Has Extension', 
        value: 'extension', 
        filter: (contact: ContactEntity) => 
          contact.contactPoints.some((cp: ContactPoint) => cp.type.includes('extension'))
      },
      { 
        label: 'External', 
        value: 'external', 
        filter: (contact: ContactEntity) => contact.kind === 'external'
      },
      { 
        label: 'Internal', 
        value: 'internal', 
        filter: (contact: ContactEntity) => contact.kind === 'internal'
      }
    ];
    
    return options;
  }, []);
  
  // Apply active filter
  const filteredContacts = useMemo(() => {
    if (activeFilter === 'all') return contacts;
    
    const activeFilterObj = filterOptions.find(f => f.value === activeFilter);
    if (!activeFilterObj) return contacts;
    
    return contacts.filter(activeFilterObj.filter);
  }, [contacts, activeFilter, filterOptions]);
  
  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setLocalSearchQuery(newQuery);
    
    // Propagate to parent if onSearchChange provided
    if (onSearchChange) {
      onSearchChange(newQuery);
    }
  };
  
  // Handle clearing search
  const handleClearSearch = () => {
    setLocalSearchQuery('');
    
    // Propagate to parent if onClearSearch provided
    if (onClearSearch) {
      onClearSearch();
    }
  };
  
  // Responsive grid column count
  const gridColClass = useMemo(() => {
    // Adjust columns based on compact mode
    return compact 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }, [compact]);
  
  return (
    <div className={`contact-list-container ${className}`}>
      {/* Header with title and filter controls */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        {/* Title and Count */}
        <div className="flex items-center">
          <h2 className="text-xl font-bold flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {title}
          </h2>
          <span className="ml-2 text-sm text-gray-500">
            ({filteredContacts.length} contacts)
          </span>
        </div>
        
        {/* Layout Toggle */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setLayout('grid')} 
            className={`p-2 rounded ${layout === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'}`}
            aria-label="Grid layout"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setLayout('list')} 
            className={`p-2 rounded ${layout === 'list' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'}`}
            aria-label="List layout"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, extension, or phone..."
            className="block w-full pl-10 pr-10 py-2 border rounded-md focus:ring-primary focus:border-primary"
            value={localSearchQuery}
            onChange={handleSearchChange}
          />
          {localSearchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              className="appearance-none bg-transparent border-b border-gray-300 py-1 focus:outline-none focus:border-primary cursor-pointer"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredContacts.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
      
      {/* Contacts Display */}
      {!loading && filteredContacts.length > 0 && (
        <>
          {layout === 'grid' ? (
            <div className={`grid gap-4 ${gridColClass}`}>
              {filteredContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  compact={compact}
                  highlightText={searchQuery}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  className="border-l-4 border-primary/30"
                  highlightText={searchQuery}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContactList; 