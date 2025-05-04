import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrintableDirectory from './PrintableDirectory';
import { useContactData, DataSourceState } from '../contexts/ContactDataContext';
import { ContactEntity } from '../lib/contactDataService';
import '@testing-library/jest-dom'; // Import again to be sure TypeScript sees this

// Explicitly extend expect
declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
    }
  }
}

// Mock the useContactData hook
vi.mock('../contexts/ContactDataContext', () => ({
  useContactData: vi.fn(),
  DataSourceState: {
    CANONICAL_LOADED: 'canonical_loaded',
    CANONICAL_LOADING: 'canonical_loading',
    CANONICAL_ERROR: 'canonical_error',
    FATAL_ERROR: 'fatal_error'
  }
}));

describe('PrintableDirectory', () => {
  // Mock data for testing using proper types
  const mockContacts: ContactEntity[] = [
    {
      id: 'test-mi-1',
      displayName: 'John Doe',
      contactPoints: [
        { type: 'desk-extension', value: '1001', source: 'test' }
      ],
      roles: [
        { office: 'PLY', brand: 'tsa', title: null, priority: 1 }
      ],
      kind: 'external',
      source: 'test'
    },
    {
      id: 'test-mi-2',
      displayName: 'Jane Smith',
      contactPoints: [
        { type: 'desk-extension', value: '1002', source: 'test' }
      ],
      roles: [
        { office: 'PLY', brand: 'tsa', title: null, priority: 1 }
      ],
      kind: 'external',
      source: 'test'
    },
    {
      id: 'test-fl-1',
      displayName: 'Bob Johnson',
      contactPoints: [
        { type: 'desk-extension', value: '2001', source: 'test' }
      ],
      roles: [
        { office: 'FTL', brand: 'tsa', title: null, priority: 1 }
      ],
      kind: 'external',
      source: 'test'
    },
    {
      id: 'test-cell',
      displayName: 'Alice Williams',
      contactPoints: [
        { type: 'mobile', value: '5551234567', source: 'test' }
      ],
      roles: [
        { office: 'PLY', brand: 'tsa', title: null, priority: 1 }
      ],
      kind: 'external',
      source: 'test'
    }
  ];

  // Create a mock return value for useContactData
  const mockContactData = {
    contacts: mockContacts,
    loading: false,
    error: null,
    dataSourceState: DataSourceState.CANONICAL_LOADED,
    dataSource: 'test',
    searchQuery: '',
    searchResults: [],
    clearSearch: vi.fn(),
    setSearchQuery: vi.fn(),
    refreshData: vi.fn(),
    useCanonicalData: true,
    toggleDataSource: vi.fn(),
    getContactsByOffice: vi.fn(),
    getContactsByPointType: vi.fn(),
    locations: [],
    dataStats: {
      totalContacts: 4,
      externalContacts: 4,
      internalContacts: 0,
      contactsWithMobile: 1,
      contactsWithExtension: 3
    }
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.mocked(useContactData).mockReturnValue(mockContactData);
  });

  it('renders without crashing', () => {
    render(<PrintableDirectory />);
    
    // Verify basic components are present
    expect(screen.getByText('Title Solutions Agency, LLC')).toBeInTheDocument();
    expect(screen.getByText('Contact Directory')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    vi.mocked(useContactData).mockReturnValue({
      ...mockContactData,
      loading: true
    });
    
    render(<PrintableDirectory />);
    expect(screen.getByText('Loading contact information...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    vi.mocked(useContactData).mockReturnValue({
      ...mockContactData,
      error: new Error('Test error'),
      contacts: []
    });
    
    render(<PrintableDirectory />);
    expect(screen.getByText(/Error loading contact data/)).toBeInTheDocument();
  });

  it('renders Michigan extensions correctly', () => {
    render(<PrintableDirectory />);
    
    expect(screen.getByText('Michigan Extensions')).toBeInTheDocument();
    // Check for first names of Michigan contacts
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    // Check for their extensions
    expect(screen.getByText('1001')).toBeInTheDocument();
    expect(screen.getByText('1002')).toBeInTheDocument();
  });

  it('renders Florida extensions correctly', () => {
    render(<PrintableDirectory />);
    
    expect(screen.getByText('Florida Extensions')).toBeInTheDocument();
    // Check for first name of Florida contact
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Check for extension
    expect(screen.getByText('2001')).toBeInTheDocument();
  });

  it('renders cell phone numbers correctly', () => {
    render(<PrintableDirectory />);
    
    expect(screen.getByText('Cell Phone Numbers')).toBeInTheDocument();
    // Check for full name in cell phone section
    expect(screen.getByText('Alice Williams')).toBeInTheDocument();
    // Check for formatted phone number (with dashes)
    expect(screen.getByText('555-123-4567')).toBeInTheDocument();
  });

  it('renders static content sections', () => {
    render(<PrintableDirectory />);
    
    // Check for static email addresses section
    expect(screen.getByText('Email Addresses')).toBeInTheDocument();
    expect(screen.getByText('docs@titlesolutionsllc.com')).toBeInTheDocument();
    
    // Check for static intercom section
    expect(screen.getByText('PAGE / INTERCOM')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    
    // Check for static treasurers section
    expect(screen.getByText('Treasurers / Additional Numbers')).toBeInTheDocument();
    expect(screen.getByText('Wayne County')).toBeInTheDocument();
    
    // Check for static IT department section
    expect(screen.getByText('IT Department')).toBeInTheDocument();
    expect(screen.getByText('Will')).toBeInTheDocument();
  });

  it('renders office location cards', () => {
    render(<PrintableDirectory />);
    
    // Check for Michigan office details
    expect(screen.getByText('41486 Wilcox Rd., Suite 2')).toBeInTheDocument();
    expect(screen.getByText('Plymouth, MI 48170')).toBeInTheDocument();
    
    // Check for Florida office details
    expect(screen.getByText('333 Las Olas Way CU315')).toBeInTheDocument();
    expect(screen.getByText('Ft. Lauderdale, FL 33301')).toBeInTheDocument();
  });
}); 