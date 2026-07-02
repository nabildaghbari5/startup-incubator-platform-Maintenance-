import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // ✅ BACKEND URL
  //private apiUrl = 'http://localhost:8083/api/auth';
  private apiUrl = 'http://192.168.1.2:8083/api/auth';

  constructor(private http: HttpClient) {}

  // =========================
  // ✅ REGISTER 
  // =========================
  register(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }

  // =========================
  // ✅ LOGIN
  // =========================
  login(email: string, password: string): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/login`,
      {
        email,
        password
      }
    );
  }

  // =========================
  // ✅ TOKEN
  // =========================
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // =========================
  // ✅ ROLE
  // =========================
  saveRole(role: string) {
    localStorage.setItem('role', role);
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  // =========================
  // ✅ CONNECTED ?
  // =========================
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // =========================
  // ✅ LOGOUT
  // =========================
  logout() {
    localStorage.clear();
  }
}