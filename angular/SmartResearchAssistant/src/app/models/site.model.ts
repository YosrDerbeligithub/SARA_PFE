export type SiteType = 'CAMPUS' | 'MUSEUM' | 'OTHER';

export interface Site {
  siteId: number; 
  name: string;
  type: string; 
  locationCount: number;
  sensorBoxCount: number;
  createdAt: string;
  displayColor: string;
}