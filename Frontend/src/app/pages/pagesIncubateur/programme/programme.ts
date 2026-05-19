import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Phase {
  id?: number;
  name: string;
  icon: string;
  iconBg: string;
  color: string;
  duration: string;
  items: string[];
}

export interface Historique {
  date: string;
  action: string;
  actionClass: string;
  description: string;
  par: string;
}

@Component({
  selector: 'app-programme',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './programme.html',
  styleUrls: ['./programme.css'],
})
export class ProgrammeComponent implements OnInit {

  @ViewChild('phaseDialog') phaseDialog!: ElementRef<HTMLDialogElement>;

  private apiUrl = 'http://localhost:8082/api/phases';

  phases: Phase[] = [];
  historique: Historique[] = [];

  toastMsg = '';
  saving = false;

  editingIndex = -1;
  editingPhase: Phase = this.emptyPhase();
  itemsText = '';

  iconsList: string[] = [
    '💡','🎯','📊','⚡','📣','🚀',
    '🧠','💻','📱','🌍','📈','🛠️',
    '🎓','🤝','🏆','🔍','📦',
  ];

  constructor(private http: HttpClient) {}

  // ===========================
  // INIT
  // ===========================
  ngOnInit(): void {
    this.loadPhases();
    this.historique = this.loadHistorique();
  }

  // ===========================
  // LOAD (FIX LOCAL STORAGE)
  // ===========================
  loadPhases(): void {

    const local = this.loadFromStorage();

    // ✅ PRIORITÉ LOCAL STORAGE
    if (local.length > 0) {
      this.phases = local;
      console.log('📦 Chargé depuis localStorage');
      return;
    }

    // ✅ SINON BACKEND
    this.http.get<Phase[]>(this.apiUrl).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.phases = data;
          this.saveToStorage();
        } else {
          this.phases = this.defaultPhases();
          this.saveToStorage();
        }
      },
      error: () => {
        console.warn('❌ backend OFF');
        this.phases = this.defaultPhases();
        this.saveToStorage();
      }
    });
  }

  // ===========================
  // LOCAL STORAGE
  // ===========================
  private loadFromStorage(): Phase[] {
    const saved = localStorage.getItem('phases');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  }

  private saveToStorage(): void {
    localStorage.setItem('phases', JSON.stringify(this.phases));
  }

  private loadHistorique(): Historique[] {
    const saved = localStorage.getItem('historique');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  }

  private saveHistorique(): void {
    localStorage.setItem('historique', JSON.stringify(this.historique));
  }

  // ===========================
  // ADD
  // ===========================
  openAdd(): void {
    this.editingIndex = -1;
    this.editingPhase = this.emptyPhase();
    this.itemsText = '';
    this.phaseDialog.nativeElement.showModal();
  }

  // ===========================
  // EDIT
  // ===========================
  openEdit(index: number): void {
    this.editingIndex = index;
    this.editingPhase = { ...this.phases[index] };
    this.itemsText = this.editingPhase.items.join('\n');
    this.phaseDialog.nativeElement.showModal();
  }

  // ===========================
  // SAVE
  // ===========================
  savePhase(): void {
    if (!this.editingPhase.name.trim()) return;

    this.editingPhase.items = this.itemsText
      .split('\n')
      .map(x => x.trim())
      .filter(x => x !== '');

    if (this.editingIndex === -1) {
      this.phases.push({ ...this.editingPhase });
      this.log('Ajout', this.editingPhase.name);
    } else {
      this.phases[this.editingIndex] = { ...this.editingPhase };
      this.log('Modification', this.editingPhase.name);
    }

    this.saveToStorage();
    this.closeModal();
    this.showToast('✅ Sauvegardé');
  }

  // ===========================
  // DELETE
  // ===========================
  deletePhase(index: number): void {
    const phase = this.phases[index];

    if (!confirm(`Supprimer "${phase.name}" ?`)) return;

    this.phases.splice(index, 1);
    this.log('Suppression', phase.name);

    this.saveToStorage();
    this.showToast('🗑️ Supprimé');
  }

  // ===========================
  // SAVE GLOBAL
  // ===========================
  saveAll(): void {
    this.saving = true;

    setTimeout(() => {
      this.saving = false;
      this.saveToStorage();
      this.log('Enregistrement', 'Programme sauvegardé');
      this.showToast('✅ Programme enregistré');
    }, 800);
  }

  // ===========================
  // HISTORIQUE
  // ===========================
  private log(action: string, name: string): void {
    const cls =
      action === 'Ajout' ? 'action-ajout' :
      action === 'Suppression' ? 'action-supp' :
      'action-modif';

    this.historique.unshift({
      date: new Date().toLocaleString('fr-FR'),
      action,
      actionClass: cls,
      description: `${action} : ${name}`,
      par: 'Admin'
    });

    this.saveHistorique();
  }

  // ===========================
  // UI
  // ===========================
  closeModal(): void {
    this.phaseDialog.nativeElement.close();
    this.editingIndex = -1;
    this.editingPhase = this.emptyPhase();
    this.itemsText = '';
  }

  private showToast(msg: string): void {
    this.toastMsg = msg;
    setTimeout(() => this.toastMsg = '', 3000);
  }

  private emptyPhase(): Phase {
    return {
      name: '',
      icon: '📌',
      iconBg: '#ede9fe',
      color: '#7c3aed',
      duration: '1 mois',
      items: []
    };
  }

  // ===========================
  // DEFAULT DATA
  // ===========================
  private defaultPhases(): Phase[] {
    return [
      {
        name: 'Idéation',
        icon: '💡',
        iconBg: '#ede9fe',
        color: '#7c3aed',
        duration: '1 mois',
        items: ['Design Thinking']
      },
      {
        name: 'Business Model',
        icon: '🎯',
        iconBg: '#dbeafe',
        color: '#3b82f6',
        duration: '1 mois',
        items: ['BMC']
      },
      {
        name: 'Prototype',
        icon: '⚡',
        iconBg: '#ffedd5',
        color: '#f97316',
        duration: '1 mois',
        items: ['PoC']
      }
    ];
  }
}