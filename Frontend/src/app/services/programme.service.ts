import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PhaseDTO {
  id: number;
  numero: number;
  mois: string;
  titre: string;
  icone: string;
  description: string;
  couleur: string;
}

export interface PhaseRequest {
  titre: string;
  mois?: string;
  icone?: string;
  description?: string;
  couleur?: string;
  numero?: number;
}

export interface EvenementDTO {
  id: number;
  titre: string;
  type: string;
  typeLabel: string;
  date: string;
  day: string;
  month: string;
  heureDebut: string;
  heureFin: string;
  lieu: string;
  description: string;
  satisfactionActive?: boolean;
}

export interface EvenementRequest {
  titre: string;
  type: string;
  date: string;        // ISO: "2025-06-10"
  heureDebut: string;  // "09:00"
  heureFin: string;    // "11:00"
  lieu?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgrammeService {

  private api = '/api/incubateur';
  private eventsApi = '/api/evenements';

  constructor(private http: HttpClient) {}

  // ── PHASES ──────────────────────────────────────────────

  getPhases(incId: number): Observable<PhaseDTO[]> {
    return this.http.get<PhaseDTO[]>(`${this.api}/${incId}/phases`);
  }

  createPhase(incId: number, req: PhaseRequest): Observable<PhaseDTO> {
    return this.http.post<PhaseDTO>(`${this.api}/${incId}/phases`, req);
  }

  updatePhase(incId: number, phaseId: number, req: PhaseRequest): Observable<PhaseDTO> {
    return this.http.put<PhaseDTO>(`${this.api}/${incId}/phases/${phaseId}`, req);
  }

  deletePhase(incId: number, phaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${incId}/phases/${phaseId}`);
  }

  movePhase(incId: number, phaseId: number, direction: 'up' | 'down'): Observable<PhaseDTO[]> {
    return this.http.patch<PhaseDTO[]>(
      `${this.api}/${incId}/phases/${phaseId}/move`,
      null,
      { params: { direction } }
    );
  }

  // ── ÉVÉNEMENTS ──────────────────────────────────────────

  getEvenements(incId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.eventsApi}/incubateur/${incId}`);
  }

  getUpcoming(incId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.eventsApi}/incubateur/${incId}/upcoming`);
  }

  createEvenement(incId: number, req: EvenementRequest): Observable<any> {
    return this.http.post<any>(`${this.eventsApi}/incubateur/${incId}`, req);
  }

  deleteEvenement(_incId: number, evId: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsApi}/${evId}`);
  }
}  