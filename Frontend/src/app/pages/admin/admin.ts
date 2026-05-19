import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface UtilisateurDTO {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statut: string;
  createdAt: string;
  incubateurId?: number;
}

interface StatDTO {
  totalProjets: number;
  projetsEnCours: number;
  projetsValides: number;
  totalUtilisateurs: number;
  totalExperts: number;
  totalPorteurs: number;
  evaluationsMoyenne: number;
  documentsTotal: number;
}

interface PhaseDTO {
  id?: number;
  numero: number;
  mois: string;
  titre: string;
  icone: string;
  description: string;
  couleur: string;
}

interface DecisionDTO {
  id: number;
  projetNom: string;
  scoreIA: number;
  recommandation: string;
  details: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, OnDestroy {

  private api = 'http://localhost:8083/api';
  private get h() { return new HttpHeaders({ Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }); }
  private get incId() { return localStorage.getItem('incubateurId') || '1'; }

  page = 'utilisateurs';
  sidebarOpen = true;
  showUserMenu = false;

  currentUser = {
    name:     localStorage.getItem('email') || 'Admin',
    initials: (localStorage.getItem('email') || 'AD').substring(0, 2).toUpperCase(),
    email:    localStorage.getItem('email') || ''
  };

  toasts: { id: number; msg: string; type: string }[] = [];
  private tid = 0;

  // Stats
  stats: StatDTO = {
    totalProjets: 0, projetsEnCours: 0, projetsValides: 0,
    totalUtilisateurs: 0, totalExperts: 0, totalPorteurs: 0,
    evaluationsMoyenne: 0, documentsTotal: 0
  };

  // Utilisateurs
  utilisateurs: UtilisateurDTO[] = [];
  filteredUsers: UtilisateurDTO[] = [];
  userSearch = '';
  editingUser: UtilisateurDTO | null = null;
  showRoleModal = false;
  selectedRole = '';
  selectedUserId = 0;

  // Programme
  phases: PhaseDTO[] = [];
  editingPhase: PhaseDTO | null = null;
  showPhaseModal = false;
  phaseForm: PhaseDTO = this.emptyPhase();

  // Décisions IA
  decisions: DecisionDTO[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
   // this.loadStats();
    this.loadUtilisateurs();
  }

  ngOnDestroy() {}

  @HostListener('document:keydown.escape') onEsc() {
    this.showUserMenu = false;
    this.showRoleModal = false;
    this.showPhaseModal = false;
  }

  goTo(route: string) {
    const map: Record<string, string> = {
      '/admin':              'dashboard',
      '/admin/utilisateurs': 'utilisateurs',
      '/admin/roles':        'roles',
      '/admin/statistiques': 'statistiques',
      '/admin/programme':    'programme',
      '/admin/decisions':    'decisions',
      '/admin/profil':       'profil',
    };
    const p = map[route];
    if (p) this.go(p);
  }

  go(p: string) {
    this.page = p;
    if (p === 'dashboard')    { this.loadStats(); this.loadUtilisateurs(); }
    if (p === 'utilisateurs') this.loadUtilisateurs();
    if (p === 'roles')        this.loadUtilisateurs();
    if (p === 'statistiques') this.loadStats();
    if (p === 'programme')    this.loadPhases();
    if (p === 'decisions')    this.loadDecisions();
  }

  toggleSb() { this.sidebarOpen = !this.sidebarOpen; }
  logout()   { localStorage.clear(); this.router.navigate(['/login']); }

  // ── STATS ────────────────────────────────────────────────
  loadStats() {
    this.http.get<StatDTO>(`${this.api}/incubateur/${this.incId}/statistiques`, { headers: this.h })
      .subscribe({ next: s => { this.stats = s; this.cdr.detectChanges(); }, error: () => {} });
  }

  // ── UTILISATEURS ─────────────────────────────────────────
  loadUtilisateurs() {
    this.http.get<UtilisateurDTO[]>(`${this.api}/users`, { headers: this.h })
      .subscribe({
        next: u => { this.utilisateurs = u; this.filterUsers(); this.cdr.detectChanges(); },
        error: () => {}
      });
  }

  filterUsers() {
    const q = this.userSearch.toLowerCase().trim();
    this.filteredUsers = q
      ? this.utilisateurs.filter(u =>
          u.email.toLowerCase().includes(q) ||
          (u.nom + ' ' + u.prenom).toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q))
      : [...this.utilisateurs];
  }

