// Type definitions for ArtifactCode.jsx
export interface OfficeRoomData {
  id: string;
  name: string;
  extension: string;
  floor: string;
  location: string;
  type: string;
  status: string;
  warning?: string;
}

// Raw office data export
export const RAW_OFFICE_DATA: OfficeRoomData[];

// Room types and styles
export const ROOM_TYPE_STYLES: Record<string, {
  label: string;
  bg: string;
  border: string;
  dot: string;
  icon: any;
  gradientClass: string;
  iconColor: string;
}>;

export const FLOORS: Record<string, { name: string; icon: any }>;
export const LOCATIONS: Record<string, { name: string; icon: any }>;

// Additional exports from ArtifactCode.jsx
export default function OfficeFloorMap(props: { initialVersion?: string }): JSX.Element; 