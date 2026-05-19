import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root',
})
export class ProjetService {

  private api = 'http://localhost:8083/api/projets';

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

  /**
   * Ajouter projet
   */
  ajouterProjet(
    request: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.api}/porteur/${this.userId}`,
      request,
      {
        headers: this.headers
      }
    );
  }

  updateProjet(id: number, data: any): Observable<any> {
    return this.http.put(
      `${this.api}/${id}`,
      data,
      { headers: this.headers }
    );
  }

  /**
   * Mes projets
   */
  getMesProjets(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.api}/mes-projets/${this.userId}`,
      {
        headers: this.headers
      }
    );
  }

    /**
   * findAll
   */
  findAll(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.api}`,
      {
        headers: this.headers
      }
    );
  }

  /**
   * Détails projet
   */
  getProjetById(
    id: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.api}/${id}`,
      {
        headers: this.headers
      }
    );
  }

  /**
   * Supprimer any
   */
  supprimerProjet(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.api}/${id}`,
      {
        headers: this.headers
      }
    );
  }

  changerStatutProjet(
  id: number,
  statut: string
): Observable<any> {

  return this.http.put(

    `${this.api}/${id}/statut`,

    JSON.stringify(statut),

    {

      headers: this.headers.set(
        'Content-Type',
        'application/json'
      )

    }

  );

}

}