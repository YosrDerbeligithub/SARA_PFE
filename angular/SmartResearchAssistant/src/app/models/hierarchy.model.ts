export interface SensorDataPoint {
  time: string;
  value: number;
}

export interface SensorType {
  name: string;
  unit: string;
}

export interface TimeOption {
  value: string;
  label: string;
}

export interface ChartType {
  value: string;
  icon: string;
  label: string;
  viewType?: 'default' | 'radio'; // Add view type differentiation

}

export interface Alert {
  id: number;
  sensor: string;
  location: string;
  message: string;
  time: string;
  read: boolean;
}

export interface FlatLocation {
  id: string;
  name: string;
  path: string[];
  fullPath: string;
}

export interface SiteLocation {
  locationId: number;
  locationName: string;
  displayColor: string;
  sensorBoxes: SensorBox[];
}

export interface Site {
  siteId: number;
  siteName: string;
  siteType: string;
  displayColor: string;
  locations: SiteLocation[];
}

export interface BuildingLocation {
  locationId: number;
  locationName: string;
  displayColor: string;
  sensorBoxes: SensorBox[];
}

export interface SensorBox {
  sensorBoxId: number;
  agentSerial: string;
  displayColor: string;
  assignments: SensorAssignment[];
}

export interface SensorAssignment {
  sensorTypeId: number;
  sensorType: string;
  displayColor: string;
  displayColor_sensortype?: string; // Optional property
}