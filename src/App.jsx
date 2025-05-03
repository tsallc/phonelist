import "./App.css";
import { useState } from "react";
import ArtifactCode from "./ArtifactCode";
import { 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building, 
  Printer,
  Volume2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";

// Contact Directory Component
const ContactDirectory = () => {
  return (
    <div className="app-container">
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
            <div className="flex">
              <div className="w-24 text-xs font-medium text-gray-600">Downstairs</div>
              <div className="w-16 text-primary font-bold text-sm">500</div>
              <div className="w-24 text-xs font-medium text-gray-600">Upstairs</div>
              <div className="text-primary font-bold text-sm">501</div>
            </div>
            <div className="flex">
              <div className="w-24 text-xs font-medium text-gray-600">Both Floors</div>
              <div className="w-16 text-primary font-bold text-sm">510</div>
              <div className="w-24 text-xs font-medium text-gray-600">Cordless</div>
              <div className="text-primary font-bold text-sm">1110</div>
            </div>
          </div>
        </div>
      </div>

      {/* Locations Section */}
      <div className="directory-section">
        <h3 className="section-header">
          <MapPin className="icon-md" />
          Office Locations
        </h3>

        <div className="grid-container">
          <div className="location-card">
            <h4 className="location-name">
              <Building className="icon-sm text-primary" />
              Michigan Office
            </h4>
            <div className="contact-info">
              <p>41486 Wilcox Rd., Suite 2</p>
              <p>Plymouth, MI 48170</p>
              <div className="icon-text">
                <Phone className="icon-sm text-muted-foreground" />
                <span>734-259-7130</span>
              </div>
              <div className="icon-text">
                <Printer className="icon-sm text-muted-foreground" />
                <span>Fax: 734-259-7131 & 734-259-7132</span>
              </div>
            </div>
          </div>

          <div className="location-card">
            <h4 className="location-name">
              <Building className="icon-sm text-primary" />
              Florida Office
            </h4>
            <div className="contact-info">
              <p>333 Las Olas Way CU315</p>
              <p>Ft. Lauderdale, FL 33301</p>
              <div className="icon-text">
                <Phone className="icon-sm text-muted-foreground" />
                <span>954-519-2477</span>
              </div>
              <div className="icon-text">
                <Printer className="icon-sm text-muted-foreground" />
                <span>Fax: 954-246-4670</span>
              </div>
            </div>
          </div>

          <div className="location-card">
            <h4 className="location-name">
              <Building className="icon-sm text-primary" />
              Downtown – Coastal Title Solutions
            </h4>
            <div className="contact-info">
              <p>601 S Harbour Island Blvd., Ste 133</p>
              <p>Tampa, FL 33602</p>
            </div>
          </div>

          <div className="location-card">
            <h4 className="location-name">
              <Building className="icon-sm text-primary" />
              REO – Coastal Title Solutions
            </h4>
            <div className="contact-info">
              <p>550 N Reo Street., Ste 300</p>
              <p>Tampa, FL 33609</p>
            </div>
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
        <div className="mb-3">
          <h4 className="section-subheader">
            <MapPin className="icon-sm" />
            Michigan Extensions
          </h4>
          <div className="px-2">
            <div className="directory-grid">
              <div className="contact-label">Andrew</div>
              <div className="contact-value">1006</div>
              <div className="contact-label">Becca</div>
              <div className="contact-value">2100</div>
              
              <div className="contact-label">Brian</div>
              <div className="contact-value">1014</div>
              <div className="contact-label">Georgia</div>
              <div className="contact-value">1015</div>
              
              <div className="contact-label">Grace</div>
              <div className="contact-value">1003</div>
              <div className="contact-label">Jessie</div>
              <div className="contact-value">1010</div>
              
              <div className="contact-label">Kathy</div>
              <div className="contact-value">1007</div>
              <div className="contact-label">Katie</div>
              <div className="contact-value">1012</div>
              
              <div className="contact-label">Pam</div>
              <div className="contact-value">1016</div>
              <div className="contact-label">Robin</div>
              <div className="contact-value">1013</div>
              
              <div className="contact-label">Sarah</div>
              <div className="contact-value">1000</div>
              <div className="contact-label">Sydney</div>
              <div className="contact-value">1008</div>
              
              <div className="contact-label">Tina</div>
              <div className="contact-value">1027</div>
              <div className="contact-label">Troy</div>
              <div className="contact-value">2101</div>
            </div>
          </div>
        </div>

        {/* Florida Extensions */}
        <div className="mb-3">
          <h4 className="section-subheader">
            <MapPin className="icon-sm" />
            Florida Extensions
          </h4>
          <div className="px-2">
            <div className="directory-grid">
              <div className="contact-label">Andrea</div>
              <div className="contact-value">2026</div>
              <div className="contact-label">Brian</div>
              <div className="contact-value">2024</div>
              
              <div className="contact-label">Sydney</div>
              <div className="contact-value">2020</div>
              <div className="contact-label">Tina</div>
              <div className="contact-value">2027</div>
            </div>
          </div>
        </div>

        {/* IT Department */}
        <div className="mb-3">
          <h4 className="section-subheader">
            <User className="icon-sm" />
            IT Department
          </h4>
          <div className="px-2">
            <div className="flex">
              <div className="contact-label w-24">Will</div>
              <div className="contact-value !text-left">248-619-4535</div>
            </div>
          </div>
        </div>

        {/* Cell Phone Numbers */}
        <div className="mb-3">
          <h4 className="section-subheader">
            <Phone className="icon-sm" />
            Cell Phone Numbers
          </h4>
          <div className="px-2">
            <div className="directory-grid">
              <div className="contact-label">Brian Tiller</div>
              <div className="contact-value">248-563-1443</div>
              <div className="contact-label">Colin Fabian</div>
              <div className="contact-value">248-497-6052</div>
              
              <div className="contact-label">Curt White</div>
              <div className="contact-value">734-717-5700</div>
              <div className="contact-label">Kyle Smith</div>
              <div className="contact-value">586-675-3300</div>
              
              <div className="contact-label">Peter Joelson</div>
              <div className="contact-value">248-961-4201</div>
              <div className="contact-label">Tina Tiller</div>
              <div className="contact-value">248-563-1266</div>
            </div>
          </div>
        </div>

        {/* Treasurers / Additional Numbers */}
        <div>
          <h4 className="section-subheader">
            <Building className="icon-sm" />
            Treasurers / Additional Numbers
          </h4>
          <div className="px-2">
            <div className="directory-grid">
              <div className="contact-label">Wayne County</div>
              <div className="contact-value">313-224-5990</div>
              <div className="contact-label">Oakland County</div>
              <div className="contact-value">888-600-3773</div>
              
              <div className="contact-label">Oakland DELQ</div>
              <div className="contact-value">248-858-0611</div>
              <div className="contact-label">Bankruptcy</div>
              <div className="contact-value">866-222-8029</div>
              
              <div className="contact-label">Peter's Office</div>
              <div className="contact-value">248-626-9966</div>
              <div className="contact-label">Qualia</div>
              <div className="contact-value">855-677-7533</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState("contact");

  return (
    <>
      <Tabs defaultValue="contact" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-primary rounded-none border-none">
          <TabsTrigger 
            value="contact" 
            className={`text-sm font-medium ${activeTab === "contact" ? 'bg-background text-primary' : 'text-primary-foreground hover:bg-primary-foreground/10'}`}
          >
            <Phone className="icon-md" /> 
            Contact Directory
          </TabsTrigger>
          <TabsTrigger 
            value="map"
            className={`text-sm font-medium ${activeTab === "map" ? 'bg-background text-primary' : 'text-primary-foreground hover:bg-primary-foreground/10'}`}
          >
            <MapPin className="icon-md" />
            Office Map
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contact" className="mt-0 p-0">
          <ContactDirectory />
        </TabsContent>
        
        <TabsContent value="map" className="mt-0 p-0">
          <ArtifactCode />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default App;
