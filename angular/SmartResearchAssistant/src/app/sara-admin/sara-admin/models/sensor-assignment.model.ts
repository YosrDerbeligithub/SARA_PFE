// src/app/sara-admin/models/sensor-assignment.model.ts
export interface SensorAssignment {
  id: number;
  sensorBoxAgentSerial: string;  // From DTO
  sensorTypeName: string;        // From DTO
  displayColor: string;
  createdAt: string;             // Match DTO field name
}