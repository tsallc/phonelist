import React, { useState } from 'react';
import { useContactData, DataSourceState } from '../contexts/ContactDataContext';
import ContactList from '../components/contact/ContactList';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Phone, MapPin, Settings, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle, Info } from 'lucide-react';
import { ENV } from '../lib/contactDataService';

const Directory: React.FC = () => {
  const { 
    contacts, 
    loading, 
    error, 
    searchQuery, 
    searchResults, 
    setSearchQuery, 
    clearSearch,
    useCanonicalData,
    toggleDataSource,
    refreshData,
    dataStats,
    dataSourceState,
    dataSource
  } = useContactData();
  
  // Local state for tabs
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Helper for data source state label
  const getDataSourceLabel = () => {
    switch(dataSourceState) {
      case DataSourceState.CANONICAL_LOADED:
        return { 
          label: 'Canonical',
          color: 'text-green-700 bg-green-100',
          icon: <Info className="h-4 w-4 mr-1 text-green-600" />
        };
      case DataSourceState.CANONICAL_ERROR:
        return { 
          label: 'Canonical Error',
          color: 'text-orange-700 bg-orange-100',
          icon: <AlertTriangle className="h-4 w-4 mr-1 text-orange-600" />
        };
      case DataSourceState.LEGACY_LOADED:
        return { 
          label: 'Legacy',
          color: 'text-blue-700 bg-blue-100',
          icon: <Info className="h-4 w-4 mr-1 text-blue-600" />
        };
      case DataSourceState.LEGACY_ERROR:
        return { 
          label: 'Legacy Error',
          color: 'text-red-700 bg-red-100',
          icon: <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
        };
      case DataSourceState.FALLBACK_TO_LEGACY:
        return { 
          label: 'Fallback',
          color: 'text-amber-700 bg-amber-100',
          icon: <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
        };
      default:
        return { 
          label: 'Loading',
          color: 'text-gray-700 bg-gray-100',
          icon: <RefreshCw className="h-4 w-4 mr-1 text-gray-600 animate-spin" />
        };
    }
  };
  
  // Handle errors
  if (error && !contacts.length) {
    return (
      <div className="p-4 bg-red-50 border border-red-300 rounded-md">
        <h2 className="text-lg font-bold text-red-800">Error Loading Data</h2>
        <p className="text-red-700">{error.message}</p>
        {ENV.isDevelopment && (
          <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono">
            <p>Data Source State: {dataSourceState}</p>
            <p>Source: {dataSource}</p>
          </div>
        )}
        <button 
          onClick={() => refreshData()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Get filtered contacts based on active tab
  const getFilteredContacts = () => {
    // If there's a search query, always use search results
    if (searchQuery) {
      return searchResults;
    }
    
    // Otherwise filter based on the active tab
    switch (activeTab) {
      case 'michigan':
        return contacts.filter(contact => 
          contact.roles.some(role => role.office === 'PLY')
        );
      case 'florida':
        return contacts.filter(contact => 
          contact.roles.some(role => role.office === 'FTL')
        );
      case 'tampa':
        return contacts.filter(contact => 
          contact.roles.some(role => (
            role.office === 'REO' || role.office === 'SGT'
          ))
        );
      case 'resources':
        return contacts.filter(contact => contact.kind === 'internal');
      case 'all':
      default:
        return contacts;
    }
  };
  
  // Source label
  const sourceInfo = getDataSourceLabel();
  
  return (
    <div className="directory-container">
      {/* Header with data source toggle */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Contact Directory</h1>
          <p className="text-sm text-gray-600">
            {dataStats.totalContacts} total contacts ({dataStats.externalContacts} employees, {dataStats.internalContacts} resources)
          </p>
          
          {/* Source info - shown only in development mode */}
          {ENV.isDevelopment && (
            <div className="mt-1 flex items-center text-xs">
              <span className="text-gray-500 mr-2">Source:</span>
              <span className={`px-2 py-0.5 rounded flex items-center ${sourceInfo.color}`}>
                {sourceInfo.icon}
                {sourceInfo.label}
              </span>
              {dataSource && (
                <span className="ml-2 text-gray-500">{dataSource}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button 
            onClick={() => refreshData()}
            className="flex items-center text-sm text-gray-600 hover:text-primary"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Data Source Toggle - Only shown during development */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={toggleDataSource}
              className="flex items-center text-sm bg-gray-200 py-1 px-3 rounded-full"
              aria-label="Toggle data source"
            >
              {useCanonicalData ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-green-700">Canonical</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-1 text-red-600" />
                  <span className="text-red-700">Legacy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Main tabs for filtering by location */}
      <Tabs 
        defaultValue="all" 
        className="w-full" 
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger 
            value="all" 
            className="flex items-center"
          >
            <Phone className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger 
            value="michigan"
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Michigan
          </TabsTrigger>
          <TabsTrigger 
            value="florida"
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Ft. Lauderdale
          </TabsTrigger>
          <TabsTrigger 
            value="tampa"
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Tampa
          </TabsTrigger>
          <TabsTrigger 
            value="resources"
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>
        
        {/* TabsContent is not needed as we're using the activeTab state directly */}
      </Tabs>
      
      {/* Contact list with filtered contacts */}
      <ContactList
        contacts={getFilteredContacts()}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        title={
          searchQuery ? `Search Results for "${searchQuery}"` :
          activeTab === 'all' ? 'All Contacts' :
          activeTab === 'michigan' ? 'Michigan Office' :
          activeTab === 'florida' ? 'Ft. Lauderdale Office' :
          activeTab === 'tampa' ? 'Tampa Offices' :
          'Office Resources'
        }
        emptyMessage={
          searchQuery ? `No contacts matching "${searchQuery}"` :
          `No contacts found for ${activeTab}`
        }
      />
    </div>
  );
};

export default Directory; 