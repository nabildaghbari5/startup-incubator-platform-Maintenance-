import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private api = 'http://localhost:8083/api/evenements';

  constructor(private http: HttpClient) { }
    /**
   * Headers JWT
   */
    private get headers(): HttpHeaders {

      return new HttpHeaders({
        Authorization:
          'Bearer ' + (localStorage.getItem('token') || '')
      });
    }

  findAll(): Observable<any> {
    return this.http.get<any>(this.api, { headers: this.headers });
  }

  findByIncubateur(incId: number): Observable<any> {
    return this.http.get<any>(
      `${this.api}/incubateur/${incId}`,
      { headers: this.headers } 
    );
  }

  getUpcoming(incId: number): Observable<any> {
    return this.http.get<any>(
      `${this.api}/incubateur/${incId}/upcoming`,
      { headers: this.headers }
    );
  }

}
