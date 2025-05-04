import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ContactCard from './ContactCard';
import { ContactEntity } from '../../lib/contactDataService';

describe('ContactCard', () => {
  it('should render a contact with display name', () => {
    // Create a simple contact with minimal properties
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [],
      roles: [],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} />);
    
    // Check that display name is rendered
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });
  
  it('should render contact with extension', () => {
    // Contact with extension contact point
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [
        { type: 'desk-extension', value: '1234', source: 'test' }
      ],
      roles: [],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} />);
    
    // Check that extension is rendered
    expect(screen.getByText('1234')).toBeInTheDocument();
  });
  
  it('should render contact with multiple contact points', () => {
    // Contact with multiple contact points
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [
        { type: 'desk-extension', value: '1234', source: 'test' },
        { type: 'mobile', value: '123-456-7890', source: 'test' },
        { type: 'email', value: 'john@example.com', source: 'test' }
      ],
      roles: [],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} />);
    
    // Check that all contact points are rendered
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('should render contact with role information', () => {
    // Contact with roles
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [],
      roles: [
        { office: 'PLY', brand: 'tsa', priority: 1, title: 'Manager' }
      ],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} showRoles={true} />);
    
    // Check that role information is rendered
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('PLY')).toBeInTheDocument();
  });
  
  it('should render contact with multiple roles', () => {
    // Contact with multiple roles
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [],
      roles: [
        { office: 'PLY', brand: 'tsa', priority: 1, title: 'Manager' },
        { office: 'FTL', brand: 'cts', priority: 2, title: 'Consultant' }
      ],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} showRoles={true} />);
    
    // Check that both roles are rendered
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('PLY')).toBeInTheDocument();
    expect(screen.getByText('Consultant')).toBeInTheDocument();
    expect(screen.getByText('FTL')).toBeInTheDocument();
  });
  
  it('should highlight search text when provided', () => {
    // Create a simple contact
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [],
      roles: [],
      kind: 'external'
    };
    
    render(<ContactCard contact={contact} highlightText="John" />);
    
    // Check that the highlighted text is in a mark element
    const markElement = screen.getByText('John');
    expect(markElement.tagName).toBe('MARK');
  });
  
  it('should render in compact mode with a kind badge', () => {
    // Create a simple contact
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [
        { type: 'desk-extension', value: '1234', source: 'test' }
      ],
      roles: [],
      kind: 'external'
    };
    
    // Test compact mode
    const { getByText } = render(<ContactCard contact={contact} compact={true} />);
    
    // Kind badge should be present in compact mode
    expect(getByText('Employee')).toBeInTheDocument();
  });
  
  it('should not show kind badge in non-compact mode', () => {
    // Create a simple contact
    const contact: ContactEntity = {
      id: 'test-id-1',
      displayName: 'John Smith',
      contactPoints: [
        { type: 'desk-extension', value: '1234', source: 'test' }
      ],
      roles: [],
      kind: 'external'
    };
    
    // Test non-compact mode
    const { queryByText } = render(<ContactCard contact={contact} compact={false} />);
    
    // Kind badge should not be present in non-compact mode
    expect(queryByText('Employee')).not.toBeInTheDocument();
  });
}); 