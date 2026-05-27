import { Phase } from './../../../services/phase.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PhaseService {

  private api = 'http://localhost:8083/api/phases';

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

  /**
   * ID utilisateur connecté
   */
  private get userId(): string {

    return localStorage.getItem('userId') || '';
  }


  loadPhasesAll(): Observable<Phase[]> {

    return this.http.get<Phase[]>(

      `${this.api}/incubateur/${this.userId}/phases`,

      {
        headers: this.headers
      }

    );

  }

  findAllPhase():Observable<any>{
     return this.http.get<any>(this.api , { headers: this.headers})
  }




}
