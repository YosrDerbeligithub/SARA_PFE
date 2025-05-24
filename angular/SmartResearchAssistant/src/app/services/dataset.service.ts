// src/app/services/dataset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Dataset, DatasetDetails, Collaborator, VisibilityType } from '../models/dataset.model';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private apiUrl = 'http://localhost:8081/datasets';

  private refreshDatasetsSource = new Subject<void>();
  refreshDatasets$ = this.refreshDatasetsSource.asObservable();

  constructor(private http: HttpClient) { }


  createDataset(datasetData: any, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}`, datasetData);
  }

getDatasets(): Observable<Dataset[]> {
  return this.http.get<Dataset[]>(`${this.apiUrl}/getAll`).pipe(
    map(datasets => datasets.map(d => ({ ...d }))),
    catchError(this.handleError)
  );
}

getDatasetDetails(id: string): Observable<DatasetDetails> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    map(response => ({
      ...response,
      collaborators: (response.collaborators || []).map((email: string) => ({ email }))
    })),
    catchError(this.handleError)
  );
}

updateVisibility(id: string, visibility: VisibilityType, collaborators?: string[]): Observable<DatasetDetails> {
  return this.http.put<DatasetDetails>(`${this.apiUrl}/${id}/visibility`, {
    visibility,
    collaborators
  }).pipe(
    map(response => ({
      ...response,
      collaborators: this.mapCollaborators(response.collaborators)
    })),
    catchError(this.handleError)
  );
}
updateCollaborators(id: string, collaborators: string[]): Observable<DatasetDetails> {
  return this.http.put<DatasetDetails>(`${this.apiUrl}/${id}/collaborators`, {
    collaborators
  }).pipe(
    map(response => ({
      ...response,
      collaborators: this.mapCollaborators(response.collaborators)
    })),
    catchError(this.handleError)
  );
}
private mapCollaborators(collaborators: any): Collaborator[] {
  if (!collaborators) return [];
  return collaborators.map((c: string | Collaborator) =>
    typeof c === 'string' ? { email: c } : c
  );
}
  updateSchema(id: string, schema: any): Observable<Dataset> {
    return this.http.put<Dataset>(`${this.apiUrl}/${id}/schema`, { schema })
          .pipe(
      // Map the response to convert string[] to Collaborator[]
      map(response => ({
        ...response,
        collaborators: (response as any).collaborators.map((email: string) => ({ email }))
      })),
      catchError(this.handleError)
    );
  }

  deleteDataset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

private handleError(error: any) {
  let errorMessage = 'An error occurred. Please try again later.';
 
  if (error.error instanceof ErrorEvent) {
    // Client-side errors
    errorMessage = error.error.message;
  } else if (error.error?.message) {
    // Server-side errors with message
    errorMessage = error.error.message;
  } else if (error.message) {
    // HTTP error codes
    errorMessage = error.message;
  }

  console.error('API Error:', error);
  return throwError(() => new Error(errorMessage));
}
    triggerDatasetRefresh() {
    this.refreshDatasetsSource.next();
  }
}