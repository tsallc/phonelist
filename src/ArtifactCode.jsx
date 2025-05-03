import React, { useState, useEffect, useMemo, useReducer, createContext, useContext, useRef } from 'react';
import { Search, MapPin, Phone, List, Grid, Users, Coffee, Printer, FileText, Home, Waves } from 'lucide-react';

// Room type styles - separated from render logic
const ROOM_TYPE_STYLES = {
  empty: { 
    label: 'Empty', 
    bg: 'bg-muted', 
    border: 'border-border', 
    dot: 'bg-muted-foreground',
    icon: Home,
    gradientClass: 'bg-gradient-to-r from-muted/50 to-muted border-l-4 border-border',
    iconColor: 'text-muted-foreground'
  },
  common: { 
    label: 'Common Area', 
    bg: 'bg-primary/10', 
    border: 'border-primary/30', 
    dot: 'bg-primary',
    icon: Printer,
    gradientClass: 'bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary/40',
    iconColor: 'text-primary'
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
        className={`${ROOM_TYPE_STYLES.empty.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-primary/50' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Home className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="font-bold text-foreground">{room.name}</div>
          </div>
        </div>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
          <span className="font-medium opacity-75">Unoccupied Space</span>
        </div>
      </div>
    )
  },
  common: {
    renderCard: (room, { active, onSelect }) => (
      <div 
        className={`${ROOM_TYPE_STYLES.common.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-primary/50' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <Printer className="w-4 h-4 text-primary" />
            </div>
            <div className="font-bold text-foreground">{room.name}</div>
          </div>
          {room.extension && (
            <div className="bg-background px-3 py-1 rounded-full shadow-sm text-foreground/80 font-medium flex items-center">
              <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
              {room.extension}
            </div>
          )}
        </div>
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
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
        className={`${ROOM_TYPE_STYLES.meeting.gradientClass} p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${active ? 'ring-2 ring-primary/50' : ''}`}
        onClick={() => onSelect(room.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="mr-3">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="font-bold text-foreground">{room.name}</div>
          </div>
          {room.extension && (
            <div className="bg-background px-3 py-1 rounded-full shadow-sm text-foreground/80 font-medium flex items-center">
              <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
              {room.extension}
            </div>
          )}
        </div>
        {room.warning && (
          <div className="mt-2 bg-destructive/10 px-2 py-1 rounded-md text-xs text-destructive flex items-center">
            <svg className="w-3 h-3 mr-1 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            {room.warning}
          </div>
        )}
        <div className="flex items-center mt-3 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
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
  'main': { name: 'Main Floor', icon: Home },
  'ftlauderdale': { name: 'Ft Lauderdale', icon: Waves },
  'tampareo': { name: 'Tampa REO', icon: Home },
  'tampadowntown': { name: 'Tampa Downtown', icon: Coffee }
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
    ftlauderdale: {
      columns: 2,
      layout: [
        [
          ['pos_0_0', 'pos_0_1'],
          ['pos_1_0', 'pos_1_1'],
          ['pos_4_0', 'pos_4_1']
        ]
      ]
    },
    tampareo: {
      columns: 2,
      layout: [
        [
          ['pos_0_0', 'pos_0_1']
        ]
      ]
    },
    tampadowntown: {
      columns: 2,
      layout: [
        [
          ['pos_0_0', 'pos_0_1']
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
    ftlauderdale: {
      'pos_0_0': 'coastal-ft-tina',
      'pos_0_1': 'coastal-ft-xxxx',
      'pos_1_0': 'coastal-ft-2027',
      'pos_1_1': 'coastal-ft-syd',
      'pos_4_0': 'coastal-ft-empty3',
      'pos_4_1': 'coastal-ft-andrea'
    },
    tampareo: {
      'pos_0_0': 'coastal-chad-williams',
      'pos_0_1': 'coastal-rachel-jewell'
    },
    tampadowntown: {
      'pos_0_0': 'coastal-cts-harbor',
      'pos_0_1': 'coastal-cts-harbor2'
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

  // Coastal Title - Ft Lauderdale
  { id: 'coastal-ft-tina', name: 'Tina', extension: '2027', floor: 'ftlauderdale', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-ft-xxxx', name: 'Empty', extension: '', floor: 'ftlauderdale', location: 'coastal', type: 'empty', status: 'inactive' },
  { id: 'coastal-ft-2027', name: 'Empty', extension: '', floor: 'ftlauderdale', location: 'coastal', type: 'empty', status: 'inactive' },
  { id: 'coastal-ft-syd', name: 'Syd', extension: '2020', floor: 'ftlauderdale', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-ft-empty3', name: 'Empty', extension: '', floor: 'ftlauderdale', location: 'coastal', type: 'empty', status: 'inactive' },
  { id: 'coastal-ft-andrea', name: 'Andrea', extension: '2026', floor: 'ftlauderdale', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-ft-empty4', name: 'Empty', extension: '', floor: 'ftlauderdale', location: 'coastal', type: 'empty', status: 'inactive' },
  { id: 'coastal-ft-empty5', name: 'Empty', extension: '', floor: 'ftlauderdale', location: 'coastal', type: 'empty', status: 'inactive' },
  
  // Coastal Title - Tampa REO
  { id: 'coastal-chad-williams', name: 'Chad Williams', extension: '2040', floor: 'tampareo', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-rachel-jewell', name: 'Rachel Jewell', extension: '2041', floor: 'tampareo', location: 'coastal', type: 'office', status: 'active' },
  
  // Coastal Title - Tampa Downtown
  { id: 'coastal-cts-harbor', name: 'CTS-Harbor', extension: '2050', floor: 'tampadowntown', location: 'coastal', type: 'office', status: 'active' },
  { id: 'coastal-cts-harbor2', name: 'CTS-Harbor 2', extension: '2051', floor: 'tampadowntown', location: 'coastal', type: 'office', status: 'active' }
];

// Room component with explicit dependencies (no more global state)
const Room = ({ roomId, roomMap, active, onSelect, className = "", size = "h-[75px]" }) => {
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [epicnessActivated, setEpicnessActivated] = useState(false);
  const timerRef = useRef(null);
  
  if (!roomId) return <div className={`${className} ${size} invisible`}></div>;
  
  const room = roomMap[roomId];
  if (!room) return <div className={`${className} ${size} invisible`}></div>;
  
  const typeInfo = ROOM_TYPES[room.type] || ROOM_TYPES.office;
  const isInactive = room.status === 'inactive';
  
  // Check if this is Will's office with extension 1030
  const isWillsOffice = room.name === 'Will' && room.extension === '1030';
  
  // Uplifting quotes for the easter egg
  const upliftingQuotes = [
    "The real voyage of discovery consists not in seeking new landscapes, but in having new eyes. — Marcel Proust",
    "We must learn to reawaken and keep ourselves awake, not by mechanical aids, but by an infinite expectation of the dawn. — Henry David Thoreau",
    "You want to change the world? You will have to do it in secret. And then nothing will have changed—except you. — Rebecca Solnit (modified)",
    "Those who were seen dancing were thought to be insane by those who could not hear the music. — Nietzsche (attributed)",
    "Civilization advances by extending the number of important operations we can perform without thinking about them. — Alfred North Whitehead"
  ];
  
  
  // Custom styling for Will's office - now with conditional styling based on epicness activation
  let baseStyle = isWillsOffice 
    ? epicnessActivated 
      ? `${className} ${size} relative cursor-pointer transition-all duration-300 
         bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300
         border-2 border-transparent hover:border-white
         rounded-lg flex items-center justify-center text-center 
         shadow-lg hover:shadow-xl will-office-card
         hover:scale-110 hover:z-20` 
      : `${className} ${size} relative cursor-pointer transition-all duration-200 
         border-2 rounded-lg flex items-center justify-center text-center 
         shadow-sm hover:shadow-md ${typeInfo.bg} ${typeInfo.border} subtle-will-office`
    : `${className} ${size} relative cursor-pointer transition-all duration-200 border-2 rounded-lg flex items-center justify-center text-center shadow-sm hover:shadow-md ${typeInfo.bg} ${typeInfo.border}`;
  
  // Highlight if active
  if (active) {
    baseStyle += isWillsOffice && epicnessActivated
      ? " ring-4 ring-pink-500 z-10 transform scale-105" 
      : " ring-4 ring-blue-500 z-10 transform scale-105";
  }
  
  // Start timer for hover and clear it when done
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (isWillsOffice && !epicnessActivated) {
      timerRef.current = setTimeout(() => {
        setEpicnessActivated(true);
      }, 1000); // 1 second delay
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Handle Will's office click for easter egg and epicness activation
  const handleClick = () => {
    if (isWillsOffice) {
      // Start timer for epicness activation if not already active
      if (!epicnessActivated) {
        timerRef.current = setTimeout(() => {
          setEpicnessActivated(true);
        }, 1000); // 1 second delay
      }
      
      // Only show quote and sprinkles if epicness is activated
      if (epicnessActivated) {
        // Show a random quote
        const randomQuote = upliftingQuotes[Math.floor(Math.random() * upliftingQuotes.length)];
        setCurrentQuote(randomQuote);
        setShowQuote(true);
        
        // Create and add the candy sprinkle animation
        const sprinkleContainer = document.createElement('div');
        sprinkleContainer.className = 'candy-sprinkles';
        document.body.appendChild(sprinkleContainer);
        
        // Add 20 random candy sprinkles
        for (let i = 0; i < 20; i++) {
          const sprinkle = document.createElement('div');
          sprinkle.className = 'candy-sprinkle';
          sprinkle.style.left = `${Math.random() * 100}%`;
          sprinkle.style.backgroundColor = [
            '#FF69B4', // Hot Pink
            '#00FFFF', // Cyan
            '#FF00FF', // Magenta
            '#FFFF00', // Yellow
            '#FF9900'  // Orange
          ][Math.floor(Math.random() * 5)];
          sprinkle.style.animationDelay = `${Math.random() * 0.5}s`;
          sprinkleContainer.appendChild(sprinkle);
        }
        
        // Hide after 8 seconds (increased from 3) and remove sprinkle animation
        setTimeout(() => {
          setShowQuote(false);
          if (document.body.contains(sprinkleContainer)) {
            document.body.removeChild(sprinkleContainer);
          }
        }, 8000); // Increased from 3000 to 8000 milliseconds
      }
    }
    
    // Call the original onSelect function
    onSelect(roomId);
  };
  
  // Add Will's office CSS styles
  React.useEffect(() => {
    if (isWillsOffice) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes subtleSparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.15; transform: scale(0.5); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes rainbow-border {
          0% { border-color: #ff00ff; }
          16.6% { border-color: #ff00ff; }
          33.3% { border-color: #00ffff; }
          50% { border-color: #ffff00; }
          66.6% { border-color: #ff9900; }
          83.3% { border-color: #ff69b4; }
          100% { border-color: #ff00ff; }
        }
        
        @keyframes glitter {
          0% { opacity: 0; transform: translate(0, 0); }
          25% { opacity: 1; transform: translate(2px, 2px); }
          50% { opacity: 0.5; transform: translate(-2px, -2px); }
          75% { opacity: 1; transform: translate(-2px, 2px); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
        
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes bubble {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          50% { transform: translateY(-15px) scale(1); opacity: 0.7; }
          100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        }
        
        @keyframes rainbow-text {
          0% { color: #ff00ff; }
          20% { color: #ff69b4; }
          40% { color: #ff9900; }
          60% { color: #ffff00; }
          80% { color: #00ffff; }
          100% { color: #ff00ff; }
        }
        
        @keyframes quote-appear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 105, 180, 0.5); }
          50% { box-shadow: 0 0 35px rgba(255, 105, 180, 0.8), 0 0 50px rgba(0, 255, 255, 0.4); }
        }
        
        /* Subtle sparkling effect for initial state */
        .subtle-will-office {
          position: relative;
          overflow: hidden;
        }
        
        .subtle-sparkle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background-color: white;
          opacity: 0.1;
          z-index: 2;
          pointer-events: none;
          animation: subtleSparkle 3s infinite;
        }
        
        /* Full epic styling */
        .will-office-card {
          overflow: hidden;
          position: relative;
        }
        
        .will-office-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, 
            rgba(255,255,255,0.2) 0%, 
            rgba(255,255,255,0.5) 25%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0.5) 75%, 
            rgba(255,255,255,0.2) 100%);
          background-size: 200% 200%;
          animation: shimmer 3s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        
        .will-office-card:hover {
          border: 2px solid transparent;
          animation: rainbow-border 2s linear infinite;
          box-shadow: 0 0 20px rgba(255, 105, 180, 0.7), 
                      0 0 40px rgba(0, 255, 255, 0.4),
                      0 0 60px rgba(255, 255, 0, 0.2);
        }
        
        .will-sparkle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: white;
          box-shadow: 0 0 5px #fff, 0 0 10px #fff;
          z-index: 2;
          pointer-events: none;
          animation: sparkle 1.5s infinite;
        }
        
        .star {
          position: absolute;
          color: #ffff00;
          font-size: 12px;
          text-shadow: 0 0 5px rgba(255, 255, 0, 0.8);
          animation: float 2s infinite;
          z-index: 2;
        }
        
        .quote-bubble {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(45deg, #ff69b4, #ff00ff, #9933ff);
          padding: 20px 25px;
          border-radius: 15px;
          box-shadow: 0 0 20px rgba(255, 105, 180, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.3);
          color: white;
          font-family: 'Comic Sans MS', cursive, sans-serif;
          max-width: 400px;
          text-align: center;
          z-index: 1000;
          animation: quote-appear 0.5s ease-out forwards, float 4s ease-in-out infinite, pulse-glow 3s infinite;
          border: 2px solid rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px;
          line-height: 1.6;
        }
        
        .quote-bubble::before {
          content: """;
          position: absolute;
          top: 0;
          left: 10px;
          font-size: 60px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1;
        }
        
        .quote-bubble::after {
          content: """;
          position: absolute;
          bottom: -20px;
          right: 10px;
          font-size: 60px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1;
        }
        
        .quote-text {
          position: relative;
          z-index: 2;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .quote-author {
          display: block;
          margin-top: 10px;
          font-style: italic;
          font-size: 0.9em;
          text-align: right;
          opacity: 0.9;
          color: #ffff99;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .candy-sprinkles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 0;
          overflow: visible;
          pointer-events: none;
          z-index: 999;
        }
        
        .candy-sprinkle {
          position: absolute;
          top: 0;
          width: 8px;
          height: 3px;
          border-radius: 2px;
          animation: fall 3s linear forwards;
        }
        
        .bubble {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 105, 180, 0.4));
          box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          animation: bubble 3s ease-in-out infinite;
          z-index: 2;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isWillsOffice]);
  
  return (
    <>
      <div 
        className={baseStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isWillsOffice ? (
          epicnessActivated ? (
            // Epic activated styling
            <>
              {/* Sparkles for Will's office */}
              <div className="will-sparkle" style={{ top: '20%', left: '30%', animationDelay: '0.1s' }}></div>
              <div className="will-sparkle" style={{ top: '70%', left: '20%', animationDelay: '0.5s' }}></div>
              <div className="will-sparkle" style={{ top: '40%', left: '60%', animationDelay: '0.8s' }}></div>
              <div className="will-sparkle" style={{ top: '30%', left: '70%', animationDelay: '0.3s' }}></div>
              
              {/* Stars */}
              <div className="star" style={{ top: '15%', left: '20%', animationDelay: '0.2s' }}>★</div>
              <div className="star" style={{ top: '60%', left: '80%', animationDelay: '0.7s' }}>★</div>
              
              {/* Floating bubbles - only show when hovering */}
              {isHovering && (
                <>
                  <div className="bubble" style={{ bottom: '10%', left: '10%', animationDelay: '0s', width: '6px', height: '6px' }}></div>
                  <div className="bubble" style={{ bottom: '10%', left: '40%', animationDelay: '0.5s', width: '8px', height: '8px' }}></div>
                  <div className="bubble" style={{ bottom: '10%', left: '70%', animationDelay: '1s', width: '10px', height: '10px' }}></div>
                  <div className="bubble" style={{ bottom: '10%', left: '20%', animationDelay: '1.5s', width: '7px', height: '7px' }}></div>
                  <div className="bubble" style={{ bottom: '10%', left: '60%', animationDelay: '0.8s', width: '9px', height: '9px' }}></div>
                </>
              )}
              
              <div className="p-1 flex flex-col h-full justify-center items-center relative z-10">
                <div className="font-bold text-white text-md" style={{
                  fontFamily: "'Comic Sans MS', cursive, sans-serif",
                  textShadow: "0 0 5px #ff00ff, 0 0 10px #00ffff",
                  transform: "rotate(-2deg)"
                }}>WillieP</div>
                <div className="mt-1 flex items-center">
                  <Phone className="w-3 h-3 mr-1 text-white" />
                  <span className="text-white font-bold" style={{
                    fontFamily: "'Comic Sans MS', cursive, sans-serif",
                  }}>1030</span>
                </div>
              </div>
            </>
          ) : (
            // Subtle initial styling
            <>
              {/* Subtle sparkles */}
              <div className="subtle-sparkle" style={{ top: '30%', left: '40%', animationDelay: '0.2s' }}></div>
              <div className="subtle-sparkle" style={{ top: '70%', left: '60%', animationDelay: '1.5s' }}></div>
              <div className="subtle-sparkle" style={{ top: '40%', left: '20%', animationDelay: '0.8s' }}></div>
              
              <div className={`p-1 text-xs md:text-sm flex flex-col h-full justify-center items-center relative ${isInactive ? 'opacity-60' : ''}`}>
                <div className="font-bold">{room.name}</div>
                {room.extension && <div className="mt-1 flex items-center"><Phone className="w-3 h-3 mr-1 text-gray-500" />{room.extension}</div>}
              </div>
            </>
          )
        ) : (
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
        )}
      </div>
      
      {/* Quote bubble */}
      {showQuote && (
        <div className="quote-bubble">
          {currentQuote.includes('—') ? (
            <>
              <div className="quote-text">{currentQuote.split('—')[0].trim()}</div>
              <div className="quote-author">— {currentQuote.split('—')[1].trim()}</div>
            </>
          ) : (
            <div className="quote-text">{currentQuote}</div>
          )}
        </div>
      )}
    </>
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
    <div className="fixed bottom-0 left-0 right-0 bg-background shadow-xl z-20 rounded-t-xl overflow-hidden animate-slide-up">
      <div className="bg-gradient-to-r from-primary to-primary/90 h-1"></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-foreground">{room.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {room.extension && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Extension: {room.extension}
                </div>
              )}
              <div className="text-sm text-muted-foreground flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {LOCATIONS[room.location]?.name} - {FLOORS[room.floor]?.name}
              </div>
            </div>
          </div>
          <button 
            className="bg-muted hover:bg-muted-foreground/20 text-foreground rounded-full p-2 focus:outline-none transition-colors duration-200"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Warning message if room has one */}
        {room.warning && (
          <div className="mt-4 bg-destructive/5 p-3 rounded-lg border-l-4 border-destructive text-sm text-destructive">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span className="font-bold">Warning:</span> <span className="ml-1">{room.warning}</span>
            </div>
          </div>
        )}
        
        {/* Only show room type info if not empty */}
        {room.type !== 'empty' && (
          <div className="mt-4 bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <div className="flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
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
          <button className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-colors duration-200">
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
      (room.name.toLowerCase().includes(termLower) || 
       room.extension.includes(termLower)) &&
      room.type !== 'empty'
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
    getActiveLocationRooms: () => RAW_OFFICE_DATA.filter(room => 
      room.location === state.activeLocation && room.type !== 'empty'
    )
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
        {floors.map(floor => {
          // Default rendering for all floors
          return (
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
              layoutPlugins={DEFAULT_LAYOUT_PLUGINS}
            />
          );
        })}
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
      <div className="flex flex-wrap justify-center gap-2 px-4 py-2 bg-background shadow-sm text-xs border-b border-border w-full">
        {Object.entries(ROOM_TYPE_STYLES).map(([key, type]) => (
          <div key={key} className={`${type.bg} px-3 py-1 rounded-full text-${key === 'empty' ? 'muted-foreground' : key}-800 flex items-center`}>
            <div className={`w-2 h-2 rounded-full ${type.dot} mr-1`}></div>
            <span>{type.label}</span>
          </div>
        ))}
        
        {/* Validation legend for admins */}
        {validationResults && canAdminister() && (
          <>
            <div className="bg-destructive/10 px-3 py-1 rounded-full text-destructive flex items-center">
              <div className="w-2 h-2 rounded-full bg-destructive mr-1"></div>
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
      <div className="bg-destructive/5 border-l-4 border-destructive p-4 my-0 sm:my-4 mx-0 sm:mx-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">
              Layout validation found {validationResults.errors.length} error(s)
            </h3>
            <div className="mt-2 text-sm text-destructive">
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
              className="bg-destructive/5 text-destructive hover:bg-destructive/10 focus:outline-none px-4 py-2 rounded-lg text-sm"
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
    <div className="w-full max-w-none mx-0 bg-muted min-h-screen" style={{ margin: 0, padding: 0 }}>
      {/* Role indicator for admins and editors */}
      {(canAdminister() || canEdit()) && (
        <div className="bg-background text-foreground px-4 py-1 text-xs flex justify-between items-center">
          <div>
            <span className="font-bold">Role:</span> {userRole}
          </div>
          {canAdminister() && (
            <div>
              <button 
                className="ml-4 bg-primary hover:bg-primary/90 px-2 py-1 rounded text-primary-foreground text-xs"
                onClick={() => setShowValidation(!showValidation)}
              >
                {showValidation ? 'Hide Validation' : 'Show Validation'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Header with design improvements */}
      <div className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-lg" style={{ margin: 0, padding: 0 }}>
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/50 w-full">
          <h1 className="text-xl font-bold text-primary-foreground flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Office Phone Directory
          </h1>
          <div className="text-sm text-primary-foreground/80 flex items-center gap-2">
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
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by name or extension..."
              className="w-full pl-10 pr-4 py-2 text-sm border-0 bg-background rounded-lg shadow-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={!featureFlags.enableSearch}
            />
            {searchTerm && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* View Toggle */}
          <div className={`bg-primary-foreground/10 rounded-lg p-1 flex ${!featureFlags.enableListView ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${!showListView ? 'bg-background text-primary' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}
              onClick={() => toggleView()}
              disabled={!featureFlags.enableListView}
            >
              <Grid className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center ${showListView ? 'bg-background text-primary' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}
              onClick={() => toggleView()}
              disabled={!featureFlags.enableListView}
            >
              <List className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
        
        {/* Location Tabs */}
        <div className="flex border-t border-primary/50 bg-primary-foreground/10 w-full">
          {Object.entries(LOCATIONS).map(([key, location]) => {
            const LocationIcon = location.icon;
            return (
              <button 
                key={key}
                onClick={() => setActiveLocation(key)}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200 flex justify-center items-center ${activeLocation === key ? 'bg-background text-primary' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}
              >
                <LocationIcon className="w-4 h-4 mr-1" />
                <span>{location.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* Floor tabs - only shown for active location when relevant */}
        {!showListView && searchResults.length === 0 && getAvailableFloors().length > 1 && featureFlags.enableMultiFloorView && (
          <div className="flex bg-background border-b border-border shadow-sm overflow-x-auto w-full">
            {getAvailableFloors().map(floor => {
              const floorInfo = FLOORS[floor] || { name: floor, icon: MapPin };
              const FloorIcon = floorInfo.icon;
              return (
                <button 
                  key={floor}
                  onClick={() => toggleFloor(floor)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center
                    ${selectedFloors.includes(floor) 
                      ? 'text-primary border-b-2 border-primary bg-primary/5' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
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
        <div className="bg-background shadow-md rounded-0 sm:rounded-lg m-0 p-0 overflow-hidden">
          {/* Floor heading */}
          <div className="p-3 bg-muted/50 border-b border-border flex items-center">
            <MapPin className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-lg font-bold text-foreground">
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
          <div className="bg-background shadow-md rounded-0 sm:rounded-lg m-0 p-0 overflow-hidden">
            <div className="p-3 bg-muted/50 border-b border-border flex items-center">
              <List className="w-5 h-5 text-primary mr-2" />
              <h2 className="text-lg font-bold text-foreground">Directory Listing</h2>
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg"
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
      <div className="p-0 m-0 w-full overflow-hidden bg-background" style={{ 
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
