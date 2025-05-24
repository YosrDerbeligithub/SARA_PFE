import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ValidationError {
  dataPath: string;
  schemaPath: string;
  message: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationError[];
}

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private readonly apiUrl = 'http://localhost:8081/datasets/validate';

  constructor(private http: HttpClient) {}

  validate(data: any, schema: any): Observable<ValidationResponse> {
    const payload={
      data: data,
      schema: schema
    };
    console.log('Validation payload:', payload);
    return this.http.post<ValidationResponse>(this.apiUrl, payload);
  }
}