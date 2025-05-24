// src/app/sara-admin/models/location.model.ts

export interface Location {
  locationId: number; 
  name: string;
  siteId: number;
  siteName: string;
  displayColor: string;
  sensorBoxCount: number;
  createdAt: string;
}