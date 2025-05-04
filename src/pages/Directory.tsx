import React, { useState } from 'react';
import { useContactData } from '../contexts/ContactDataContext';
import ContactList from '../components/contact/ContactList';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Phone, MapPin, Settings, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

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
    dataStats
  } = useContactData();
  
  // Local state for tabs
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Handle errors
  if (error && !contacts.length) {
    return (
      <div className="p-4 bg-red-50 border border-red-300 rounded-md">
        <h2 className="text-lg font-bold text-red-800">Error Loading Data</h2>
        <p className="text-red-700">{error.message}</p>
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
  
  return (
    <div className="directory-container">
      {/* Header with data source toggle */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Contact Directory</h1>
          <p className="text-sm text-gray-600">
            {dataStats.totalContacts} total contacts ({dataStats.externalContacts} employees, {dataStats.internalContacts} resources)
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button 
            onClick={() => refreshData()}
            className="flex items-center text-sm text-gray-600 hover:text-primary"
            aria-label="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
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