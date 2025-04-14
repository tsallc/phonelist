import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, List, Grid, Users, Coffee, Printer, FileText, Home } from 'lucide-react';

const OfficeFloorMap = () => {
  // State for managing active room (when clicked)
  const [activeRoom, setActiveRoom] = useState(null);
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // State for mobile view toggle
  const [showListView, setShowListView] = useState(false);
  // State for active location tab
  const [activeLocation, setActiveLocation] = useState('solutions');
  // State for active floor tab
  const [activeFloor, setActiveFloor] = useState('lobby');
  
  // Combined office data from all locations and floors - memoized to prevent recreation on each render
  const officeData = useMemo(() => [
    // Title Solutions
    // Front Lobby
    { id: 'solutions-front-desk', name: 'Front Desk', extension: '1000', floor: 'lobby', location: 'solutions', type: 'common' },
    { id: 'solutions-copy-room', name: 'Copy Room', extension: '1100', floor: 'lobby', location: 'solutions', type: 'common' },
    { id: 'solutions-closers', name: 'Closers', extension: '1018', floor: 'lobby', location: 'solutions', type: 'office' },
    { id: 'solutions-conf-1', name: 'Conference Room 1', extension: '1200', floor: 'lobby', location: 'solutions', type: 'meeting' },
    { id: 'solutions-conf-2', name: 'Conference Room 2', extension: '1201', floor: 'lobby', location: 'solutions', type: 'meeting' },
    
    // Office Bullpen
    { id: 'solutions-tina', name: 'Tina', extension: '1087', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-pa', name: 'Pam', extension: '1016', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-amber', name: 'Amber Y', extension: '1011', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-empty-1', name: 'Empty Desk 1', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty' },
    { id: 'solutions-empty-2', name: 'Sydney', extension: '1008', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-empty-3', name: '', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty' },
    { id: 'solutions-empty-4', name: 'Empty Desk 4', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty' },
    { id: 'solutions-empty-5', name: '1015', extension: '', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-andrew', name: 'Andrew I.', extension: '1006', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-empty-7', name: 'Empty Desk 7', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty' },
    { id: 'solutions-jesse', name: 'Jesse I', extension: '1010', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-robin', name: 'Robin N', extension: '1013', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-katie', name: 'Katie C', extension: '1012', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-kathy', name: 'Kathy', extension: '1007', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-megan-l', name: 'Megan L', extension: '1009', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-grace', name: 'Grace', extension: '1003', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-heather', name: 'Heather', extension: '1001', floor: 'bullpen', location: 'solutions', type: 'office' },
    { id: 'solutions-syd', name: 'Syd', extension: '1002', floor: 'bullpen', location: 'solutions', type: 'office' },
    
    // 2nd Floor
    { id: 'solutions-training', name: 'Training Room', extension: '1100', floor: 'upstairs', location: 'solutions', type: 'training' },
    { id: 'solutions-lunch', name: 'Lunch Room', extension: '1103', floor: 'upstairs', location: 'solutions', type: 'common' },
    { id: 'solutions-tiller', name: 'Brian T.', extension: '1024', floor: 'upstairs', location: 'solutions', type: 'office' },
    
    // TruTitle
    { id: 'tru-reception', name: 'Reception', extension: '2100', floor: 'main', location: 'tru', type: 'common' },
    { id: 'tru-becca', name: 'Becca G.', extension: '2100', floor: 'main', location: 'tru', type: 'office' },
    { id: 'tru-troy', name: 'Troy M.', extension: '2101', floor: 'main', location: 'tru', type: 'office' },

    // Coastal Title Solutions
    { id: 'coastal-chad', name: 'Chad Williams', extension: '2040', floor: 'main', location: 'coastal', type: 'office' },
    { id: 'coastal-2027', name: '2027 - 2027', extension: '2027', floor: 'main', location: 'coastal', type: 'office' },
    { id: 'coastal-ftdesk', name: 'Ft Desk 2020', extension: '2020', floor: 'main', location: 'coastal', type: 'office' },
    { id: 'coastal-cts-harbour', name: 'CTS-Harbour', extension: '2050', floor: 'main', location: 'coastal', type: 'office' },
    { id: 'coastal-cts-harbor2', name: 'CTS-Harbor 2', extension: '2051', floor: 'main', location: 'coastal', type: 'office' },
    { id: 'coastal-andrea', name: 'Andrea', extension: '2026', floor: 'main', location: 'coastal', type: 'office' },

  ], []);
  
  // Update search results when searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filteredResults = officeData.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      room.extension.includes(searchTerm)
    );
    
    setSearchResults(filteredResults);
  }, [officeData, searchTerm]);
  
  // Handle room click
  const handleRoomClick = (room) => {
    setActiveRoom(room.id === activeRoom ? null : room.id);
  };

  // Get room style based on type and active state
  const getRoomStyle = (room) => {
    let baseStyle = "relative cursor-pointer transition-all duration-200 border-2 rounded-lg flex items-center justify-center text-center shadow-sm hover:shadow-md";
    
    // Base colors by room type
    if (room.type === 'empty') {
      baseStyle += " bg-gray-100 border-gray-300";
    } else if (room.type === 'common') {
      baseStyle += " bg-blue-100 border-blue-300";
    } else if (room.type === 'meeting') {
      baseStyle += " bg-purple-100 border-purple-300";
    } else if (room.type === 'training') {
      baseStyle += " bg-yellow-100 border-yellow-300";
    } else {
      baseStyle += " bg-green-100 border-green-300";
    }
    
    // Highlight if active or in search results
    if (room.id === activeRoom) {
      baseStyle += " ring-4 ring-blue-500 z-10 transform scale-105";
    } else if (searchResults.includes(room) && searchTerm) {
      baseStyle += " ring-2 ring-yellow-500";
    }
    
    return baseStyle;
  };

  // Render room details
  const renderRoomDetails = (room) => {
    return (
      <div className="p-1 text-xs md:text-sm flex flex-col h-full justify-center items-center">
        <div className="font-bold">{room.name}</div>
        {room.extension && <div className="mt-1 flex items-center"><Phone className="w-3 h-3 mr-1 text-gray-500" />{room.extension}</div>}
      </div>
    );
  };

  // Get floor name
  const getFloorName = (floorKey) => {
    const floorNames = {
      'lobby': 'Front Lobby',
      'bullpen': 'Office Bullpen',
      'upstairs': 'Upstairs',
      'main': 'Main Floor'
    };
    return floorNames[floorKey] || floorKey;
  };
  
  // Floor icon
  const getFloorIcon = (floorKey) => {
    switch(floorKey) {
      case 'lobby':
        return <Users className="w-3 h-3" />;
      case 'bullpen':
        return <Grid className="w-3 h-3" />;
      case '2nd':
        return <Coffee className="w-3 h-3" />;
      case 'main':
        return <Home className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };
  
  // Get location full name
  const getLocationName = (locationKey) => {
    return locationKey === 'solutions' ? 'Title Solutions' : 'TruTitle';
  };
  
  // Render Solutions Front Lobby layout
  const renderSolutionsFrontLobby = () => {
    const frontLobbyRooms = officeData.filter(
      r => r.location === 'solutions' && r.floor === 'lobby'
    );
    
    return (
      <div className="grid grid-cols-2 gap-4 p-4 mb-4">
        <div className="grid grid-cols-1 gap-4">
          <div 
            className={getRoomStyle(frontLobbyRooms.find(r => r.id === 'solutions-front-desk'))}
            onClick={() => handleRoomClick(frontLobbyRooms.find(r => r.id === 'solutions-front-desk'))}
            style={{height: '80px'}}
          >
            {renderRoomDetails(frontLobbyRooms.find(r => r.id === 'solutions-front-desk'))}
          </div>
          <div 
            className={getRoomStyle(frontLobbyRooms.find(r => r.id === 'solutions-copy-room'))}
            onClick={() => handleRoomClick(frontLobbyRooms.find(r => r.id === 'solutions-copy-room'))}
            style={{height: '80px'}}
          >
            {renderRoomDetails(frontLobbyRooms.find(r => r.id === 'solutions-copy-room'))}
          </div>
          <div 
            className={getRoomStyle(frontLobbyRooms.find(r => r.id === 'solutions-closers'))}
            onClick={() => handleRoomClick(frontLobbyRooms.find(r => r.id === 'solutions-closers'))}
            style={{height: '80px'}}
          >
            {renderRoomDetails(frontLobbyRooms.find(r => r.id === 'solutions-closers'))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div 
            className={getRoomStyle(frontLobbyRooms.find(r => r.id === 'solutions-conf-2'))}
            onClick={() => handleRoomClick(frontLobbyRooms.find(r => r.id === 'solutions-conf-2'))}
            style={{height: '80px'}}
          >
            {renderRoomDetails(frontLobbyRooms.find(r => r.id === 'solutions-conf-2'))}
          </div>
          <div className="h-16"></div>
          <div 
            className={getRoomStyle(frontLobbyRooms.find(r => r.id === 'solutions-conf-1'))}
            onClick={() => handleRoomClick(frontLobbyRooms.find(r => r.id === 'solutions-conf-1'))}
            style={{height: '80px'}}
          >
            {renderRoomDetails(frontLobbyRooms.find(r => r.id === 'solutions-conf-1'))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render Solutions Office Bullpen layout
  const renderSolutionsOfficeBullpen = () => {
    const officeBullpenRooms = officeData.filter(
      r => r.location === 'solutions' && r.floor === 'bullpen'
    );
    
    // Define a consistent room size class
    const roomSizeClass = "h-[75px] flex items-center justify-center";
    
    // Create a 6x3 grid (6 columns by 3 rows)
    return (
      <div className="grid grid-cols-6 gap-3 p-4 mb-4">
        {/* Row 1 */}
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-pa'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-pa'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-pa'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-amber'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-amber'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-amber'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-kathy'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-kathy'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-kathy'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-jesse'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-heather'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-heather'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-heather'))}
        </div>

        {/* Row 2 */}
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-empty-3'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-empty-3'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-empty-3'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-empty-1'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-empty-1'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-empty-1'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-robin'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-robin'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-robin'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-empty-2'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-empty-2'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-empty-2'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-empty-4'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-empty-4'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-empty-4'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-syd'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-syd'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-syd'))}
        </div>

        {/* Row 3 */}
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-tina'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-tina'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-tina'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-empty-5'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-empty-5'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-empty-5'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-katie'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-katie'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-katie'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-megan-l'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-megan-l'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-megan-l'))}
        </div>
        
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-andrew'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-andrew'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-andrew'))}
        </div>
                
        <div className={`${getRoomStyle(officeBullpenRooms.find(r => r.id === 'solutions-grace'))} ${roomSizeClass}`}
          onClick={() => handleRoomClick(officeBullpenRooms.find(r => r.id === 'solutions-grace'))}>
          {renderRoomDetails(officeBullpenRooms.find(r => r.id === 'solutions-grace'))}
        </div>
      </div>
    );
  };
  
  // Render Solutions 2nd Floor layout
  const renderSolutions2ndFloor = () => {
    const secondFloorRooms = officeData.filter(
      r => r.location === 'solutions' && r.floor === 'upstairs'
    );
    
    // Define a consistent room size class like the bullpen
    const roomSizeClass = "h-[75px] flex items-center justify-center";
    
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="grid grid-rows-2 gap-4">
          <div 
            className={`${getRoomStyle(secondFloorRooms.find(r => r.id === 'solutions-training'))} ${roomSizeClass}`}
            onClick={() => handleRoomClick(secondFloorRooms.find(r => r.id === 'solutions-training'))}
          >
            {renderRoomDetails(secondFloorRooms.find(r => r.id === 'solutions-training'))}
          </div>
          <div 
            className={`${getRoomStyle(secondFloorRooms.find(r => r.id === 'solutions-lunch'))} ${roomSizeClass}`}
            onClick={() => handleRoomClick(secondFloorRooms.find(r => r.id === 'solutions-lunch'))}
          >
            {renderRoomDetails(secondFloorRooms.find(r => r.id === 'solutions-lunch'))}
          </div>
        </div>
        <div>
          <div 
            className={`${getRoomStyle(secondFloorRooms.find(r => r.id === 'solutions-tiller'))} ${roomSizeClass}`}
            onClick={() => handleRoomClick(secondFloorRooms.find(r => r.id === 'solutions-tiller'))}
          >
            {renderRoomDetails(secondFloorRooms.find(r => r.id === 'solutions-tiller'))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render TruTitle Main Floor layout
  const renderTruMainFloor = () => {
    const truMainFloorRooms = officeData.filter(
      r => r.location === 'tru' && r.floor === 'main'
    );
    
    return (
      <div className="grid grid-cols-3 gap-4 p-4">
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-reception'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-reception'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-reception'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-conference'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-conference'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-conference'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-processing'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-processing'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-processing'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-manager'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-manager'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-manager'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-break'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-break'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-break'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-copy'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-copy'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-copy'))}
        </div>
        <div 
          className={getRoomStyle(truMainFloorRooms.find(r => r.id === 'tru-it'))}
          onClick={() => handleRoomClick(truMainFloorRooms.find(r => r.id === 'tru-it'))}
          style={{height: '80px'}}
        >
          {renderRoomDetails(truMainFloorRooms.find(r => r.id === 'tru-it'))}
        </div>
      </div>
    );
  };

  // Render room list (for mobile view and search results)
  const renderRoomList = (rooms) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {rooms.map(room => {
          // Determine background gradient based on room type
          let gradientClass = "";
          let iconComponent = null;
          
          if (room.type === 'office') {
            gradientClass = "bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-400";
            iconComponent = <Users className="w-4 h-4 text-green-600" />;
          } else if (room.type === 'common') {
            gradientClass = "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400";
            iconComponent = <Printer className="w-4 h-4 text-blue-600" />;
          } else if (room.type === 'meeting') {
            gradientClass = "bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-400";
            iconComponent = <FileText className="w-4 h-4 text-purple-600" />;
          } else if (room.type === 'training') {
            gradientClass = "bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400";
            iconComponent = <Users className="w-4 h-4 text-yellow-600" />;
          } else {
            gradientClass = "bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-300";
            iconComponent = <Home className="w-4 h-4 text-gray-600" />;
          }
          
          return (
            <div 
              key={room.id}
              className={`${gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${room.id === activeRoom ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleRoomClick(room)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="mr-3">
                    {iconComponent}
                  </div>
                  <div className="font-bold text-gray-800">{room.name}</div>
                </div>
                {room.extension && (
                  <div className="bg-white px-3 py-1 rounded-full shadow-sm text-gray-700 font-medium flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-gray-400" />
                    {room.extension}
                  </div>
                )}
              </div>
              <div className="flex items-center mt-3 text-xs text-gray-600">
                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                <span className="font-medium">
                  {room.location === 'solutions' ? 'Title Solutions' : 'TruTitle'} - {getFloorName(room.floor)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Get active floor rooms based on selected location and floor
  const getActiveFloorRooms = () => {
    return officeData.filter(
      room => room.location === activeLocation &&
             (activeLocation === 'solutions' ? room.floor === activeFloor : room.floor === 'main')
    );
  };

  // Render the correct floor layout based on active location and floor
  const renderActiveFloor = () => {
    if (activeLocation === 'solutions') {
      switch(activeFloor) {
        case 'lobby':
          return renderSolutionsFrontLobby();
        case 'bullpen':
          return renderSolutionsOfficeBullpen();
        case '2nd':
          return renderSolutions2ndFloor();
        default:
          return renderSolutionsFrontLobby();
      }
    } else {
      return renderTruMainFloor();
    }
  };

  // Get available floors for active location
  const getAvailableFloors = () => {
    if (activeLocation === 'solutions') {
      return ['lobby', 'bullpen', '2nd'];
    } else {
      return ['main'];
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-gray-100 min-h-screen">
      {/* Header with design improvements */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Office Phone Directory
          </h1>
          <div className="text-sm text-blue-100 flex items-center gap-2">
            <span className="hidden sm:inline">Interactive</span>
            <MapPin className="w-4 h-4" />
            <span>Extension Map</span>
          </div>
        </div>
        
        {/* Search & Controls Row - optimized design */}
        <div className="flex items-center px-4 py-3">
          {/* Search Bar with improved styling */}
          <div className="flex-1 relative mr-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or extension..."
              className="w-full pl-10 pr-4 py-2 text-sm border-0 bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* View Toggle with improved design */}
          <div className="bg-blue-800 rounded-lg p-1 flex">
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${!showListView ? 'bg-white text-blue-700 font-medium' : 'text-blue-100 hover:bg-blue-700'}`}
              onClick={() => setShowListView(false)}
            >
              <Grid className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${showListView ? 'bg-white text-blue-700 font-medium' : 'text-blue-100 hover:bg-blue-700'}`}
              onClick={() => setShowListView(true)}
            >
              <List className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
        
        {/* Location Tabs with improved design */}
        <div className="flex border-t border-blue-500 bg-blue-800">
          <button 
            onClick={() => {setActiveLocation('solutions'); setActiveFloor('lobby');}}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200 flex justify-center items-center ${activeLocation === 'solutions' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <Home className="w-4 h-4 mr-1" />
            <span>Title Solutions</span>
          </button>
          <button 
            onClick={() => {setActiveLocation('tru'); setActiveFloor('main');}}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200 flex justify-center items-center ${activeLocation === 'tru' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <Home className="w-4 h-4 mr-1" />
            <span>TruTitle</span>
          </button>
        </div>
        
        {/* Floor tabs - only shown for solutions location */}
        {activeLocation === 'solutions' && !showListView && searchResults.length === 0 && (
          <div className="flex bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
            {getAvailableFloors().map(floor => (
              <button 
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center
                  ${activeFloor === floor 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                {getFloorIcon(floor)}
                <span className="ml-1">{getFloorName(floor)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Legend - compact and improved design */}
      <div className="flex flex-wrap justify-center gap-2 px-4 py-2 bg-white shadow-sm text-xs border-b border-gray-200">
        <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
          <span>Office</span>
        </div>
        <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 flex items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
          <span>Common Area</span>
        </div>
        <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-800 flex items-center">
          <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
          <span>Conference</span>
        </div>
        <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 flex items-center">
          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
          <span>Training</span>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full text-gray-800 flex items-center">
          <div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div>
          <span>Empty</span>
        </div>
      </div>
      
      {/* Search Results with improved styling */}
      {searchResults.length > 0 && (
        <div className="bg-amber-50 shadow-md rounded-lg m-4 overflow-hidden">
          <div className="flex items-center px-4 py-3 bg-amber-100 border-b border-amber-200">
            <Search className="w-5 h-5 text-amber-600 mr-2" />
            <h2 className="font-bold text-amber-800">Search Results ({searchResults.length})</h2>
            <button 
              className="ml-auto text-amber-600 hover:text-amber-800"
              onClick={() => setSearchTerm('')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          {renderRoomList(searchResults)}
        </div>
      )}
      
      {/* Main Content */}
      {!showListView && searchResults.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg m-4 overflow-hidden">
          {/* Floor heading */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">
              {getLocationName(activeLocation)} - {getFloorName(activeLocation === 'solutions' ? activeFloor : 'main')}
            </h2>
          </div>
          
          {/* Floor map */}
          <div className="p-2">
            {renderActiveFloor()}
          </div>
        </div>
      ) : (
        searchResults.length === 0 && (
          <div className="bg-white shadow-md rounded-lg m-4 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center">
              <List className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Directory Listing</h2>
            </div>
            {renderRoomList(officeData.filter(r => r.location === activeLocation))}
          </div>
        )
      )}
      
      {/* Active Room Details Popup with improved design */}
      {activeRoom && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl z-20 rounded-t-xl overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-1"></div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{officeData.find(r => r.id === activeRoom)?.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Extension: {officeData.find(r => r.id === activeRoom)?.extension || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {officeData.find(r => r.id === activeRoom)?.location === 'solutions' ? 'Title Solutions' : 'TruTitle'} - {getFloorName(officeData.find(r => r.id === activeRoom)?.floor)}
                  </div>
                </div>
              </div>
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2 focus:outline-none transition-colors duration-200"
                onClick={() => setActiveRoom(null)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Additional room details could be placed here */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  {officeData.find(r => r.id === activeRoom)?.type === 'office' ? (
                    <Users className="w-5 h-5 text-blue-600" />
                  ) : officeData.find(r => r.id === activeRoom)?.type === 'common' ? (
                    <Printer className="w-5 h-5 text-blue-600" />
                  ) : officeData.find(r => r.id === activeRoom)?.type === 'meeting' ? (
                    <FileText className="w-5 h-5 text-blue-600" />
                  ) : officeData.find(r => r.id === activeRoom)?.type === 'training' ? (
                    <Users className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Home className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium mb-1">Room Type</div>
                  <div className="capitalize">{officeData.find(r => r.id === activeRoom)?.type}</div>
                </div>
              </div>
            </div>
            
            {/* Call button */}
            {officeData.find(r => r.id === activeRoom)?.extension && (
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-200">
                <Phone className="w-5 h-5 mr-2" />
                Call Extension {officeData.find(r => r.id === activeRoom)?.extension}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeFloorMap;
