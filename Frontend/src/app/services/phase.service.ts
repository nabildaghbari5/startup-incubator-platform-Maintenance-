import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Phase {
  id?: number;
  name: string;
  icon: string;
  iconBg: string;
  color: string;
  duration: string;
  items: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PhaseService {

  private apiUrl = 'http://localhost:8082/api/phases';

  // Source partagée
  private phasesSubject = new BehaviorSubject<Phase[]>(this.loadFromStorage());

  phases$ = this.phasesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadPhases();
  }

  // Getter
  get phases(): Phase[] {
    return this.phasesSubject.getValue();
  }

  // Ajouter
  addPhase(phase: Phase): void {

    this.http.post<Phase>(this.apiUrl, phase)
      .subscribe({

        next: (created) => {

          this.update([...this.phases, created]);

        },

        error: () => {

          this.update([...this.phases, phase]);

        }

      });

  }

  // Modifier
  updatePhase(phase: Phase): void {

    if (!phase.id) return;

    this.http.put<Phase>(`${this.apiUrl}/${phase.id}`, phase)
      .subscribe({

        next: (updated) => {

          const updatedList = this.phases.map(p =>
            p.id === updated.id ? updated : p
          );

          this.update(updatedList);

        },

        error: () => {

          const updatedList = this.phases.map(p =>
            p.id === phase.id ? phase : p
          );

          this.update(updatedList);

        }

      });

  }

  // Supprimer
  deletePhase(id: number): void {

    const updatedList = this.phases.filter(p => p.id !== id);

    this.http.delete(`${this.apiUrl}/${id}`)
      .subscribe({

        next: () => {

          this.update(updatedList);

        },

        error: () => {

          this.update(updatedList);

        }

      });

  }

  // Charger depuis backend
  loadPhases(): void {

    this.http.get<Phase[]>(this.apiUrl)
      .subscribe({

        next: (data) => {

          if (data && data.length > 0) {

            this.update(data);

          }

        },

        error: () => {

          const local = this.loadFromStorage();

          this.update(local);

        }

      });

  }

  // Sauvegarder
  saveAll(): void {

    this.saveToStorage(this.phases);

  }

  // Mise à jour interne
  private update(phases: Phase[]): void {

    this.phasesSubject.next(phases);

    this.saveToStorage(phases);

  }

  // LocalStorage
  private saveToStorage(phases: Phase[]): void {

    localStorage.setItem('s2t_phases', JSON.stringify(phases));

  }

  // Charger localStorage
  private loadFromStorage(): Phase[] {

    try {

      const saved = localStorage.getItem('s2t_phases');

      if (saved) {

        return JSON.parse(saved);

      }

    } catch {}

    return this.defaultPhases();

  }

  // Données par défaut
  private defaultPhases(): Phase[] {

    return [

      {
        name: 'Idéation',
        icon: '💡',
        iconBg: '#ede9fe',
        color: '#7c3aed',
        duration: '1 mois',
        items: [
          'Atelier Design Thinking',
          'Mme. Sameh Chenni, ESECT'
        ]
      },

      {
        name: 'Business Model & Stratégie',
        icon: '🎯',
        iconBg: '#dbeafe',
        color: '#3b82f6',
        duration: '1 mois',
        items: [
          'Atelier Green BMC',
          'Experte en Développement Durable',
          'Veille marché'
        ]
      },

      {
        name: 'Étude de faisabilité',
        icon: '📊',
        iconBg: '#d1fae5',
        color: '#10b981',
        duration: '1 mois',
        items: [
          'Propriété Intellectuelle',
          'Étude financière: Mme Lamia Ben Ammar'
        ]
      },

      {
        name: 'Solution et Prototypage',
        icon: '⚡',
        iconBg: '#ffedd5',
        color: '#f97316',
        duration: '1 mois',
        items: [
          'Atelier PoC Timmo Vanderbeek',
          'Stages d\'immersion S2T'
        ]
      },

      {
        name: 'Branding',
        icon: '📣',
        iconBg: '#fce7f3',
        color: '#ec4899',
        duration: '1 mois',
        items: [
          'Marketing digital et Veille E-réputation',
          'Techniques de communication'
        ]
      },

      {
        name: 'Préparation incubation',
        icon: '🚀',
        iconBg: '#dcfce7',
        color: '#22c55e',
        duration: '1 mois',
        items: [
          'Atelier pre label Startup ACT',
          'Networking investisseurs',
          'Pitch jury experts'
        ]
      }

    ];

  }

}