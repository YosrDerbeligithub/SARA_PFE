import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authEndpoints = [
    '/auth/login',
    '/auth/signup',
    '/auth/refresh',
    '/auth/logout'
  ];

  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip interception for auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add token if available
    const token = this.authService.token;
    if (token) {
      req = this.addToken(req, token);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        return throwError(() => error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    return this.authEndpoints.some(endpoint => url.includes(endpoint));
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handleUnauthorizedError(): void {
    // Don't attempt refresh if we're already handling auth
    if (this.router.url.includes('/auth')) return;

    // Clear session and redirect to login
    this.authService.clearSession();
    this.router.navigate(['/signin'], {
      queryParams: { sessionExpired: true }
    });
  }
}