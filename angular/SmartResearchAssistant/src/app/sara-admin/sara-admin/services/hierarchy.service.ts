// src/app/services/hierarchy.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SiteLevelLocationCentric,
  SensorTypeLevel
} from '../models/hierarchy.model';
@Injectable({
  providedIn: 'root'
})
export class HierarchyService {
  private apiUrl = 'http://localhost:8081/api/hierarchy';

  constructor(private http: HttpClient) { }

  getSensorCentricHierarchy(): Observable<SensorTypeLevel[]> {
    return this.http.get<SensorTypeLevel[]>(`${this.apiUrl}/sensor-centric`);
  }

  getLocationCentricHierarchy(): Observable<SiteLevelLocationCentric[]> {
    return this.http.get<SiteLevelLocationCentric[]>(`${this.apiUrl}/location-centric`);
  }
}