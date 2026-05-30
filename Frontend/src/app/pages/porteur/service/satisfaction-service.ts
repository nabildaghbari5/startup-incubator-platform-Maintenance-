import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SatisfactionDTO {
  id?: number;
  evenementId?: number;
  evenementTitre?: string;
  note: number;
  commentaire?: string;
  createdAt?: string;
  porteurEmail?: string;
}

export interface SatisfactionRequest {
  note: number;
  commentaire?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SatisfactionService {
  private api = 'http://localhost:8083/api/satisfaction';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    });
  }

  private get porteurId(): number {
    return Number(localStorage.getItem('userId') || '0');
  }

  /**
   * GET /api/satisfaction/porteur/{porteurId}
   */
  getByPorteur(porteurId: number = this.porteurId): Observable<SatisfactionDTO[]> {
    return this.http.get<SatisfactionDTO[]>(
      `${this.api}/porteur/${porteurId}`,
      { headers: this.headers }
    );
  }

  /**
   * GET /api/satisfaction/porteur/{porteurId}/evenement/{evenementId}
   */
  getForEvent(
    evenementId: number,
    porteurId: number = this.porteurId
  ): Observable<SatisfactionDTO> {
    return this.http.get<SatisfactionDTO>(
      `${this.api}/porteur/${porteurId}/evenement/${evenementId}`,
      { headers: this.headers }
    );
  }

  /**
   * POST /api/satisfaction/porteur/{porteurId}/evenement/{evenementId}
   */
  submit(
    evenementId: number,
    payload: SatisfactionRequest,
    porteurId: number = this.porteurId
  ): Observable<SatisfactionDTO> {
    return this.http.post<SatisfactionDTO>(
      `${this.api}/porteur/${porteurId}/evenement/${evenementId}`,
      payload,
      { headers: this.headers }
    );
  }
}
