import React, { useState, useEffect, useMemo, useReducer, createContext, useContext } from 'react';
import { Search, MapPin, Phone, List, Grid, Users, Coffee, Printer, FileText, Home, Waves } from 'lucide-react';

// Room type styles - separated from render logic
const ROOM_TYPE_STYLES = {
  empty: { 
    label: 'Empty', 
    bg: 'bg-gray-100', 
    border: 'border-gray-300', 
    dot: 'bg-gray-500',
    icon: Home,
    gradientClass: 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-300',
    iconColor: 'text-gray-600'
  },
  common: { 
    label: 'Common Area', 
    bg: 'bg-blue-100', 
    border: 'border-blue-300', 
    dot: 'bg-blue-500',
    icon: Printer,
    gradientClass: 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400',
    iconColor: 'text-blue-600'
  },
  meeting: { 
    label: 'Conference', 
    bg: 'bg-purple-100', 
    border: 'border-purple-300', 
    dot: 'bg-purple-500',
    icon: FileText,
    gradientClass: 'bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-400',
    iconColor: 'text-purple-600'
  },
  training: { 
    label: 'Training', 
    bg: 'bg-yellow-100', 
    border: 'border-yellow-300', 
    dot: 'bg-yellow-500',
    icon: Users,
    gradientClass: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400',
    iconColor: 'text-yellow-600'
  },
  office: { 
    label: 'Office', 
    bg: 'bg-green-100', 
    border: 'border-green-300', 
    dot: 'bg-green-500',
    icon: Users,
    gradientClass: 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-400',
    iconColor: 'text-green-600'
  }
};

// Room type renderers - can be dynamically replaced or extended
const ROOM_TYPE_RENDERERS = {
  empty: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.empty.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Home className="w-4 h-4 text-gray-600" />
            </div>
            <div className="font-bold text-gray-800">{room.name}</div>
          </div>
        </div>
        <div className="flex items-center mt-3 text-xs text-gray-600">
          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
          <span className="font-medium opacity-75">Unoccupied Space</span>
        </div>
      </div>
    )
  },
  common: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.common.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Printer className="w-4 h-4 text-blue-600" />
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
            Common Area
          </span>
        </div>
      </div>
    )
  },
  meeting: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.meeting.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <FileText className="w-4 h-4 text-purple-600" />
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
        {room.warning && (
          <div className="mt-2 bg-red-100 px-2 py-1 rounded-md text-xs text-red-700 flex items-center">
            <svg className="w-3 h-3 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            {room.warning}
          </div>
        )}
        <div className="flex items-center mt-3 text-xs text-gray-600">
          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
          <span className="font-medium">
            Conference Room
          </span>
        </div>
      </div>
    )
  },
  training: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.training.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Users className="w-4 h-4 text-yellow-600" />
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
            Training Room
          </span>
        </div>
      </div>
    )
  },
  office: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.office.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Users className="w-4 h-4 text-green-600" />
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
            Office Space
          </span>
        </div>
      </div>
    )
  }
};

// Unified registry for dynamic composition at runtime
const createRoomTypeRegistry = (styles = ROOM_TYPE_STYLES, renderers = ROOM_TYPE_RENDERERS) => {
  const registry = {};
  
  // Combine styles and renderers for each type
  Object.keys(styles).forEach(typeKey => {
    registry[typeKey] = {
      ...styles[typeKey],
      ...(renderers[typeKey] || {})
    };
  });
  
  // Allow registering new room types or overriding existing ones
  registry.register = (typeKey, config) => {
    registry[typeKey] = {
      ...(registry[typeKey] || {}),
      ...config
    };
  };
  
  return registry;
};

// Create the room type registry
const ROOM_TYPES = createRoomTypeRegistry();

// Floor metadata with names and icons
const FLOORS = {
  'lobby': { name: 'Front Lobby', icon: Users },
  'bullpen': { name: 'Office Bullpen', icon: Grid },
  'upstairs': { name: 'Upstairs', icon: Coffee },
  'main': { name: 'Main Floor', icon: Home }
};

// Location metadata
const LOCATIONS = {
  'solutions': { name: 'Title Solutions', icon: Home },
  'coastal': { name: 'Coastal Title', icon: Waves },
  'tru': { name: 'TruTitle', icon: Home }
};

// Layout schema defining ONLY position coordinates (not room IDs)
const LAYOUT_CONFIG = {
  solutions: {
    lobby: {
      columns: 2,
      layout: [
        // First row: two columns
        [
          ['pos_0_0', 'pos_0_1'],  // Column 1, Column 2
          ['pos_1_0', null],       // Column 1, Column 2 (removing pos_1_1)
          ['pos_2_0', 'pos_2_1']   // Column 1, Column 2
        ],
        // Second row: special format (removing unused position)
        [
          [null, null]              // Empty, Empty
        ]
      ]
    },
    bullpen: {
      columns: 5,
      layout: [
        [
          ['pos_0_0', 'pos_0_1', 'pos_0_2', 'pos_0_3', 'pos_0_4'],
          ['pos_1_0', 'pos_1_1', 'pos_1_2', 'pos_1_3', 'pos_1_4'],
          ['pos_2_0', 'pos_2_1', 'pos_2_2', 'pos_2_3', 'pos_2_4']
        ]
      ]
    },
    upstairs: {
      columns: 2,
      layout: [
        [
          ['pos_0_0', 'pos_0_1'],
          ['pos_1_0', 'pos_1_1', 'pos_1_2']
        ]
      ]
    }
  },
  tru: {
    main: {
      columns: 3,
      layout: [
        [
          ['pos_0_0', 'pos_0_1', 'pos_0_2']
        ]
      ]
    }
  },
  coastal: {
    main: {
      columns: 3,
      layout: [
        [
          ['pos_0_0', 'pos_0_1', 'pos_0_2'],
          ['pos_1_0', 'pos_1_1', 'pos_1_2']
        ]
      ]
    }
  }
};

