// src/app/sara-admin/models/site.model.ts
export type SiteType = 'CAMPUS' | 'MUSEUM' | 'OTHER';

export interface Site {
  siteId: number; // Matches "siteId" from the backend
  name: string;
  type: string; // Expected values: "CAMPUS", "MUSEUM", "OTHER"
  locationCount: number;
  sensorBoxCount: number;
  createdAt: string;
  displayColor: string;
}