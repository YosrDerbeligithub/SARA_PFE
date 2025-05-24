// src/app/sara-admin/services/sensor-type.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import { SensorType } from '../models/sensor-type.model';

@Injectable({
  providedIn: 'root'
})
export class SensorTypeService {
  private apiUrl = 'http://localhost:8081/api/sensortypes';

  constructor(private http: HttpClient) { }

  getSensorTypes(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createSensorType(sensorType: { name: string, unit: string, displayColor: string }): Observable<any> {
    return this.http.post(this.apiUrl, sensorType);
  }

  updateSensorType(id: number, sensorType: { name: string, unit: string, displayColor: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, sensorType);
  }

  deleteSensorType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}