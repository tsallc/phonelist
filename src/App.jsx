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
          {/* Michigan Office Card - Final Polish */}
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

          {/* Florida Office Card - Final Polish */}
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

          {/* Downtown Office Card - Final Polish */}
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

          {/* REO Office Card - Final Polish */}
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
              <div className="text-sm text-gray-600">Andrew</div>
              <div className="text-sm font-semibold text-primary">1006</div>
              <div className="text-sm text-gray-600">Becca</div>
              <div className="text-sm font-semibold text-primary">2100</div>
              
              <div className="text-sm text-gray-600">Brian</div>
              <div className="text-sm font-semibold text-primary">1014</div>
              <div className="text-sm text-gray-600">Georgia</div>
              <div className="text-sm font-semibold text-primary">1015</div>
              
              <div className="text-sm text-gray-600">Grace</div>
              <div className="text-sm font-semibold text-primary">1003</div>
              <div className="text-sm text-gray-600">Jessie</div>
              <div className="text-sm font-semibold text-primary">1010</div>
              
              <div className="text-sm text-gray-600">Kathy</div>
              <div className="text-sm font-semibold text-primary">1007</div>
              <div className="text-sm text-gray-600">Katie</div>
              <div className="text-sm font-semibold text-primary">1012</div>
              
              <div className="text-sm text-gray-600">Pam</div>
              <div className="text-sm font-semibold text-primary">1016</div>
              <div className="text-sm text-gray-600">Robin</div>
              <div className="text-sm font-semibold text-primary">1013</div>
              
              <div className="text-sm text-gray-600">Sarah</div>
              <div className="text-sm font-semibold text-primary">1000</div>
              <div className="text-sm text-gray-600">Sydney</div>
              <div className="text-sm font-semibold text-primary">1008</div>
              
              <div className="text-sm text-gray-600">Tina</div>
              <div className="text-sm font-semibold text-primary">1027</div>
              <div className="text-sm text-gray-600">Troy</div>
              <div className="text-sm font-semibold text-primary">2101</div>
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
              <div className="text-sm text-gray-600">Andrea</div>
              <div className="text-sm font-semibold text-primary">2026</div>
              <div className="text-sm text-gray-600">Brian</div>
              <div className="text-sm font-semibold text-primary">2024</div>
              
              <div className="text-sm text-gray-600">Sydney</div>
              <div className="text-sm font-semibold text-primary">2020</div>
              <div className="text-sm text-gray-600">Tina</div>
              <div className="text-sm font-semibold text-primary">2027</div>
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
              <div className="text-sm text-gray-600">Brian Tiller</div>
              <div className="text-sm font-semibold text-primary">248-563-1443</div>
              <div className="text-sm text-gray-600">Colin Fabian</div>
              <div className="text-sm font-semibold text-primary">248-497-6052</div>
              
              <div className="text-sm text-gray-600">Curt White</div>
              <div className="text-sm font-semibold text-primary">734-717-5700</div>
              <div className="text-sm text-gray-600">Kyle Smith</div>
              <div className="text-sm font-semibold text-primary">586-675-3300</div>
              
              <div className="text-sm text-gray-600">Peter Joelson</div>
              <div className="text-sm font-semibold text-primary">248-961-4201</div>
              <div className="text-sm text-gray-600">Tina Tiller</div>
              <div className="text-sm font-semibold text-primary">248-563-1266</div>
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
              
              <div className="text-sm text-gray-600">Peter's Office</div>
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
