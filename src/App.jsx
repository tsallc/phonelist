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
    <div className="bg-white overflow-hidden">
      {/* Compact Header */}
      <div className="bg-blue-600 py-2 px-4 text-white flex flex-wrap justify-between items-center">
        <h2 className="text-lg font-bold">Title Solutions Agency, LLC</h2>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            <span>800-276-TITL (8485)</span>
          </div>
          <div className="inline">MI #: 0098913</div>
          <div className="inline">TT #: W860061</div>
          <div className="inline">FL #: W140162</div>
        </div>
      </div>

      {/* Top Info Section */}
      <div className="p-2 bg-blue-50">
        {/* Email Addresses */}
        <div className="mb-2">
          <h3 className="text-sm font-bold flex items-center text-blue-700 py-1 px-2">
            <Mail className="w-4 h-4 mr-2" />
            Email Addresses
          </h3>
          <div className="px-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Scheduling, Closing Docs:</div>
                <a href="mailto:docs@titlesolutionsllc.com" className="text-blue-600 text-sm">docs@titlesolutionsllc.com</a>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">New Orders, Title Revisions/Updates, CPLs:</div>
                <a href="mailto:title@titlesolutionsllc.com" className="text-blue-600 text-sm">title@titlesolutionsllc.com</a>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Final Water Bills, Tax Bills, Key Exchanges:</div>
                <a href="mailto:funding@titlesolutionsllc.com" className="text-blue-600 text-sm">funding@titlesolutionsllc.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Intercom */}
        <div>
          <h3 className="text-sm font-bold flex items-center text-blue-700 py-1 px-2">
            <Volume2 className="w-4 h-4 mr-2" />
            PAGE / INTERCOM
          </h3>
          <div className="px-2">
            <div className="flex">
              <div className="w-24 text-xs font-medium text-gray-600">Downstairs</div>
              <div className="w-16 text-blue-600 font-bold text-sm">500</div>
              <div className="w-24 text-xs font-medium text-gray-600">Upstairs</div>
              <div className="text-blue-600 font-bold text-sm">501</div>
            </div>
            <div className="flex">
              <div className="w-24 text-xs font-medium text-gray-600">Both Floors</div>
              <div className="w-16 text-blue-600 font-bold text-sm">510</div>
              <div className="w-24 text-xs font-medium text-gray-600">Cordless</div>
              <div className="text-blue-600 font-bold text-sm">1110</div>
            </div>
          </div>
        </div>
      </div>

      {/* Locations Section */}
      <div className="p-2 border-t border-b border-gray-200 bg-white">
        <h3 className="text-sm font-bold text-blue-700 py-1 px-2 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Office Locations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2">
          <div className="border-l-4 border-blue-400 pl-2 py-1">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <Building className="w-4 h-4 mr-1 text-blue-500" />
              Michigan Office
            </h4>
            <div className="ml-5 space-y-0.5 text-xs text-gray-600">
              <p>41486 Wilcox Rd., Suite 2</p>
              <p>Plymouth, MI 48170</p>
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-1 text-gray-500" />
                <span>734-259-7130</span>
              </div>
              <div className="flex items-center">
                <Printer className="w-3 h-3 mr-1 text-gray-500" />
                <span>Fax: 734-259-7131 & 734-259-7132</span>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-blue-400 pl-2 py-1">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <Building className="w-4 h-4 mr-1 text-blue-500" />
              Florida Office
            </h4>
            <div className="ml-5 space-y-0.5 text-xs text-gray-600">
              <p>333 Las Olas Way CU315</p>
              <p>Ft. Lauderdale, FL 33301</p>
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-1 text-gray-500" />
                <span>954-519-2477</span>
              </div>
              <div className="flex items-center">
                <Printer className="w-3 h-3 mr-1 text-gray-500" />
                <span>Fax: 954-246-4670</span>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-blue-400 pl-2 py-1">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <Building className="w-4 h-4 mr-1 text-blue-500" />
              Downtown – Coastal Title Solutions
            </h4>
            <div className="ml-5 space-y-0.5 text-xs text-gray-600">
              <p>601 S Harbour Island Blvd., Ste 133</p>
              <p>Tampa, FL 33602</p>
            </div>
          </div>

          <div className="border-l-4 border-blue-400 pl-2 py-1">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <Building className="w-4 h-4 mr-1 text-blue-500" />
              REO – Coastal Title Solutions
            </h4>
            <div className="ml-5 space-y-0.5 text-xs text-gray-600">
              <p>550 N Reo Street., Ste 300</p>
              <p>Tampa, FL 33609</p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="p-2 bg-white">
        <h3 className="text-sm font-bold text-blue-700 py-1 px-2 flex items-center">
          <Phone className="w-4 h-4 mr-2" />
          Contact Directory
        </h3>

        {/* Michigan Extensions */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-blue-700 mb-1 px-2 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            Michigan Extensions
          </h4>
          <div className="px-2">
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-700">Andrew</div>
              <div className="text-xs text-blue-600 font-medium text-right">1006</div>
              <div className="text-xs text-gray-700">Becca</div>
              <div className="text-xs text-blue-600 font-medium text-right">2100</div>
              
              <div className="text-xs text-gray-700">Brian</div>
              <div className="text-xs text-blue-600 font-medium text-right">1014</div>
              <div className="text-xs text-gray-700">Georgia</div>
              <div className="text-xs text-blue-600 font-medium text-right">1015</div>
              
              <div className="text-xs text-gray-700">Grace</div>
              <div className="text-xs text-blue-600 font-medium text-right">1003</div>
              <div className="text-xs text-gray-700">Jessie</div>
              <div className="text-xs text-blue-600 font-medium text-right">1010</div>
              
              <div className="text-xs text-gray-700">Kathy</div>
              <div className="text-xs text-blue-600 font-medium text-right">1007</div>
              <div className="text-xs text-gray-700">Katie</div>
              <div className="text-xs text-blue-600 font-medium text-right">1012</div>
              
              <div className="text-xs text-gray-700">Pam</div>
              <div className="text-xs text-blue-600 font-medium text-right">1016</div>
              <div className="text-xs text-gray-700">Robin</div>
              <div className="text-xs text-blue-600 font-medium text-right">1013</div>
              
              <div className="text-xs text-gray-700">Sarah</div>
              <div className="text-xs text-blue-600 font-medium text-right">1000</div>
              <div className="text-xs text-gray-700">Sydney</div>
              <div className="text-xs text-blue-600 font-medium text-right">1008</div>
              
              <div className="text-xs text-gray-700">Tina</div>
              <div className="text-xs text-blue-600 font-medium text-right">1027</div>
              <div className="text-xs text-gray-700">Troy</div>
              <div className="text-xs text-blue-600 font-medium text-right">2101</div>
            </div>
          </div>
        </div>

        {/* Florida Extensions */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-blue-700 mb-1 px-2 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            Florida Extensions
          </h4>
          <div className="px-2">
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-700">Andrea</div>
              <div className="text-xs text-blue-600 font-medium text-right">2026</div>
              <div className="text-xs text-gray-700">Brian</div>
              <div className="text-xs text-blue-600 font-medium text-right">2024</div>
              
              <div className="text-xs text-gray-700">Sydney</div>
              <div className="text-xs text-blue-600 font-medium text-right">2020</div>
              <div className="text-xs text-gray-700">Tina</div>
              <div className="text-xs text-blue-600 font-medium text-right">2027</div>
            </div>
          </div>
        </div>

        {/* IT Department */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-blue-700 mb-1 px-2 flex items-center">
            <User className="w-3 h-3 mr-1" />
            IT Department
          </h4>
          <div className="px-2">
            <div className="flex">
              <div className="text-xs text-gray-700 w-24">Will</div>
              <div className="text-xs text-blue-600 font-medium">248-619-4535</div>
            </div>
          </div>
        </div>

        {/* Cell Phone Numbers */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-blue-700 mb-1 px-2 flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            Cell Phone Numbers
          </h4>
          <div className="px-2">
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-700">Brian Tiller</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-563-1443</div>
              <div className="text-xs text-gray-700">Colin Fabian</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-497-6052</div>
              
              <div className="text-xs text-gray-700">Curt White</div>
              <div className="text-xs text-blue-600 font-medium text-right">734-717-5700</div>
              <div className="text-xs text-gray-700">Kyle Smith</div>
              <div className="text-xs text-blue-600 font-medium text-right">586-675-3300</div>
              
              <div className="text-xs text-gray-700">Peter Joelson</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-961-4201</div>
              <div className="text-xs text-gray-700">Tina Tiller</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-563-1266</div>
            </div>
          </div>
        </div>

        {/* Treasurers / Additional Numbers */}
        <div>
          <h4 className="text-xs font-semibold text-blue-700 mb-1 px-2 flex items-center">
            <Building className="w-3 h-3 mr-1" />
            Treasurers / Additional Numbers
          </h4>
          <div className="px-2">
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-700">Wayne County</div>
              <div className="text-xs text-blue-600 font-medium text-right">313-224-5990</div>
              <div className="text-xs text-gray-700">Oakland County</div>
              <div className="text-xs text-blue-600 font-medium text-right">888-600-3773</div>
              
              <div className="text-xs text-gray-700">Oakland DELQ</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-858-0611</div>
              <div className="text-xs text-gray-700">Bankruptcy</div>
              <div className="text-xs text-blue-600 font-medium text-right">866-222-8029</div>
              
              <div className="text-xs text-gray-700">Peter's Office</div>
              <div className="text-xs text-blue-600 font-medium text-right">248-626-9966</div>
              <div className="text-xs text-gray-700">Qualia</div>
              <div className="text-xs text-blue-600 font-medium text-right">855-677-7533</div>
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
        <TabsList className="grid w-full grid-cols-2 bg-blue-600 rounded-none border-none">
          <TabsTrigger 
            value="contact" 
            className={`text-sm font-medium ${activeTab === "contact" ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <Phone className="w-4 h-4 mr-2" /> 
            Contact Directory
          </TabsTrigger>
          <TabsTrigger 
            value="map"
            className={`text-sm font-medium ${activeTab === "map" ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <MapPin className="w-4 h-4 mr-2" />
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