// Position to Room ID Mapping
const ROOM_ASSIGNMENTS = {
  solutions: {
    lobby: {
      'pos_0_0': 'solutions-front-desk',
      'pos_0_1': 'solutions-conf-2',
      'pos_1_0': 'solutions-copy-room',
      'pos_2_0': 'solutions-closers',
      'pos_2_1': 'solutions-conf-1',
    },
    bullpen: {
      'pos_0_0': 'solutions-bullpen-r1c1',
      'pos_0_1': 'solutions-bullpen-r1c2',
      'pos_0_2': 'solutions-bullpen-r1c3',
      'pos_0_3': 'solutions-bullpen-r1c4',
      'pos_0_4': 'solutions-bullpen-r1c5',
      'pos_1_0': 'solutions-bullpen-r2c1',
      'pos_1_1': 'solutions-bullpen-r2c2',
      'pos_1_2': 'solutions-bullpen-r2c3',
      'pos_1_3': 'solutions-bullpen-r2c4',
      'pos_1_4': 'solutions-bullpen-r2c5',
      'pos_2_0': 'solutions-bullpen-r3c1',
      'pos_2_1': 'solutions-bullpen-r3c2',
      'pos_2_2': 'solutions-bullpen-r3c3',
      'pos_2_3': 'solutions-bullpen-r3c4',
      'pos_2_4': 'solutions-bullpen-r3c5'
    },
    upstairs: {
      'pos_0_0': 'solutions-training',
      'pos_0_1': 'solutions-tina',
      'pos_1_0': 'solutions-lunch',
      'pos_1_1': 'solutions-tiller',
      'pos_1_2': 'solutions-pam'
    }
  },
  tru: {
    main: {
      'pos_0_0': 'tru-reception',
      'pos_0_1': 'tru-becca',
      'pos_0_2': 'tru-troy'
    }
  },
  coastal: {
    main: {
      'pos_0_0': 'coastal-chad',
      'pos_0_1': 'coastal-2027',
      'pos_0_2': 'coastal-ftdesk',
      'pos_1_0': 'coastal-cts-harbour',
      'pos_1_1': 'coastal-cts-harbor2',
      'pos_1_2': 'coastal-andrea'
    }
  }
};

