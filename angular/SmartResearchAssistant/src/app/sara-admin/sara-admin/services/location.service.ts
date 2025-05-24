// src/app/sara-admin/services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Location } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://localhost:8081/api/locations'; // Align with Spring Boot backend API URL

  constructor(private http: HttpClient) {}

  /**
   * Fetch all locations.
   * Corresponds to GET /api/locations
   */
  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  /**
   * Fetch a single location by ID.
   * Corresponds to GET /api/locations/{locationId}
   */
  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new location.
   * Corresponds to POST /api/locations
   */
  createLocation(location: { name: string; siteId: number; displayColor: string }): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = error.error || 'An unknown error occurred';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Update an existing location.
   * Corresponds to PUT /api/locations/{locationId}
   */
  updateLocation(locationId: number, location: { name: string; siteId: number; displayColor: string }): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/${locationId}`, location).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = error.error || 'An unknown error occurred';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Delete a location by ID.
   * Corresponds to DELETE /api/locations/{locationId}
   */
  deleteLocation(locationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${locationId}`);
  }

  /**
   * Fetch the total count of locations.
   * Corresponds to GET /api/locations/count
   */
  countLocations(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}