// src/app/sara-admin/services/sensor-box.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SensorBox } from '../models/sensor-box.model';

@Injectable({
  providedIn: 'root',
})
export class SensorBoxService {
  private apiUrl = 'http://localhost:8081/api/sensorboxes'; // Base URL for the backend API

  constructor(private http: HttpClient) {}

  /**
   * Fetch all sensor boxes.
   * Corresponds to GET /api/sensorboxes
   */
  getSensorBoxes(): Observable<SensorBox[]> {
    return this.http.get<SensorBox[]>(this.apiUrl);
  }

  /**
   * Fetch the total count of sensor boxes.
   * Corresponds to GET /api/sensorboxes/count
   */
  countSensorBoxes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  /**
   * Create a new sensor box.
   * Corresponds to POST /api/sensorboxes
   */
  createSensorBox(sensorBox: { agentSerial: string; locationId: number; displayColor: string }): Observable<SensorBox> {
    return this.http.post<SensorBox>(this.apiUrl, sensorBox);
  }

  /**
   * Update an existing sensor box.
   * Corresponds to PUT /api/sensorboxes/{sensorBoxId}
   */
  updateSensorBox(sensorBoxId: number, sensorBox: { agentSerial: string; locationId: number; displayColor: string }): Observable<SensorBox> {
    return this.http.put<SensorBox>(`${this.apiUrl}/${sensorBoxId}`, sensorBox);
  }

  /**
   * Delete a sensor box by ID.
   * Corresponds to DELETE /api/sensorboxes/{sensorBoxId}
   */
  deleteSensorBox(sensorBoxId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sensorBoxId}`);
  }
}