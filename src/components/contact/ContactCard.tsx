import React from 'react';
import { ContactEntity, ContactPoint, Role } from '../../lib/contactDataService';
import { Phone, Mail, Building, MapPin, Briefcase } from 'lucide-react';

// Type definition for the ContactCard props
interface ContactCardProps {
  contact: ContactEntity;
  className?: string;
  compact?: boolean;
  highlightText?: string;
  showRoles?: boolean;
}

// Helper function to highlight searched text
const highlightMatch = (text: string, highlight: string) => {
  if (!highlight || !text) return text;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === highlight.toLowerCase() 
      ? <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark> 
      : part
  );
};

// Component to render a contact point with appropriate icon
const ContactPointDisplay: React.FC<{
  contactPoint: ContactPoint;
  highlightText?: string;
}> = ({ contactPoint, highlightText }) => {
  // Determine icon based on contact point type
  let Icon = Phone;
  let label = 'Phone';
  let href = '';
  
  if (contactPoint.type.includes('mobile')) {
    Icon = Phone;
    label = 'Mobile';
    href = `tel:${contactPoint.value}`;
  } else if (contactPoint.type.includes('extension')) {
    Icon = Phone;
    label = 'Ext';
    // No href for extensions
  } else if (contactPoint.type.includes('email')) {
    Icon = Mail;
    label = 'Email';
    href = `mailto:${contactPoint.value}`;
  }
  
  return (
    <div className="flex items-center text-sm text-gray-600 mb-1">
      <Icon className="h-4 w-4 mr-1.5 text-primary" />
      <span className="font-medium mr-1">{label}:</span>
      {href ? (
        <a 
          href={href} 
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
        >
          {highlightText 
            ? highlightMatch(contactPoint.value, highlightText) 
            : contactPoint.value}
        </a>
      ) : (
        <span>
          {highlightText 
            ? highlightMatch(contactPoint.value, highlightText) 
            : contactPoint.value}
        </span>
      )}
    </div>
  );
};

// Component to render a role with appropriate icon
const RoleDisplay: React.FC<{
  role: Role;
  brand?: string | null;
}> = ({ role, brand }) => {
  return (
    <div className="flex items-center text-sm text-gray-600 mb-1">
      <div className="flex items-center">
        <MapPin className="h-4 w-4 mr-1.5 text-primary" />
        <span className="font-medium mr-1">Office:</span>
        <span>{role.office}</span>
      </div>
      {role.title && (
        <div className="flex items-center ml-3">
          <Briefcase className="h-4 w-4 mr-1.5 text-primary" />
          <span className="font-medium mr-1">Title:</span>
          <span>{role.title}</span>
        </div>
      )}
      {brand && brand !== role.brand && (
        <div className="flex items-center ml-3">
          <Building className="h-4 w-4 mr-1.5 text-primary" />
          <span className="font-medium mr-1">Brand:</span>
          <span>{role.brand}</span>
        </div>
      )}
    </div>
  );
};

// Main ContactCard component
const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  className = '',
  compact = false,
  highlightText,
  showRoles = true
}) => {
  // Don't render if no contact
  if (!contact) return null;
  
  // Default brand from first role
  const defaultBrand = contact.roles?.[0]?.brand || null;
  
  return (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-background ${className}`}>
      {/* Card Header with Name and Department */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold">
          {highlightText 
            ? highlightMatch(contact.displayName, highlightText) 
            : contact.displayName}
        </h3>
        {contact.department && (
          <div className="text-sm text-gray-600">
            <Building className="h-4 w-4 inline-block mr-1.5 text-primary" />
            {contact.department}
          </div>
        )}
        {contact.title && (
          <div className="text-sm text-gray-600">
            <Briefcase className="h-4 w-4 inline-block mr-1.5 text-primary" />
            {contact.title}
          </div>
        )}
      </div>
      
      {/* Contact Points */}
      <div className="mb-2">
        {contact.contactPoints.map((cp, index) => (
          <ContactPointDisplay 
            key={`${cp.type}-${index}`} 
            contactPoint={cp} 
            highlightText={highlightText}
          />
        ))}
        
        {/* Show message if no contact methods */}
        {contact.contactPoints.length === 0 && (
          <div className="text-sm text-gray-500 italic">No contact information available</div>
        )}
      </div>
      
      {/* Roles - Only show if requested and if contact has roles */}
      {showRoles && contact.roles && contact.roles.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          {contact.roles.map((role, index) => (
            <RoleDisplay 
              key={`${role.office}-${index}`} 
              role={role}
              brand={contact.roles.length > 1 ? defaultBrand : undefined}
            />
          ))}
        </div>
      )}
      
      {/* Kind badge - only in compact mode */}
      {compact && (
        <div className="mt-2">
          <span className={`inline-block px-2 py-0.5 text-xs rounded-full 
            ${contact.kind === 'external' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-200 text-gray-700'}`}
          >
            {contact.kind === 'external' ? 'Employee' : 'Resource'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactCard; 