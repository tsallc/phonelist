import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ContactDataProvider, useContactData } from './ContactDataContext';
import { RAW_OFFICE_DATA } from '../ArtifactCode';
import * as contactDataService from '../lib/contactDataService';

// Mock the contact data service
vi.mock('../lib/contactDataService', () => {
  // Create a custom error class for testing
  class DataValidationError extends Error {
    constructor(message, errors = []) {
      super(message);
      this.name = 'DataValidationError';
      this.errors = errors;
    }
  }

  return {
    loadCanonicalData: vi.fn(),
    getFeatureFlag: vi.fn(),
    setFeatureFlag: vi.fn(),
    searchContacts: vi.fn(),
    getContactsByRole: vi.fn(),
    DataFeatureFlags: { USE_CANONICAL_DATA: 'useCanonicalData' },
    DataValidationError // Export the error class
  };
});

// Test component that uses the context
const TestConsumer = () => {
  const { 
    contacts, 
    loading, 
    error, 
    useCanonicalData, 
    toggleDataSource 
  } = useContactData();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error ? error.message : 'No Error'}</div>
      <div data-testid="data-source">{useCanonicalData ? 'Canonical' : 'Legacy'}</div>
      <div data-testid="contact-count">{contacts.length}</div>
      <button data-testid="toggle-btn" onClick={toggleDataSource}>Toggle</button>
    </div>
  );
};

describe('ContactDataContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(contactDataService.loadCanonicalData).mockResolvedValue({
      ContactEntities: [],
      Locations: []
    });
    
    vi.mocked(contactDataService.getFeatureFlag).mockReturnValue(true);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children and load canonical data by default', async () => {
    // Setup mocks
    const mockContactEntities = [
      { id: '1', displayName: 'Test User', contactPoints: [], roles: [], kind: 'external' }
    ];
    
    vi.mocked(contactDataService.loadCanonicalData).mockResolvedValue({
      ContactEntities: mockContactEntities,
      Locations: []
    });
    
    // Render with provider
    render(
      <ContactDataProvider>
        <TestConsumer />
      </ContactDataProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Should be using canonical data
    expect(screen.getByTestId('data-source')).toHaveTextContent('Canonical');
    
    // Should have loaded the contacts
    expect(screen.getByTestId('contact-count')).toHaveTextContent('1');
    
    // Verify loadCanonicalData was called
    expect(contactDataService.loadCanonicalData).toHaveBeenCalled();
  });
  
  it('should toggle between canonical and legacy data', async () => {
    // Setup mocks
    vi.mocked(contactDataService.getFeatureFlag).mockReturnValue(true);
    
    // Render with provider
    render(
      <ContactDataProvider>
        <TestConsumer />
      </ContactDataProvider>
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Should start with canonical data
    expect(screen.getByTestId('data-source')).toHaveTextContent('Canonical');
    
    // Toggle to legacy data
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    // Should be loading again briefly
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for legacy data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Should now be using legacy data
    expect(screen.getByTestId('data-source')).toHaveTextContent('Legacy');
    
    // Verify setFeatureFlag was called
    expect(contactDataService.setFeatureFlag).toHaveBeenCalledWith(
      contactDataService.DataFeatureFlags.USE_CANONICAL_DATA, 
      false
    );
  });
  
  it('should handle canonical data loading errors', async () => {
    // Setup mock to throw error
    vi.mocked(contactDataService.loadCanonicalData).mockRejectedValue(
      new Error('Test error')
    );
    
    // Render with provider
    render(
      <ContactDataProvider>
        <TestConsumer />
      </ContactDataProvider>
    );
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });
  });
  
  it('should verify legacy data conversion from RAW_OFFICE_DATA', async () => {
    // Force legacy data mode
    vi.mocked(contactDataService.getFeatureFlag).mockReturnValue(false);
    
    // Render with provider in legacy mode
    render(
      <ContactDataProvider initialUseCanonical={false}>
        <TestConsumer />
      </ContactDataProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Should be using legacy data
    expect(screen.getByTestId('data-source')).toHaveTextContent('Legacy');
    
    // Should have converted the RAW_OFFICE_DATA to contacts
    // Number of contacts should match the number of entries in RAW_OFFICE_DATA
    const activeRooms = RAW_OFFICE_DATA.filter(room => room.status === 'active');
    
    await waitFor(() => {
      expect(screen.getByTestId('contact-count')).toHaveTextContent(
        RAW_OFFICE_DATA.length.toString()
      );
    });
  });
  
  it('should correctly convert contact points from legacy extension data', async () => {
    // Setup spy to access the contacts after conversion
    const contactsSpy = vi.fn();
    
    // Custom test consumer that captures contacts
    const TestContactSpy = () => {
      const { contacts, loading } = useContactData();
      
      useEffect(() => {
        if (!loading) {
          contactsSpy(contacts);
        }
      }, [contacts, loading]);
      
      return <div data-testid="loading">{loading ? 'Loading' : 'Done'}</div>;
    };
    
    // Force legacy data mode
    vi.mocked(contactDataService.getFeatureFlag).mockReturnValue(false);
    
    // Render with provider in legacy mode
    render(
      <ContactDataProvider initialUseCanonical={false}>
        <TestContactSpy />
      </ContactDataProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Done');
    });
    
    // Verify contact points were properly converted
    await waitFor(() => {
      expect(contactsSpy).toHaveBeenCalled();
      
      // Get the converted contacts
      const convertedContacts = contactsSpy.mock.calls[0][0];
      
      // Find a contact with an extension in the original data
      const originalWithExt = RAW_OFFICE_DATA.find(room => room.extension && room.extension.length > 0);
      
      if (originalWithExt) {
        // Find the corresponding converted contact
        const convertedContact = convertedContacts.find(c => c.id === originalWithExt.id);
        
        // Verify it has a contact point with the extension value
        expect(convertedContact).toBeDefined();
        expect(convertedContact.contactPoints.length).toBeGreaterThan(0);
        expect(convertedContact.contactPoints[0].type).toBe('desk-extension');
        expect(convertedContact.contactPoints[0].value).toBe(originalWithExt.extension);
      }
    });
  });
}); 