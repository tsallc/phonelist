import React from 'react';
import { useContactData } from '../contexts/ContactDataContext';
import {
  Phone,
  MapPin,
  Mail,
  User,
  Building,
  Volume2
} from 'lucide-react';
import './PrintableDirectory.css'; // Will create this for print-specific styles

// Define types for our filtered contacts
interface ContactExtension {
  name: string;
  extension: string;
}

interface ContactMobile {
  name: string;
  mobile: string;
}

const PrintableDirectory: React.FC = () => {
  const {
    contacts,
    loading,
    error,
  } = useContactData();

  // Early return for loading state
  if (loading) {
    return <div className="text-center p-4">Loading contact information...</div>;
  }

  // Error state
  if (error && !contacts.length) {
    return (
      <div className="text-center p-4 text-red-600">
        Error loading contact data: {error.message}
      </div>
    );
  }

  // Filter contacts for different sections
  const getMichiganExtensions = (): ContactExtension[] => {
    return contacts
      .filter(contact => 
        contact.roles.some(role => role.office === 'PLY') && 
        contact.contactPoints.some(cp => cp.type === 'desk-extension')
      )
      .map(contact => ({
        name: contact.displayName.split(' ')[0], // Just first name for extensions
        extension: contact.contactPoints.find(cp => cp.type === 'desk-extension')?.value || ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getFloridaExtensions = (): ContactExtension[] => {
    return contacts
      .filter(contact => 
        contact.roles.some(role => role.office === 'FTL') && 
        contact.contactPoints.some(cp => cp.type === 'desk-extension')
      )
      .map(contact => ({
        name: contact.displayName.split(' ')[0], // Just first name for extensions
        extension: contact.contactPoints.find(cp => cp.type === 'desk-extension')?.value || ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getCellPhones = (): ContactMobile[] => {
    return contacts
      .filter(contact => 
        contact.contactPoints.some(cp => cp.type === 'mobile')
      )
      .map(contact => ({
        name: contact.displayName, // Full name for cell phones
        mobile: contact.contactPoints.find(cp => cp.type === 'mobile')?.value || ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Type-specific grouping functions instead of a generic one
  const groupMichiganExtensions = (items: ContactExtension[]): [ContactExtension, ContactExtension?][] => {
    const pairs: [ContactExtension, ContactExtension?][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([
        items[i],
        items[i + 1] // Might be undefined
      ]);
    }
    return pairs;
  };

  const groupFloridaExtensions = (items: ContactExtension[]): [ContactExtension, ContactExtension?][] => {
    const pairs: [ContactExtension, ContactExtension?][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([
        items[i],
        items[i + 1] // Might be undefined
      ]);
    }
    return pairs;
  };

  const groupCellPhones = (items: ContactMobile[]): [ContactMobile, ContactMobile?][] => {
    const pairs: [ContactMobile, ContactMobile?][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([
        items[i],
        items[i + 1] // Might be undefined
      ]);
    }
    return pairs;
  };

  const michiganPairs = groupMichiganExtensions(getMichiganExtensions());
  const floridaPairs = groupFloridaExtensions(getFloridaExtensions());
  const cellPairs = groupCellPhones(getCellPhones());

  return (
    <div className="app-container printable-directory">
      {/* Compact Header */}
      <div className="app-header">
        <h2 className="text-lg font-bold">Title Solutions Agency, LLC</h2>
        <div className="flex items-center space-x-3 text-xs">
          <div className="icon-text">
            <Phone className="icon-sm" />
            <span>800-276-TITL (8485)</span>
          </div>
          <div className="inline">MI #: 0098913</div>
          <div className="inline">TT #: W860061</div>
          <div className="inline">FL #: W140162</div>
        </div>
      </div>

      {/* Top Info Section */}
      <div className="secondary-info">
        {/* Email Addresses */}
        <div className="info-section">
          <h3 className="section-header">
            <Mail className="icon-md" />
            Email Addresses
          </h3>
          <div className="px-2">
            <div className="email-section">
              <div>
                <div className="email-category">Scheduling, Closing Docs:</div>
                <a href="mailto:docs@titlesolutionsllc.com" className="email-link">docs@titlesolutionsllc.com</a>
              </div>
              <div>
                <div className="email-category">New Orders, Title Revisions/Updates, CPLs:</div>
                <a href="mailto:title@titlesolutionsllc.com" className="email-link">title@titlesolutionsllc.com</a>
              </div>
              <div>
                <div className="email-category">Final Water Bills, Tax Bills, Key Exchanges:</div>
                <a href="mailto:funding@titlesolutionsllc.com" className="email-link">funding@titlesolutionsllc.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Intercom */}
        <div>
          <h3 className="section-header">
            <Volume2 className="icon-md" />
            PAGE / INTERCOM
          </h3>
          <div className="px-2">
            <div className="flex space-x-4 items-center">
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600 mr-1">Downstairs:</span>
                <span className="text-primary font-bold text-sm">500</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600 mr-1">Upstairs:</span>
                <span className="text-primary font-bold text-sm">501</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600 mr-1">Both Floors:</span>
                <span className="text-primary font-bold text-sm">510</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-gray-600 mr-1">Cordless:</span>
                <span className="text-primary font-bold text-sm">1110</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locations Section */}
      <div className="directory-section">
        <div className="grid-container pt-4">
          {/* Michigan Office Card */}
          <div className="location-card relative p-4 border rounded shadow-sm mb-4 hover:shadow-md transition-shadow pb-8">
            {/* Clickable Address Block */}
            <a href="https://www.google.com/maps/search/?api=1&query=41486+Wilcox+Rd,+Suite+2,+Plymouth,+MI+48170" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors mb-2">
              <p className="text-base font-semibold">41486 Wilcox Rd., Suite 2</p>
              <p className="text-base">Plymouth, MI 48170</p>
            </a>
            {/* Single Line Phone/Fax */}
            <p className="text-sm text-gray-700">
              <a href="tel:734-259-7130" className="hover:text-primary transition-colors">
                Phone: 734-259-7130
              </a>
              <span className="ml-4">
                Fax: 734-259-7131, -7132
              </span>
              {/* Location Label (Absolutely Positioned) */}
              <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                Michigan Office
              </span>
            </p>
          </div>

          {/* Florida Office Card */}
          <div className="location-card relative p-4 border rounded shadow-sm mb-4 hover:shadow-md transition-shadow pb-8">
            {/* Clickable Address Block */}
            <a href="https://www.google.com/maps/search/?api=1&query=333+Las+Olas+Way+CU315,+Ft.+Lauderdale,+FL+33301" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors mb-2">
              <p className="text-base font-semibold">333 Las Olas Way CU315</p>
              <p className="text-base">Ft. Lauderdale, FL 33301</p>
            </a>
            {/* Single Line Phone/Fax */}
            <p className="text-sm text-gray-700">
              <a href="tel:954-519-2477" className="hover:text-primary transition-colors">
                Phone: 954-519-2477
              </a>
              <span className="ml-4">
                Fax: 954-246-4670
              </span>
              {/* Location Label (Absolutely Positioned) */}
              <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                Florida Office
              </span>
            </p>
          </div>

          {/* Downtown Office Card */}
          <div className="location-card relative p-4 border rounded shadow-sm mb-4 hover:shadow-md transition-shadow pb-8">
            {/* Clickable Address Block */}
            <a href="https://www.google.com/maps/search/?api=1&query=601+S+Harbour+Island+Blvd,+Ste+133,+Tampa,+FL+33602" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors mb-2">
              <p className="text-base font-semibold">601 S Harbour Island Blvd., Ste 133</p>
              <p className="text-base">Tampa, FL 33602</p>
            </a>
            {/* Single Line Phone/Fax - Refined Placeholders */}
            <p className="text-sm text-gray-700">
              <span className="text-gray-400 italic">Phone: —</span> 
              <span className="ml-4 text-gray-400 italic">
                Fax: N/A
              </span>
              {/* Location Label (Absolutely Positioned) */}
              <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                Downtown – Coastal Title Solutions
              </span>
            </p>
          </div>

          {/* REO Office Card */}
          <div className="location-card relative p-4 border rounded shadow-sm mb-4 hover:shadow-md transition-shadow pb-8">
            {/* Clickable Address Block */}
            <a href="https://www.google.com/maps/search/?api=1&query=550+N+Reo+Street,+Ste+300,+Tampa,+FL+33609" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors mb-2">
              <p className="text-base font-semibold">550 N Reo Street, Ste 300</p> 
              <p className="text-base">Tampa, FL 33609</p>
            </a>
            {/* Single Line Phone/Fax - Refined Placeholders */}
            <p className="text-sm text-gray-700">
              <span className="text-gray-400 italic">Phone: —</span> 
              <span className="ml-4 text-gray-400 italic">
                Fax: N/A
              </span>
              {/* Location Label (Absolutely Positioned) */}
              <span className="absolute bottom-3 right-4 text-xs text-gray-500">
                REO – Coastal Title Solutions
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="p-2 bg-background">
        <h3 className="section-header">
          <Phone className="icon-md" />
          Contact Directory
        </h3>

        {/* Michigan Extensions */}
        <div className="mb-1.5">
          <h4 className="section-subheader">
            <MapPin className="icon-sm" />
            Michigan Extensions
          </h4>
          <div className="px-2">
            <div className="directory-grid grid grid-cols-4 gap-x-4 gap-y-1">
              {michiganPairs.map((pair, index) => (
                <React.Fragment key={`mi-${index}`}>
                  <div className="text-sm text-gray-600">{pair[0].name}</div>
                  <div className="text-sm font-semibold text-primary">{pair[0].extension}</div>
                  {pair[1] ? (
                    <>
                      <div className="text-sm text-gray-600">{pair[1].name}</div>
                      <div className="text-sm font-semibold text-primary">{pair[1].extension}</div>
                    </>
                  ) : (
                    // Empty placeholders for odd-numbered lists
                    <>
                      <div className="text-sm text-gray-600"></div>
                      <div className="text-sm font-semibold text-primary"></div>
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Florida Extensions */}
        <div className="mb-1.5">
          <h4 className="section-subheader">
            <MapPin className="icon-sm" />
            Florida Extensions
          </h4>
          <div className="px-2">
            <div className="directory-grid grid grid-cols-4 gap-x-4 gap-y-1">
              {floridaPairs.map((pair, index) => (
                <React.Fragment key={`fl-${index}`}>
                  <div className="text-sm text-gray-600">{pair[0].name}</div>
                  <div className="text-sm font-semibold text-primary">{pair[0].extension}</div>
                  {pair[1] ? (
                    <>
                      <div className="text-sm text-gray-600">{pair[1].name}</div>
                      <div className="text-sm font-semibold text-primary">{pair[1].extension}</div>
                    </>
                  ) : (
                    // Empty placeholders for odd-numbered lists
                    <>
                      <div className="text-sm text-gray-600"></div>
                      <div className="text-sm font-semibold text-primary"></div>
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* IT Department */}
        <div className="mb-1.5">
          <h4 className="section-subheader">
            <User className="icon-sm" />
            IT Department
          </h4>
          <div className="px-2">
            <div className="directory-grid grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-sm text-gray-600">Will</div>
              <div className="text-sm font-semibold text-primary">248-619-4535</div>
              {/* Additional IT staff would go here */}
            </div>
          </div>
        </div>

        {/* Cell Phone Numbers */}
        <div className="mb-1.5">
          <h4 className="section-subheader">
            <Phone className="icon-sm" />
            Cell Phone Numbers
          </h4>
          <div className="px-2">
            <div className="directory-grid grid grid-cols-4 gap-x-4 gap-y-1">
              {cellPairs.map((pair, index) => (
                <React.Fragment key={`cell-${index}`}>
                  <div className="text-sm text-gray-600">{pair[0].name}</div>
                  <div className="text-sm font-semibold text-primary">
                    {pair[0].mobile.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                  </div>
                  {pair[1] ? (
                    <>
                      <div className="text-sm text-gray-600">{pair[1].name}</div>
                      <div className="text-sm font-semibold text-primary">
                        {pair[1].mobile.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                      </div>
                    </>
                  ) : (
                    // Empty placeholders for odd-numbered lists
                    <>
                      <div className="text-sm text-gray-600"></div>
                      <div className="text-sm font-semibold text-primary"></div>
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Treasurers / Additional Numbers */}
        <div className="pb-1">
          <h4 className="section-subheader">
            <Building className="icon-sm" />
            Treasurers / Additional Numbers
          </h4>
          <div className="px-2">
            <div className="directory-grid grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-sm text-gray-600">Wayne County</div>
              <div className="text-sm font-semibold text-primary">313-224-5990</div>
              <div className="text-sm text-gray-600">Oakland County</div>
              <div className="text-sm font-semibold text-primary">888-600-3773</div>
              
              <div className="text-sm text-gray-600">Oakland DELQ</div>
              <div className="text-sm font-semibold text-primary">248-858-0611</div>
              <div className="text-sm text-gray-600">Bankruptcy</div>
              <div className="text-sm font-semibold text-primary">866-222-8029</div>
              
              <div className="text-sm text-gray-600">Peter&apos;s Office</div>
              <div className="text-sm font-semibold text-primary">248-626-9966</div>
              <div className="text-sm text-gray-600">Qualia</div>
              <div className="text-sm font-semibold text-primary">855-677-7533</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableDirectory; 