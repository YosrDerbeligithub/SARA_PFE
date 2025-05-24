// src/app/sara-admin/services/sensor-assignment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SensorAssignment } from '../models/sensor-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class SensorAssignmentService {
  private apiUrl = 'http://localhost:8081/api/sensorassignments';

  constructor(private http: HttpClient) { }

  getSensorAssignments(): Observable<SensorAssignment[]> {
    return this.http.get<SensorAssignment[]>(this.apiUrl);
  }

  createSensorAssignment(assignment: { 
    sensorBoxId: number, 
    sensorTypeId: number, 
    displayColor: string 
  }): Observable<SensorAssignment> {
    return this.http.post<SensorAssignment>(this.apiUrl, assignment);
  }

  updateSensorAssignment(id: number, assignment: { 
    sensorBoxId: number, 
    sensorTypeId: number, 
    displayColor: string 
  }): Observable<SensorAssignment> {
    return this.http.put<SensorAssignment>(`${this.apiUrl}/${id}`, assignment);
  }

  deleteSensorAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}