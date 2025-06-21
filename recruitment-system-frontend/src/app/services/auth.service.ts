import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

interface AuthResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: any; // You can define a more specific User interface if needed
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role: 'applicant' | 'company' | 'job_poster';
  company_type?: string;
  company_name?: string;
  profile_picture_url?: string;
  bio?: string;
  background_image_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api'; // Your Laravel API base URL
  private _currentUser = new BehaviorSubject<UserData | null>(null);
  public currentUser$ = this._currentUser.asObservable();

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.loadCurrentUserFromLocalStorage();
  }

  private loadCurrentUserFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        this._currentUser.next(parsedUser);
      } else {
      }
    }
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId) && response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this._currentUser.next(response.user);
        }
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId) && response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this._currentUser.next(response.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
        tap(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          this._currentUser.next(null);
        })
      );
    } else {
      // In SSR, just complete the observable or return a successful observable
      return new Observable(observer => {
        observer.next({ message: 'Logged out (SSR)' });
        observer.complete();
      });
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      return token;
    }
    return null;
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const loggedIn = !!this.getToken();
      return loggedIn;
    }
    return false;
  }

  updateUserProfile(userData: FormData): Observable<AuthResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    // Note: HttpClient automatically sets Content-Type to multipart/form-data when a FormData object is sent.
    return this.http.post<AuthResponse>(`${this.apiUrl}/user/profile`, userData, { headers }).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId) && response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          this._currentUser.next(response.user);
        }
      })
    );
  }

  getCurrentUser(): UserData | null {
    const user = this._currentUser.getValue();
    return user;
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, data);
  }
}
