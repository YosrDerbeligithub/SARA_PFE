// src/app/models/hierarchy.model.ts

// Location-centric hierarchy interfaces
export interface SiteLevelLocationCentric {
    siteId: number;
    siteName: string;
    siteType: string;
    displayColor: string;
    locations: LocationLevelLocationCentric[];
  }
  
  export interface LocationLevelLocationCentric {
    locationId: number;
    locationName: string;
    displayColor: string;
    sensorBoxes: SensorBoxLevelLocationCentric[];
  }
  
  export interface SensorBoxLevelLocationCentric {
    sensorBoxId: number;
    agentSerial: string;
    displayColor: string;
    assignments: SensorAssignmentLevelLocationCentric[];
  }
  
  export interface SensorAssignmentLevelLocationCentric {
    sensorTypeId: number;
    sensorType: string;
    displayColor: string;
    displayColor_sensortype: string;
  }
  
  // Sensor-centric hierarchy interfaces (if needed)
  export interface SensorTypeLevel {
    sensorTypeId: number;
    sensorType: string;
    unit: string;
    displayColor: string; 
    sites: SiteLevel[];
  }
  
  export interface SiteLevel {
    siteId: number;
    siteName: string;
    displayColor: string; 
    locations: LocationLevel[];
  }
  
  export interface LocationLevel {
    locationId: number;
    locationName: string;
    displayColor: string; 
    sensorBoxes: SensorBoxLevel[];
  }
  
  export interface SensorBoxLevel {
    sensorBoxId: number;
    agentSerial: string;
    displayColor: string; 
    assignments: SensorAssignmentLevel[];
  }
  
  export interface SensorAssignmentLevel {
    assignmentColor: string;
  }