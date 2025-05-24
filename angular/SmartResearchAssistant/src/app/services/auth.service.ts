import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  expiresIn: number;
  refreshToken: string;

  user: {
    id: number;
    email: string;
    role: string;
    username:String
  };
}

interface StoredAuthData extends AuthResponse {
  expiration: number; // Unix timestamp in milliseconds
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL ='http://localhost:8081/auth';
  private readonly REFRESH_BUFFER = 300000; // 5 minutes in milliseconds
  private authSubject = new BehaviorSubject<StoredAuthData | null>(null);
  private refreshTimeout?: number;

  constructor(private http: HttpClient, private router: Router) {
    this.initializeSession();
  }

  // Public methods
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(response => this.storeSession(response)),
      catchError(error => this.handleError(error, 'Login'))
    );
  }

signUp(userData: any): Observable<any> {
  return this.http.post(`${this.API_URL}/signup`, userData).pipe(
    catchError(error => this.handleError(error, 'Signup'))
  );
}

  logout(): void {
    const id = this.authSubject.value?.user.id;
    if (id) {
      this.http.delete(`${this.API_URL}/logout/${id}`).pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/signin']);
        }),
        catchError(error => {
          console.error('Logout failed:', error);
          return this.handleError(error, 'Logout');
        })
      ).subscribe();
    }
  }

  get currentUser(): StoredAuthData | null {
    return this.authSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.token || null;
  }

  // Session management
  private initializeSession(): void {
    const session = localStorage.getItem('session');
    if (!session) return;

    const storedData: StoredAuthData = JSON.parse(session);
    if (Date.now() < storedData.expiration) {
      this.authSubject.next(storedData);
      this.scheduleRefresh(storedData.expiration);
    } else {
      this.clearSession();
    }
  }

  private storeSession(response: AuthResponse): void {
    const expiration = Date.now() + (response.expiresIn * 1000);
    const sessionData: StoredAuthData = { ...response, expiration };

    localStorage.setItem('session', JSON.stringify(sessionData));
    console.log('[AuthService] Storing session:', response); // Add this

    this.authSubject.next(sessionData);
    this.scheduleRefresh(sessionData.expiration);
  }

  public clearSession(): void {
    localStorage.removeItem('session');
    this.authSubject.next(null);
    window.clearTimeout(this.refreshTimeout);
  }

  // Token refresh
  private scheduleRefresh(expiration: number): void {
    const refreshTime = expiration - Date.now() - this.REFRESH_BUFFER;

    window.clearTimeout(this.refreshTimeout);

    if (refreshTime > 0) {
      this.refreshTimeout = window.setTimeout(() => this.refreshToken(), refreshTime);
    } else {
      this.refreshToken();
    }
  }

  private refreshToken(): void {
    const currentSession = this.authSubject.value; // Get current session

    if (!currentSession?.refreshToken) { // Check for refresh token existence
      this.clearSession();
      return;
    }

    this.http.post<AuthResponse>(`${this.API_URL}/refresh`, 
      { refreshToken: currentSession.refreshToken } // Matches RefreshTokenRequest DTO
    ).pipe(
      tap(response => {
        this.storeSession(response); // Store the new session
        console.log('[AuthService] Token refreshed successfully:', response.token); // Log the refreshed token
      }),
      catchError(error => {
        this.clearSession();
        return this.handleError(error, 'Token refresh');
      })
    ).subscribe();
  }

  // Error handling
  private handleError(error: HttpErrorResponse, context: string): Observable<never> {
    let message = 'An unknown error occurred';

    if (error.status === 0) {
      message = 'Network error - please check your internet connection';
    } else if (error.error?.message) {
      message = this.mapErrorMessage(error.error.message);
    }
      if (error.error instanceof ErrorEvent) {
    // Client-side error
    message = error.error.message;
  } else {
    // Server-side error
    message = error.error?.message || error.statusText;
  }

    console.error(`${context} error:`, message);
    return throwError(() => new Error(message));
  }

  private mapErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email or password',
      'EMAIL_EXISTS': 'Email already registered',
      'INVALID_TOKEN': 'Session expired - please login again',
      'TOKEN_EXPIRED': 'Session expired - please login again'
    };

    return messages[code] || 'Authentication failed';
  }
  getUsername(): string {
  // Adjust based on your actual storage logic
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).username : '';
}
}



