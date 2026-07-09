import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EvenementDTO } from './../../../../services/programme.service';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DocumentsService } from '../../service/documents-service';

export interface PhaseWithDocument {
  id: number;
  fichierNom?: string;
  score?: number | null;
  documentStatut?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-programme-porteur',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './programme-porteur.html',
  styleUrls: ['./programme-porteur.css'],
})
export class ProgrammePorteur implements OnChanges {
  upcomingRdv: EvenementDTO | null = null;
  rdvDaysLeft = 0;
  @Input() phases: any[] = [];

  uploadingPhaseId: number | null = null;
  uploadProgress = 0;

  constructor(
    private cdr: ChangeDetectorRef,    
    private documentsService: DocumentsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phases']) {
      this.loadPhasesDocuments();
    }
  }

  checkRdv(evs: EvenementDTO[]) {
    const today = new Date();
    const soon = evs.find(e => {
      const d = new Date(e.date);
      const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 7;
    });
    if (soon) {
      this.upcomingRdv = soon;
      this.rdvDaysLeft = Math.ceil(
        (new Date(soon.date).getTime() - today.getTime()) / 86400000
      );
    } else {
      this.upcomingRdv = null;
    }
  }

  private loadPhasesDocuments(): void {
    if (!this.phases?.length) return;

    for (const phase of this.phases) {
      if (!phase?.id) continue;

      this.documentsService.getDocumentInfo(phase.id).subscribe({
        next: dto => {
          this.applyDocumentInfo(phase, dto);
          this.cdr.detectChanges();
        },
        error: () => {
          phase.fichierNom = undefined;
          phase.score = null;
          phase.documentStatut = undefined;
        },
      });
    }
  }

  onPhasePdfSelected(event: Event, phase: PhaseWithDocument) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !phase?.id) return;

    if (!this.isAcceptedPhaseFile(file)) {
      alert('Seuls les fichiers PDF et les images sont acceptés.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10 MB).');
      return;
    }

    this.uploadPhaseDocument(phase, file);
  }

  private isAcceptedPhaseFile(file: File): boolean {
    return this.isPdfFile(file) || this.isImageFile(file);
  }

  private isPdfFile(file: File): boolean {
    return (
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type === 'application/pdf'
    );
  }

  private isImageFile(file: File): boolean {
    return (
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name)
    );
  }

  private uploadPhaseDocument(phase: PhaseWithDocument, file: File): void {
    this.uploadingPhaseId = phase.id;
    this.uploadProgress = 0;
    phase.fichierNom = file.name;
    this.cdr.detectChanges();
  
    this.documentsService.uploadDocument(phase.id, file).subscribe({
      next: ({ progress, response }) => {
        this.uploadProgress = progress;
        if (response) {
          this.uploadingPhaseId = null;
          this.uploadProgress = 0;
          this.applyDocumentInfo(phase, response);
          this.documentsService.getDocumentInfo(phase.id).subscribe({
            next: dto => {
              this.applyDocumentInfo(phase, dto);
              this.cdr.detectChanges();
            },
            error: () => this.cdr.detectChanges(),
          });
          this.cdr.detectChanges();
        } else {
          this.cdr.detectChanges();
        }
      },
      error: err => {
        this.uploadingPhaseId = null;
        this.uploadProgress = 0;
        this.documentsService.getDocumentInfo(phase.id).subscribe({
          next: dto => {
            this.applyDocumentInfo(phase, dto);
            this.cdr.detectChanges();
          },
          error: () => {
            phase.fichierNom = undefined;
            phase.score = null;
            phase.documentStatut = undefined;
            this.cdr.detectChanges();
          },
        });
        const msg =
          err?.error?.error ||
          'Erreur lors du téléversement.';
        console.log(msg);
        this.cdr.detectChanges();
      },
    });
  }

  private applyDocumentInfo(phase: PhaseWithDocument, dto: {
    fileName?: string;
    score?: number | null;
    statut?: string;
  }): void {
    phase.fichierNom = dto.fileName || undefined;
    phase.score = dto.score ?? null;
    phase.documentStatut = dto.statut;
  }

  hasExpertScore(phase: PhaseWithDocument): boolean {
    return phase.score != null;
  }

  scoreLabel(phase: PhaseWithDocument): string {
    if (phase.score == null) {
      return phase.fichierNom ? 'En attente d\'évaluation' : '';
    }
    return `${phase.score}/100`;
  }

  scoreCssClass(phase: PhaseWithDocument): string {
    const s = phase.score ?? 0;
    if (s >= 75) return 'hi';
    if (s >= 50) return 'md';
    return 'lo';
  }
}
