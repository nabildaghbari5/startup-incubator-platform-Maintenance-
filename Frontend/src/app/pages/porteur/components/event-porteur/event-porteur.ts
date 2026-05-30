import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvenementDTO } from './../../../../services/programme.service';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  SatisfactionDTO,
  SatisfactionService,
} from '../../service/satisfaction-service';

@Component({
  selector: 'app-event-porteur',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './event-porteur.html',
  styleUrl: './event-porteur.css',
})
export class EventPorteur implements OnInit, OnChanges {
  @Input() allEvents: EvenementDTO[] = [];
  @Input() loadingEvents = false;

  /** Copie locale synchronisée avec @Input pour un affichage fiable après init / ngOnChanges */
  displayEvents: EvenementDTO[] = [];

  mySatisfactions: SatisfactionDTO[] = [];
  showSatModal = false;
  selectedEvent: EvenementDTO | null = null;
  satNote = 0;
  satHover = 0;
  satComment = '';
  isSubmittingSat = false;
  satError = '';

  constructor(
    private satisfactionService: SatisfactionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.syncEventsFromInput();
    this.loadMySatisfactions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allEvents']) {
      this.syncEventsFromInput();
      if (!changes['allEvents'].firstChange || (this.allEvents?.length ?? 0) > 0) {
        this.loadMySatisfactions();
      }
    }
  }

  private syncEventsFromInput(): void {
    this.displayEvents = [...(this.allEvents || [])].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
    this.cdr.detectChanges();
  }

  private loadMySatisfactions(): void {
    this.satisfactionService.getByPorteur().subscribe({
      next: list => {
        this.mySatisfactions = [...list];
        this.cdr.detectChanges();
      },
      error: () => {
        this.mySatisfactions = [];
      },
    });
  }

  getMySatisfaction(eventId: number): SatisfactionDTO | undefined {
    return this.mySatisfactions.find(s => s.evenementId === eventId);
  }

  hasSubmitted(eventId: number): boolean {
    return this.mySatisfactions.some(s => s.evenementId === eventId);
  }

  openSatModal(e: EvenementDTO): void {
    this.selectedEvent = e;
    this.satError = '';
    const existing = this.getMySatisfaction(e.id);
    this.satNote = existing?.note ?? 0;
    this.satComment = existing?.commentaire ?? '';
    this.satHover = 0;
    this.showSatModal = true;
  }

  closeSatModal(): void {
    this.showSatModal = false;
    this.selectedEvent = null;
    this.satNote = 0;
    this.satHover = 0;
    this.satComment = '';
    this.satError = '';
  }

  setSatNote(n: number): void {
    this.satNote = n;
  }

  setSatHover(n: number): void {
    this.satHover = n;
  }

  clearSatHover(): void {
    this.satHover = 0;
  }

  submitSat(): void {
    if (!this.selectedEvent?.id) return;
    if (this.satNote < 1 || this.satNote > 5) {
      this.satError = 'Veuillez sélectionner une note entre 1 et 5 étoiles.';
      return;
    }

    this.isSubmittingSat = true;
    this.satError = '';
    this.satisfactionService
      .submit(this.selectedEvent.id, {
        note: this.satNote,
        commentaire: this.satComment.trim() || undefined,
      })
      .subscribe({
        next: saved => {
          const idx = this.mySatisfactions.findIndex(
            s => s.evenementId === saved.evenementId
          );
          if (idx >= 0) {
            this.mySatisfactions[idx] = saved;
          } else {
            this.mySatisfactions = [...this.mySatisfactions, saved];
          }
          this.isSubmittingSat = false;
          this.closeSatModal();
          this.cdr.detectChanges();
        },
        error: err => {
          this.isSubmittingSat = false;
          this.satError =
            err?.error?.error || 'Erreur lors de l\'envoi de la satisfaction.';
          this.cdr.detectChanges();
        },
      });
  }
}
