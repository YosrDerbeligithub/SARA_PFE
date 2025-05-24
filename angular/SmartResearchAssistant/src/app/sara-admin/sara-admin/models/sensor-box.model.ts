// src/app/sara-admin/models/sensor-box.model.ts
export type SensorBoxStatus = 'active' | 'inactive' | 'maintenance';

export interface SensorBox {
  sensorBoxId: number;
  agentSerial: string; 
  locationName: string;
  siteName: string;
  sensorCount: number; 
  status: SensorBoxStatus;
  displayColor: string; 
  createdAt: string; 
}