  openRoleModal(u: UtilisateurDTO) {
    this.selectedUserId = u.id;
    this.selectedRole = u.role;
    this.editingUser = u;
    this.showRoleModal = true;
  }

  saveRole() {
    this.http.put(`${this.api}/admin/utilisateurs/${this.selectedUserId}/role`,
      { role: this.selectedRole }, { headers: this.h })
      .subscribe({
        next: () => {
          this.showRoleModal = false;
          this.toast('Rôle mis à jour ✅', 'success');
          this.loadUtilisateurs();
        },
        error: () => this.toast('Erreur mise à jour rôle', 'error')
      });
  }

  toggleStatut(id: number , status:String) {
    this.http.put(`${this.api}/users/status/${id}/${status}`, {},{ headers: this.h})
      .subscribe({
        next: () => 
          { 
            this.loadUtilisateurs(); 
          },  
        error: () => this.toast('Erreur', 'error')
      });
  }

  deleteUser(id: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    this.http.delete(`${this.api}/users/${id}`, { headers: this.h })
      .subscribe({
        next: () => { this.toast('Utilisateur supprimé', 'success'); this.loadUtilisateurs(); },
        error: () => this.toast('Erreur suppression', 'error')
      });
  }

  roleColor(r: string): string {
    const m: Record<string, string> = {
      ADMIN: '#f72585', EXPERT: '#00d4aa', PORTEUR: '#9b5de5', INCUBATEUR: '#ffb703'
    };
    return m[r] || '#6b7280';
  }

  statutColor(s: string): string {
    return s === 'ACTIF' ? '#10b981' : '#ef4444';
  }

  // ── PROGRAMME ────────────────────────────────────────────
  loadPhases() {
    this.http.get<PhaseDTO[]>(`${this.api}/incubateur/${this.incId}/phases`, { headers: this.h })
      .subscribe({ next: p => { this.phases = p; this.cdr.detectChanges(); }, error: () => {} });
  }

  emptyPhase(): PhaseDTO {
    return { numero: 1, mois: '', titre: '', icone: '🚀', description: '', couleur: '#6366f1' };
  }

  openPhaseModal(phase?: PhaseDTO) {
    this.phaseForm = phase ? { ...phase } : this.emptyPhase();
    this.editingPhase = phase || null;
    this.showPhaseModal = true;
  }

  savePhase() {
    const obs = this.editingPhase?.id
      ? this.http.put(`${this.api}/incubateur/${this.incId}/phases/${this.editingPhase.id}`, this.phaseForm, { headers: this.h })
      : this.http.post(`${this.api}/incubateur/${this.incId}/phases`, this.phaseForm, { headers: this.h });
    obs.subscribe({
      next: () => {
        this.showPhaseModal = false;
        this.toast(this.editingPhase ? 'Phase mise à jour ✅' : 'Phase créée ✅', 'success');
        this.loadPhases();
      },
      error: () => this.toast('Erreur sauvegarde phase', 'error')
    });
  }

  deletePhase(id: number) {
    if (!confirm('Supprimer cette phase ?')) return;
    this.http.delete(`${this.api}/incubateur/${this.incId}/phases/${id}`, { headers: this.h })
      .subscribe({
        next: () => { this.toast('Phase supprimée', 'success'); this.loadPhases(); },
        error: () => this.toast('Erreur suppression', 'error')
      });
  }

  // ── DÉCISIONS IA ─────────────────────────────────────────
  loadDecisions() {
    this.http.get<DecisionDTO[]>(`${this.api}/incubateur/${this.incId}/decisions`, { headers: this.h })
      .subscribe({ next: d => { this.decisions = d; this.cdr.detectChanges(); }, error: () => {} });
  }

  recommandColor(r: string): string {
    const m: Record<string, string> = { VALIDER: '#10b981', REJETER: '#ef4444', APPROFONDIR: '#f59e0b' };
    return m[r] || '#6b7280';
  }

  // ── TOASTS ───────────────────────────────────────────────
  toast(msg: string, type: string = 'info') {
    const t = { id: ++this.tid, msg, type };
    this.toasts.push(t);
    setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id); this.cdr.detectChanges(); }, 3500);
  }
}