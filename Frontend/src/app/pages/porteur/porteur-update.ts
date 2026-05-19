// ═══════════════════════════════════════════════════════════
// Dans porteur.component.ts — ajoute ces modifications
// ═══════════════════════════════════════════════════════════

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PhaseService, Phase } from '../../services/phase.service'; // ← adapte le chemin

@Component({
  selector: 'app-porteur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule , ReactiveFormsModule, FormsModule],
  templateUrl: './porteur.html',
  styleUrls: ['./porteur.css'],
})
export class PorteurComponent implements OnInit, OnDestroy {

  // ── Phases du programme (partagées avec incubateur) ──────
  phases: Phase[] = [];
  currentPhaseIndex = 0; // index de la phase actuelle du porteur

  private sub!: Subscription;

  constructor(private phaseService: PhaseService) {}

  ngOnInit(): void {
    // S'abonne → se met à jour automatiquement quand l'incubateur modifie
    this.sub = this.phaseService.phases$.subscribe(p => {
      this.phases = p;
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  // ── Le reste de tes méthodes existantes ──────────────────
  activeNav = 'tableau';
  setNav(nav: string): void { this.activeNav = nav; }
}