// src/app/sara-admin/services/site.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Site } from '../models/site.model';

@Injectable({
  providedIn: 'root',
})
export class SiteService {
  private apiUrl = 'http://localhost:8081/api/sites'; // Base URL for the backend API

  constructor(private http: HttpClient) {}

  /**
   * Fetch all sites.
   * Corresponds to GET /api/sites/all
   */
  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/all`);
  }

  /**
   * Fetch the total count of sites.
   * Corresponds to GET /api/sites/count
   */
  countSites(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  /**
   * Create a new site.
   * Corresponds to POST /api/sites
   */
  createSite(site: { name: string; type: string; displayColor: string }): Observable<Site> {
    return this.http.post<Site>(this.apiUrl, site).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = error.error || 'An unknown error occurred';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Update an existing site.
   * Corresponds to PUT /api/sites/{siteId}
   */
  updateSite(siteId: number, site: { name: string; type: string; displayColor: string }): Observable<Site> {
    return this.http.put<Site>(`${this.apiUrl}/${siteId}`, site).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = error.error || 'An unknown error occurred';
        throw new Error(errorMessage);
      })
    );
  }

  /**
   * Delete a site by ID.
   * Corresponds to DELETE /api/sites/{siteId}
   */
  deleteSite(siteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${siteId}`);
  }
}