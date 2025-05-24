import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Site } from '../models/hierarchy.model';

@Injectable({
  providedIn: 'root',
})
export class HierarchyService {
  private readonly apiUrl = 'http://localhost:8081/api/hierarchy/location-centric';

  constructor(private http: HttpClient) {}

  /**
   * Fetch the site hierarchy from the API.
   * @returns Observable of Site[]
   */
  getSiteHierarchy(): Observable<Site[]> {
    return this.http.get<Site[]>(this.apiUrl);
  }
}