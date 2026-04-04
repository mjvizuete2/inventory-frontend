import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environments';

type LoginResponse = {
  token: string;
};

type TokenPayload = {
  sub: number;
  email: string;
  role: string;
  exp?: number;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'inventory_auth_token';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((response) => localStorage.setItem(this.storageKey, response.token))
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    const payload = this.decodeToken();
    if (!payload) {
      return false;
    }

    return !payload.exp || payload.exp * 1000 > Date.now();
  }

  getUserEmail(): string {
    return this.decodeToken()?.email ?? '';
  }

  private decodeToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
    } catch {
      return null;
    }
  }
}