// Enhanced Raw office data with status field instead of separate empty list
const RAW_OFFICE_DATA = [
  // Title Solutions - Front Lobby
  { id: 'solutions-front-desk', name: 'Front Desk', extension: '1000', floor: 'lobby', location: 'solutions', type: 'common', status: 'active' },
  { id: 'solutions-copy-room', name: 'Copy Room', extension: '1100', floor: 'lobby', location: 'solutions', type: 'common', status: 'active' },
  { id: 'solutions-closers', name: 'Closers', extension: '1018', floor: 'lobby', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-conf-1', name: 'Conference Room 1', extension: '1200', floor: 'lobby', location: 'solutions', type: 'meeting', status: 'active' },
  { id: 'solutions-conf-2', name: 'Conference Room 2', extension: '1201', floor: 'lobby', location: 'solutions', type: 'meeting', status: 'active', warning: 'INOP - frayed cord' },
  
  // Title Solutions - Office Bullpen
  { id: 'solutions-bullpen-r1c1', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' }, // Amber now empty
  { id: 'solutions-bullpen-r1c2', name: 'Jesse', extension: '1010', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r1c3', name: 'Kathy', extension: '1007', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r1c4', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' },
  { id: 'solutions-bullpen-r1c5', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' }, // Heather now empty
  { id: 'solutions-bullpen-r2c1', name: 'Will', extension: '1030', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r2c2', name: 'Robin', extension: '1013', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r2c3', name: 'Sydney', extension: '1008', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r2c4', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' },
  { id: 'solutions-bullpen-r2c5', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' },
  { id: 'solutions-bullpen-r3c1', name: 'Empty', extension: '', floor: 'bullpen', location: 'solutions', type: 'empty', status: 'inactive' }, // Tina spot now empty
  { id: 'solutions-bullpen-r3c2', name: 'Katie', extension: '1012', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r3c3', name: 'Tina', extension: '1009', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' }, // Megan L now Tina
  { id: 'solutions-bullpen-r3c4', name: 'Andrew', extension: '1006', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-bullpen-r3c5', name: 'Grace', extension: '1003', floor: 'bullpen', location: 'solutions', type: 'office', status: 'active' },
  
  // Title Solutions - 2nd Floor
  { id: 'solutions-training', name: 'Training Room', extension: '1103', floor: 'upstairs', location: 'solutions', type: 'training', status: 'active' },
  { id: 'solutions-lunch', name: 'Lunch Room', extension: '1110', floor: 'upstairs', location: 'solutions', type: 'common', status: 'active' },
  { id: 'solutions-tiller', name: 'Brian T.', extension: '1024', floor: 'upstairs', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-pam', name: 'Pam', extension: '1016', floor: 'upstairs', location: 'solutions', type: 'office', status: 'active' },
  { id: 'solutions-tina', name: 'Tina', extension: '1027', floor: 'upstairs', location: 'solutions', type: 'office', status: 'active' },
  
  // TruTitle
  { id: 'tru-reception', name: 'Reception', extension: '2100', floor: 'main', location: 'tru', type: 'common', status: 'active' },
  { id: 'tru-becca', name: 'Becca G.', extension: '2100', floor: 'main', location: 'tru', type: 'office', status: 'active' },
  { id: 'tru-troy', name: 'Troy M.', extension: '2101', floor: 'main', location: 'tru', type: 'office', status: 'active' },

  // Coastal Title Solutions
  { id: 'coastal-chad', name: 'Chad Williams', extension: '2040', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-2027', name: '2027 - 2027', extension: '2027', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-ftdesk', name: 'Ft Desk 2020', extension: '2020', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-cts-harbour', name: 'CTS-Harbour', extension: '2050', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-cts-harbor2', name: 'CTS-Harbor 2', extension: '2051', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-andrea', name: 'Andrea', extension: '2026', floor: 'main', location: 'coastal', type: 'office', status: 'active' },
];

// Room component with explicit dependencies (no more global state)
const Room = ({ roomId, roomMap, active, onSelect, className = "", size = "h-[75px]" }) => {
  if (!roomId) return <div className={`${className} ${size} invisible`}></div>;
  
  const room = roomMap[roomId];
  if (!room) return <div className={`${className} ${size} invisible`}></div>;
  
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.office;
  const isInactive = room.status === 'inactive';
  
  let baseStyle = `${className} ${size} relative cursor-pointer transition-all duration-200 border-2 rounded-lg flex items-center justify-center text-center shadow-sm hover:shadow-md ${typeInfo.bg} ${typeInfo.border}`;
  
  // Highlight if active
  if (active) {
    baseStyle += " ring-4 ring-blue-500 z-10 transform scale-105";
  }
  
  return (
    <div 
      className={baseStyle}
      onClick={() => onSelect(roomId)}
    >
      <div className={`p-1 text-xs md:text-sm flex flex-col h-full justify-center items-center relative ${isInactive ? 'opacity-60' : ''}`}>
        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-red-500 font-bold text-xl transform rotate-12">X</div>
          </div>
        )}
        {room.warning && (
          <div className="absolute top-0 right-0 m-1">
            <div className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center" title={room.warning}>
              !
            </div>
          </div>
        )}
        <div className="font-bold">{room.name}</div>
        {room.extension && <div className="mt-1 flex items-center"><Phone className="w-3 h-3 mr-1 text-gray-500" />{room.extension}</div>}
      </div>
    </div>
  );
};

// RoomCard component - uses the strategy pattern from room type
const RoomCard = ({ room, active, onSelect }) => {
  if (!room) return null;
  
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.office;
  return typeInfo.renderCard(room, { active, onSelect });
};

// RoomDetailsDrawer component - displays active room details
const RoomDetailsDrawer = ({ roomId, roomMap, onClose }) => {
  if (!roomId) return null;
  
  const room = roomMap[roomId];
  if (!room) return null;
  
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.office;
  const Icon = typeInfo.icon;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl z-20 rounded-t-xl overflow-hidden animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-1"></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {room.extension && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Extension: {room.extension}
                </div>
              )}
              <div className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {LOCATIONS[room.location]?.name} - {FLOORS[room.floor]?.name}
              </div>
            </div>
          </div>
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2 focus:outline-none transition-colors duration-200"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Warning message if room has one */}
        {room.warning && (
          <div className="mt-4 bg-red-50 p-3 rounded-lg border-l-4 border-red-500 text-sm text-red-700">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span className="font-bold">Warning:</span> <span className="ml-1">{room.warning}</span>
            </div>
          </div>
        )}
        
        {/* Only show room type info if not empty */}
        {room.type !== 'empty' && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <Icon className={`w-5 h-5 ${typeInfo.iconColor}`} />
              </div>
              <div>
                <div className="font-medium mb-1">Room Type</div>
                <div className="capitalize">{room.type}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Call button only for rooms with extensions */}
        {room.extension && (
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-200">
            <Phone className="w-5 h-5 mr-2" />
            Call Extension {room.extension}
          </button>
        )}
      </div>
    </div>
  );
};

// Default renderers for FloorSection
const defaultRowRenderer = (row, rowProps, renderCell) => (
  <div 
    key={rowProps.key}
    className={rowProps.className}
    style={rowProps.style}
  >
    {row.map((positionId, cellIndex) => renderCell(positionId, cellIndex))}
  </div>
);

const defaultGridCellRenderer = (positionId, cellProps, renderContent) => (
  <div key={cellProps.key}>
    {renderContent()}
  </div>
);

// Default plugin implementation with no-op methods
const DEFAULT_LAYOUT_PLUGINS = {
  // Layout preprocessing
  preprocessLayout: (layoutConfig) => layoutConfig,
  
  // Row lifecycle hooks
  beforeRenderRow: (row, rowMeta) => {},
  afterRenderRow: (rowElement, rowMeta) => rowElement,
  onMountRow: (rowRef, rowMeta) => {},
  
  // Cell lifecycle hooks
  beforeRenderCell: (positionId, cellMeta) => {},
  afterRenderCell: (cellElement, cellMeta) => cellElement,
  modifyCellClass: (cellClass, cellMeta) => cellClass,
  
  // Overlay injection
  injectOverlay: (positionId, cellMeta) => null,
  
  // Room rendering hooks
  beforeRenderRoom: (roomId, roomMeta) => {},
  afterRenderRoom: (roomElement, roomMeta) => roomElement
};

// Layout validation utility
const validateLayoutSchema = (layoutConfig, roomAssignments, roomData) => {
  const validationResults = {
    valid: true,
    errors: [],
    warnings: [],
    unusedRooms: [],
    missingRooms: [],
    duplicateAssignments: []
  };
  
  // Track all room IDs referenced in the layout
  const referencedRoomIds = new Set();
  
  // Check each location and floor
  Object.entries(layoutConfig).forEach(([location, floors]) => {
    Object.entries(floors).forEach(([floor, config]) => {
      // Check if assignment data exists for this location/floor
      if (!roomAssignments[location] || !roomAssignments[location][floor]) {
        validationResults.errors.push(
          `Missing room assignments for ${location}/${floor}`
        );
        validationResults.valid = false;
        return;
      }
      
      // Collect all position IDs from the layout
      const positionIds = new Set();
      const roomIds = new Set();
      
      // Process each section and row
      config.layout.forEach(section => {
        section.forEach(row => {
          row.forEach(positionId => {
            if (!positionId) return; // Skip null positions
            
            // Check for duplicate position IDs
            if (positionIds.has(positionId)) {
              validationResults.errors.push(
                `Duplicate position ID: ${positionId} in ${location}/${floor}`
              );
              validationResults.valid = false;
            }
            positionIds.add(positionId);
            
            // Check if this position has a room assignment
            const roomId = roomAssignments[location][floor][positionId];
            if (!roomId) {
              validationResults.warnings.push(
                `Position ${positionId} in ${location}/${floor} has no room assignment`
              );
              return;
            }
            
            // Check if room data exists for this ID
            const roomExists = roomData.some(room => room.id === roomId);
            if (!roomExists) {
              validationResults.missingRooms.push(roomId);
              validationResults.errors.push(
                `Room ID ${roomId} assigned to position ${positionId} in ${location}/${floor} does not exist in room data`
              );
              validationResults.valid = false;
            }
            
            // Check for duplicate room assignments
            if (roomIds.has(roomId)) {
              validationResults.duplicateAssignments.push(roomId);
              validationResults.warnings.push(
                `Room ${roomId} is assigned to multiple positions in ${location}/${floor}`
              );
            }
            roomIds.add(roomId);
            referencedRoomIds.add(roomId);
          });
        });
      });
    });
  });
  
  // Check for unused rooms
  roomData.forEach(room => {
    if (!referencedRoomIds.has(room.id)) {
      validationResults.unusedRooms.push(room.id);
      validationResults.warnings.push(`Room ${room.id} is not assigned to any position`);
    }
  });
  
  return validationResults;
};

// FloorSection component with enhanced extensibility
const FloorSection = ({ 
  location, 
  floor, 
  activeRoom, 
  onRoomSelect, 
  searchResults = [],
  roomMap,
  getPositionRoomId,
  renderRow = defaultRowRenderer,
  renderGridCell = defaultGridCellRenderer,
  className = "",
  layoutPlugins = DEFAULT_LAYOUT_PLUGINS,
  showValidation = false
}) => {
  const { canAdminister, isPositionValid } = useOfficeMap();
  
  // Merge the validation overlay plugin if needed
  const enhancedPlugins = useMemo(() => {
    if (showValidation && canAdminister()) {
      return {
        ...layoutPlugins,
        injectOverlay: (positionId, meta) => {
          const roomId = getPositionRoomId(location, floor, positionId);
          return (
            <>
              {layoutPlugins.injectOverlay && layoutPlugins.injectOverlay(positionId, meta)}
              <ValidationOverlay 
                location={location} 
                floor={floor} 
                positionId={positionId} 
                roomId={roomId} 
              />
            </>
          );
        },
        modifyCellClass: (cellClass, meta) => {
          const positionId = meta.positionId;
          if (!positionId) return cellClass;
          
          const baseClass = layoutPlugins.modifyCellClass 
            ? layoutPlugins.modifyCellClass(cellClass, meta)
            : cellClass;
            
          // Add validation-related classes
          if (!isPositionValid(location, floor, positionId)) {
            return `${baseClass} invalid-position`;
          }
          
          return baseClass;
        }
      };
    }
    
    return layoutPlugins;
  }, [layoutPlugins, showValidation, canAdminister, location, floor, isPositionValid, getPositionRoomId]);
  
  const config = LAYOUT_CONFIG[location]?.[floor];
  if (!config) return null;
  
  // Apply layout preprocessing if provided
  const processedConfig = useMemo(() => {
    return enhancedPlugins.preprocessLayout ? 
      enhancedPlugins.preprocessLayout({...config}, { location, floor }) : 
      config;
  }, [config, enhancedPlugins, location, floor]);
  
  // Function to get the room ID at a position
  const getRoomIdAtPosition = (positionId) => {
    if (!positionId) return null;
    return getPositionRoomId(location, floor, positionId);
  };
  
  // Create refs for rows to support onMountRow hook
  const rowRefs = useMemo(() => {
    return processedConfig.layout.map(section => 
      section.map(() => React.createRef())
    );
  }, [processedConfig.layout]);
  
  // Handle row mounting
  useEffect(() => {
    if (!enhancedPlugins.onMountRow) return;
    
    rowRefs.forEach((sectionRefs, sectionIndex) => {
      sectionRefs.forEach((rowRef, rowIndex) => {
        if (rowRef.current) {
          enhancedPlugins.onMountRow(rowRef, {
            location, 
            floor, 
            sectionIndex, 
            rowIndex,
            rowElement: rowRef.current
          });
        }
      });
    });
  }, [rowRefs, enhancedPlugins, location, floor]);
  
  // Enhanced row renderer that applies plugins
  const enhancedRenderRow = (row, rowProps, renderCell) => {
    // Call beforeRenderRow hook
    if (enhancedPlugins.beforeRenderRow) {
      enhancedPlugins.beforeRenderRow(row, rowProps);
    }
    
    // Render the row
    const rowElement = (
      <div 
        key={rowProps.key}
        ref={rowRefs[rowProps.sectionIndex][rowProps.rowIndex]}
        className={rowProps.className}
        style={rowProps.style}
      >
        {row.map((positionId, cellIndex) => renderCell(positionId, cellIndex))}
      </div>
    );
    
    // Apply afterRenderRow hook if provided
    return enhancedPlugins.afterRenderRow ? 
      enhancedPlugins.afterRenderRow(rowElement, rowProps) : 
      rowElement;
  };
  
  // Enhanced cell renderer that applies plugins
  const enhancedRenderCell = (positionId, cellProps, renderContent) => {
    // Call beforeRenderCell hook
    if (enhancedPlugins.beforeRenderCell) {
      enhancedPlugins.beforeRenderCell(positionId, cellProps);
    }
    
    // Modify cell class if needed
    const cellClass = enhancedPlugins.modifyCellClass ? 
      enhancedPlugins.modifyCellClass('', cellProps) : 
      '';
    
    // Inject overlay if provided
    const overlay = enhancedPlugins.injectOverlay ? 
      enhancedPlugins.injectOverlay(positionId, {
        ...cellProps,
        location,
        floor,
        roomId: getRoomIdAtPosition(positionId)
      }) : 
      null;
    
    // Render the cell
    const cellElement = (
      <div key={cellProps.key} className={cellClass}>
        {renderContent()}
        {overlay}
      </div>
    );
    
    // Apply afterRenderCell hook if provided
    return enhancedPlugins.afterRenderCell ? 
      enhancedPlugins.afterRenderCell(cellElement, cellProps) : 
      cellElement;
  };
  
  // Enhanced room rendering with hooks
  const enhancedRenderRoom = (roomId) => {
    // Call beforeRenderRoom hook
    if (enhancedPlugins.beforeRenderRoom) {
      enhancedPlugins.beforeRenderRoom(roomId, { location, floor });
    }
    
    // Render the room
    const roomElement = (
      <Room 
        roomId={roomId}
        roomMap={roomMap}
        active={roomId === activeRoom}
        onSelect={onRoomSelect}
        className={searchResults.length > 0 && roomId && searchResults.includes(roomId) ? "ring-2 ring-yellow-500" : ""}
      />
    );
    
    // Apply afterRenderRoom hook if provided
    return enhancedPlugins.afterRenderRoom ? 
      enhancedPlugins.afterRenderRoom(roomElement, { roomId, location, floor }) : 
      roomElement;
  };
  
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-md font-semibold text-gray-700 pl-4 pt-2 pb-2">
        {FLOORS[floor]?.name || floor}
      </h3>
      
      <div className="p-4">
        {processedConfig.layout.map((section, sectionIndex) => (
          <div key={`${location}-${floor}-section-${sectionIndex}`} className="mb-4">
            {section.map((row, rowIndex) => enhancedRenderRow(
              row,
              {
                key: `${location}-${floor}-section-${sectionIndex}-row-${rowIndex}`,
                style: { gridTemplateColumns: `repeat(${processedConfig.columns}, minmax(0, 1fr))` },
                className: "grid gap-4 mb-4",
                rowIndex,
                sectionIndex,
                location,
                floor
              },
              (positionId, cellIndex) => enhancedRenderCell(
                positionId,
                {
                  key: `${location}-${floor}-${positionId || `empty-${cellIndex}`}`,
                  positionId,
                  cellIndex,
                  rowIndex,
                  sectionIndex
                },
                () => {
                  const roomId = getRoomIdAtPosition(positionId);
                  return roomId ? enhancedRenderRoom(roomId) : null;
                }
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Define actions for reducer
const OfficeMapActions = {
  SET_LOCATION: 'SET_LOCATION',
  TOGGLE_FLOOR: 'TOGGLE_FLOOR',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SEARCH: 'SEARCH',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
  TOGGLE_VIEW: 'TOGGLE_VIEW',
  CHANGE_VERSION: 'CHANGE_VERSION',
  UPDATE_ROOM: 'UPDATE_ROOM',
  MOVE_ROOM: 'MOVE_ROOM',
  UPDATE_LAYOUT: 'UPDATE_LAYOUT'
};

// Initial state
const initialState = {
  activeLocation: 'solutions',
  selectedFloors: [],
  activeRoom: null,
  searchTerm: '',
  searchResults: [],
  showListView: false,
  layoutVersion: 'default'
};

// Reducer
function officeMapReducer(state, action) {
  switch (action.type) {
    case OfficeMapActions.SET_LOCATION:
      return {
        ...state,
        activeLocation: action.payload,
        selectedFloors: []
      };
    case OfficeMapActions.TOGGLE_FLOOR:
      return {
        ...state,
        selectedFloors: state.selectedFloors.includes(action.payload)
          ? state.selectedFloors.filter(f => f !== action.payload)
          : [...state.selectedFloors, action.payload]
      };
    case OfficeMapActions.SET_ACTIVE_ROOM:
      return {
        ...state,
        activeRoom: action.payload === state.activeRoom ? null : action.payload
      };
    case OfficeMapActions.SEARCH:
      return {
        ...state,
        searchTerm: action.payload,
        searchResults: action.results
      };
    case OfficeMapActions.CLEAR_SEARCH:
      return {
        ...state,
        searchTerm: '',
        searchResults: []
      };
    case OfficeMapActions.TOGGLE_VIEW:
      return {
        ...state,
        showListView: !state.showListView
      };
    case OfficeMapActions.CHANGE_VERSION:
      return {
        ...state,
        layoutVersion: action.payload
      };
    case OfficeMapActions.UPDATE_ROOM:
      return {
        ...state,
        roomMap: {
          ...state.roomMap,
          [action.payload.roomId]: {
            ...state.roomMap[action.payload.roomId],
            ...action.payload.data
          }
        }
      };
    case OfficeMapActions.MOVE_ROOM:
      return {
        ...state,
        roomMap: {
          ...state.roomMap,
          [action.payload.roomId]: {
            ...state.roomMap[action.payload.roomId],
            position: action.payload.position
          }
        }
      };
    case OfficeMapActions.UPDATE_LAYOUT:
      return {
        ...state,
        layoutConfig: {
          ...state.layoutConfig,
          [action.payload.location]: {
            ...state.layoutConfig[action.payload.location],
            [action.payload.floor]: {
              ...state.layoutConfig[action.payload.location][action.payload.floor],
              layout: action.payload.layout
            }
          }
        }
      };
    default:
      return state;
  }
}

// Define user roles
const OfficeMapRoles = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  NONE: 'NONE'
};

// Default feature flags
const DEFAULT_FEATURE_FLAGS = {
  enableEditing: false,
  enableRoomReservation: false,
  enableExtensionCalling: false,
  enableOccupancyStatus: false,
  enableVersionHistory: false,
  enableMultiFloorView: true,
  enableListView: true,
  enableSearch: true
};

// Create context
const OfficeMapContext = createContext(null);

// Context provider component with validation
const OfficeMapProvider = ({ 
  children, 
  initialVersion = 'default',
  initialRole = OfficeMapRoles.VIEWER,
  customFeatureFlags = {},
  validateLayout = true
}) => {
  const [state, dispatch] = useReducer(officeMapReducer, {
    ...initialState,
    layoutVersion: initialVersion
  });
  
  // Role state with upgrade/downgrade capabilities
  const [userRole, setUserRole] = useState(initialRole);
  
  // Combine default feature flags with custom ones
  const featureFlags = useMemo(() => ({
    ...DEFAULT_FEATURE_FLAGS,
    ...customFeatureFlags
  }), [customFeatureFlags]);
  
  // Layout validation state
  const [validationResults, setValidationResults] = useState(null);
  
  // Perform layout validation
  useEffect(() => {
    if (!validateLayout) return;
    
    const results = validateLayoutSchema(
      LAYOUT_CONFIG, 
      ROOM_ASSIGNMENTS, 
      RAW_OFFICE_DATA
    );
    
    setValidationResults(results);
    
    // Log warnings and errors in development
    if (process.env.NODE_ENV === 'development') {
      if (!results.valid) {
        console.error('Office Map Layout Validation Failed:', results.errors);
      }
      if (results.warnings.length > 0) {
        console.warn('Office Map Layout Warnings:', results.warnings);
      }
    }
  }, [validateLayout]);
  
  // Cache frequently used data
  const memoizedData = useMemo(() => {
    // Create room lookup map
    const roomMap = Object.fromEntries(RAW_OFFICE_DATA.map(room => [room.id, room]));
    
    // Create a searchable index of rooms by location and floor
    const roomsByLocationAndFloor = {};
    RAW_OFFICE_DATA.forEach(room => {
      if (!roomsByLocationAndFloor[room.location]) roomsByLocationAndFloor[room.location] = {};
      if (!roomsByLocationAndFloor[room.location][room.floor]) roomsByLocationAndFloor[room.location][room.floor] = [];
      roomsByLocationAndFloor[room.location][room.floor].push(room.id);
    });
    
    return {
      roomMap,
      roomsByLocationAndFloor,
      getPositionRoomId: (location, floor, positionId) => {
        return ROOM_ASSIGNMENTS[location]?.[floor]?.[positionId] || null;
      },
      isPositionValid: (location, floor, positionId) => {
        if (!validationResults) return true;
        
        // Check if this position has a room assignment
        const roomId = ROOM_ASSIGNMENTS[location]?.[floor]?.[positionId];
        if (!roomId) return false;
        
        // Check if room exists in data and isn't duplicated
        return !validationResults.missingRooms.includes(roomId) && 
          !validationResults.duplicateAssignments.includes(roomId);
      }
    };
  }, [validationResults]);
  
  // Search function that prioritizes active location and selected floors
  const performSearch = (term) => {
    if (!term.trim()) return [];
    
    const termLower = term.toLowerCase();
    let results = RAW_OFFICE_DATA.filter(room => 
      room.name.toLowerCase().includes(termLower) || 
      room.extension.includes(termLower)
    );
    
    // Sort results to prioritize active location and selected floors
    results = results.sort((a, b) => {
      // First prioritize active location
      if (a.location === state.activeLocation && b.location !== state.activeLocation) return -1;
      if (a.location !== state.activeLocation && b.location === state.activeLocation) return 1;
      
      // Then prioritize selected floors if any are selected
      if (state.selectedFloors.length > 0) {
        const aIsOnSelectedFloor = state.selectedFloors.includes(a.floor);
        const bIsOnSelectedFloor = state.selectedFloors.includes(b.floor);
        if (aIsOnSelectedFloor && !bIsOnSelectedFloor) return -1;
        if (!aIsOnSelectedFloor && bIsOnSelectedFloor) return 1;
      }
      
      return 0;
    });
    
    return results;
  };
  
  // Role-based access control functions
  const roleControl = {
    canEdit: () => [OfficeMapRoles.ADMIN, OfficeMapRoles.EDITOR].includes(userRole),
    canAdminister: () => userRole === OfficeMapRoles.ADMIN,
    canView: () => userRole !== OfficeMapRoles.NONE,
    upgradeRole: (newRole) => {
      // Only admins can upgrade roles
      if (userRole === OfficeMapRoles.ADMIN) {
        setUserRole(newRole);
        return true;
      }
      return false;
    },
    downgradeRole: (newRole) => {
      // Anyone can downgrade their own role
      setUserRole(newRole);
      return true;
    }
  };
  
  // Handlers for common actions
  const handlers = {
    setActiveLocation: (location) => {
      dispatch({ type: OfficeMapActions.SET_LOCATION, payload: location });
    },
    toggleFloor: (floor) => {
      if (!featureFlags.enableMultiFloorView) {
        // If multi-floor view is disabled, just set the single floor
        dispatch({ 
          type: OfficeMapActions.SET_FLOORS, 
          payload: [floor] 
        });
      } else {
        dispatch({ type: OfficeMapActions.TOGGLE_FLOOR, payload: floor });
      }
    },
    setActiveRoom: (roomId) => {
      dispatch({ type: OfficeMapActions.SET_ACTIVE_ROOM, payload: roomId });
    },
    search: (term) => {
      if (!featureFlags.enableSearch) return;
      
      const results = performSearch(term);
      dispatch({ type: OfficeMapActions.SEARCH, payload: term, results });
    },
    clearSearch: () => {
      dispatch({ type: OfficeMapActions.CLEAR_SEARCH });
    },
    toggleView: () => {
      if (!featureFlags.enableListView) return;
      
      dispatch({ type: OfficeMapActions.TOGGLE_VIEW });
    },
    changeVersion: (version) => {
      if (!featureFlags.enableVersionHistory) return;
      
      dispatch({ type: OfficeMapActions.CHANGE_VERSION, payload: version });
    },
    
    // Admin actions - these check for proper role
    updateRoomData: (roomId, newData) => {
      if (!roleControl.canEdit()) return false;
      
      dispatch({ 
        type: OfficeMapActions.UPDATE_ROOM, 
        payload: { roomId, data: newData } 
      });
      return true;
    },
    moveRoom: (roomId, newPosition) => {
      if (!roleControl.canEdit()) return false;
      
      dispatch({ 
        type: OfficeMapActions.MOVE_ROOM, 
        payload: { roomId, position: newPosition } 
      });
      return true;
    },
    updateLayout: (location, floor, newLayout) => {
      if (!roleControl.canAdminister()) return false;
      
      dispatch({ 
        type: OfficeMapActions.UPDATE_LAYOUT, 
        payload: { location, floor, layout: newLayout } 
      });
      return true;
    }
  };
  
  // Combine state, data, handlers, role control and feature flags
  const contextValue = {
    ...state,
    ...memoizedData,
    ...handlers,
    ...roleControl,
    userRole,
    featureFlags,
    validationResults,
    getAvailableFloors: () => Object.keys(LAYOUT_CONFIG[state.activeLocation] || {}),
    getActiveLocationRooms: () => RAW_OFFICE_DATA.filter(room => room.location === state.activeLocation)
  };
  
  return (
    <OfficeMapContext.Provider value={contextValue}>
      {children}
    </OfficeMapContext.Provider>
  );
};

// Custom hook to use the office map context
const useOfficeMap = () => {
  const context = useContext(OfficeMapContext);
  if (!context) {
    throw new Error('useOfficeMap must be used within an OfficeMapProvider');
  }
  return context;
};

// Admin validation debug overlay component 
const ValidationOverlay = ({ location, floor, positionId, roomId }) => {
  const { validationResults, isPositionValid, canAdminister } = useOfficeMap();
  
  // Only show for admins and when validation results exist
  if (!canAdminister() || !validationResults) return null;
  
  const isValid = isPositionValid(location, floor, positionId);
  
  if (!isValid) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 bg-red-500 bg-opacity-20 rounded-lg border-2 border-red-500 pointer-events-none">
        <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
          Invalid
        </div>
      </div>
    );
  }
  
  // If room is unused (warning), show a yellow indicator 
  if (roomId && validationResults.unusedRooms.includes(roomId)) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 bg-yellow-500 bg-opacity-20 rounded-lg border-2 border-yellow-500 pointer-events-none">
        <div className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">
          Unused
        </div>
      </div>
    );
  }
  
  return null;
};

// Main display component that uses the context
const OfficeMapDisplay = () => {
  const {
    activeRoom,
    searchTerm,
    searchResults,
    showListView,
    activeLocation,
    selectedFloors,
    roomMap,
    getPositionRoomId,
    isPositionValid,
    setActiveRoom,
    setActiveLocation,
    toggleFloor,
    search,
    clearSearch,
    toggleView,
    getAvailableFloors,
    getActiveLocationRooms,
    canEdit,
    canAdminister,
    userRole,
    featureFlags,
    validationResults
  } = useOfficeMap();

  // Derived data
  const searchResultIds = useMemo(() => 
    searchResults.map(room => room.id),
    [searchResults]
  );

  // Handler for search input
  const handleSearchChange = (e) => {
    const term = e.target.value;
    search(term);
  };
  
  // Show validation highlights for admins
  const [showValidation, setShowValidation] = useState(false);

  // Render floor layouts based on selected floors
  const renderFloorLayout = () => {
    const floors = selectedFloors.length > 0 
      ? selectedFloors
      : getAvailableFloors();
    
    return (
      <>
        {floors.map(floor => (
          <FloorSection
            key={`${activeLocation}-${floor}`}
            location={activeLocation}
            floor={floor}
            activeRoom={activeRoom}
            onRoomSelect={setActiveRoom}
            searchResults={searchResultIds}
            roomMap={roomMap}
            getPositionRoomId={getPositionRoomId}
            showValidation={showValidation && canAdminister()}
            className="mb-0"
          />
        ))}
      </>
    );
  };

  // Render room list for directory view or search results
  const renderRoomList = (rooms) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            active={room.id === activeRoom}
            onSelect={setActiveRoom}
          />
        ))}
      </div>
    );
  };

  // Render the type legend
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 px-4 py-2 bg-white shadow-sm text-xs border-b border-gray-200 w-full">
        {Object.entries(ROOM_TYPE_STYLES).map(([key, type]) => (
          <div key={key} className={`${type.bg} px-3 py-1 rounded-full text-${key === 'empty' ? 'gray' : key}-800 flex items-center`}>
            <div className={`w-2 h-2 rounded-full ${type.dot} mr-1`}></div>
            <span>{type.label}</span>
          </div>
        ))}
        
        {/* Validation legend for admins */}
        {validationResults && canAdminister() && (
          <>
            <div className="bg-red-100 px-3 py-1 rounded-full text-red-800 flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span>Invalid Position</span>
            </div>
            <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
              <span>Unused Room</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render validation errors for admins
  const renderValidationErrors = () => {
    if (!validationResults || !canAdminister() || validationResults.valid) return null;
    
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-0 sm:my-4 mx-0 sm:mx-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Layout validation found {validationResults.errors.length} error(s)
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc pl-5 space-y-1">
                {validationResults.errors.slice(0, 3).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {validationResults.errors.length > 3 && (
                  <li>...and {validationResults.errors.length - 3} more errors</li>
                )}
              </ul>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              className="bg-red-50 text-red-500 hover:bg-red-100 focus:outline-none px-4 py-2 rounded-lg text-sm"
              onClick={() => setShowValidation(!showValidation)}
            >
              {showValidation ? 'Hide Highlights' : 'Show Highlights'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-none mx-0 bg-gray-100 min-h-screen" style={{ margin: 0, padding: 0 }}>
      {/* Role indicator for admins and editors */}
      {(canAdminister() || canEdit()) && (
        <div className="bg-gray-800 text-white px-4 py-1 text-xs flex justify-between items-center">
          <div>
            <span className="font-bold">Role:</span> {userRole}
          </div>
          {canAdminister() && (
            <div>
              <button 
                className="ml-4 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white text-xs"
                onClick={() => setShowValidation(!showValidation)}
              >
                {showValidation ? 'Hide Validation' : 'Show Validation'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Header with design improvements */}
      <div className="w-full bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg" style={{ margin: 0, padding: 0 }}>
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500 w-full">
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
        
        {/* Search & Controls Row */}
        <div className="flex items-center px-4 py-3 w-full">
          {/* Search Bar */}
          <div className="flex-1 relative mr-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or extension..."
              className="w-full pl-10 pr-4 py-2 text-sm border-0 bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={!featureFlags.enableSearch}
            />
            {searchTerm && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={clearSearch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* View Toggle */}
          <div className={`bg-blue-800 rounded-lg p-1 flex ${!featureFlags.enableListView ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${!showListView ? 'bg-white text-blue-700 font-medium' : 'text-blue-100 hover:bg-blue-700'}`}
              onClick={() => toggleView()}
              disabled={!featureFlags.enableListView}
            >
              <Grid className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${showListView ? 'bg-white text-blue-700 font-medium' : 'text-blue-100 hover:bg-blue-700'}`}
              onClick={() => toggleView()}
              disabled={!featureFlags.enableListView}
            >
              <List className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
        
        {/* Location Tabs */}
        <div className="flex border-t border-blue-500 bg-blue-800 w-full">
          {Object.entries(LOCATIONS).map(([key, location]) => {
            const LocationIcon = location.icon;
            return (
              <button 
                key={key}
                onClick={() => setActiveLocation(key)}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200 flex justify-center items-center ${activeLocation === key ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700'}`}
              >
                <LocationIcon className="w-4 h-4 mr-1" />
                <span>{location.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* Floor tabs - only shown for active location when relevant */}
        {!showListView && searchResults.length === 0 && getAvailableFloors().length > 1 && featureFlags.enableMultiFloorView && (
          <div className="flex bg-white border-b border-gray-200 shadow-sm overflow-x-auto w-full">
            {getAvailableFloors().map(floor => {
              const floorInfo = FLOORS[floor] || { name: floor, icon: MapPin };
              const FloorIcon = floorInfo.icon;
              return (
                <button 
                  key={floor}
                  onClick={() => toggleFloor(floor)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center
                    ${selectedFloors.includes(floor) 
                      ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <FloorIcon className="w-3 h-3 mr-1" />
                  <span className="ml-1">{floorInfo.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="w-full">{renderLegend()}</div>
      
      {/* Validation Errors for Admins */}
      {renderValidationErrors()}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-amber-50 shadow-md rounded-lg m-0 sm:m-4 overflow-hidden">
          <div className="flex items-center px-4 py-3 bg-amber-100 border-b border-amber-200">
            <Search className="w-5 h-5 text-amber-600 mr-2" />
            <h2 className="font-bold text-amber-800">Search Results ({searchResults.length})</h2>
            <button 
              className="ml-auto text-amber-600 hover:text-amber-800"
              onClick={clearSearch}
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
        <div className="bg-white shadow-md rounded-0 sm:rounded-lg m-0 p-0 overflow-hidden">
          {/* Floor heading */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-800">
              {LOCATIONS[activeLocation]?.name} 
              {selectedFloors.length > 0 
                ? ` - ${selectedFloors.map(floor => FLOORS[floor]?.name || floor).join(', ')}` 
                : ' - All Floors'}
            </h2>
          </div>
          
          {/* Floor map */}
          <div className="p-0 sm:p-2">
            {renderFloorLayout()}
          </div>
        </div>
      ) : (
        searchResults.length === 0 && (
          <div className="bg-white shadow-md rounded-0 sm:rounded-lg m-0 p-0 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center">
              <List className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Directory Listing</h2>
            </div>
            {renderRoomList(getActiveLocationRooms())}
          </div>
        )
      )}
      
      {/* Active Room Details Popup */}
      {activeRoom && (
        <RoomDetailsDrawer 
          roomId={activeRoom} 
          roomMap={roomMap}
          onClose={() => setActiveRoom(null)} 
        />
      )}
      
      {/* Conditional Admin Controls */}
      {canEdit() && (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
            title="Edit Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Main component that wraps the display with the provider
const OfficeFloorMap = ({ initialVersion = 'default' }) => {
  // Add styles to override the root element padding
  React.useEffect(() => {
    // Create a style element to override the root padding
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        #root {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <OfficeMapProvider initialVersion={initialVersion}>
      <div className="p-0 m-0 w-full overflow-hidden" style={{ 
        maxWidth: '100%', 
        margin: 0, 
        padding: 0,
        border: 'none',
        borderRadius: 0
      }}>
        <OfficeMapDisplay />
      </div>
    </OfficeMapProvider>
  );
};

export default OfficeFloorMap;
