import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ProjetService } from '../porteur/service/projet-service';
import { PhaseService } from '../porteur/service/phase-service';
import { DocumentsService, DocumentsDTO } from '../porteur/service/documents-service';
import { DashboardExpert } from './components/dashboard-expert/dashboard-expert';
import { DashboardExpertSnapshot } from './service/dashboard-expert-service';

interface ProjetDTO {
  id: number;
  nom: string;
  description: string;
  secteur: string;
  statut: string;
  porteurNom: string;
  porteurEmail: string;
  createdAt: string;
  scoreIA?: number;
}

interface EvaluationDTO {
  id?: number;
  projetId: number;
  scoreIA: number;
  scoreMarket: number;
  scoreTeam: number;
  scoreTech: number;
  scoreFinance: number;
  commentaire: string;
  statut: string;
  createdAt?: string;
}

interface MessageDTO {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  sentAt: string;
  lu: boolean;
  type: string;
}

@Component({
  selector: 'app-expert',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DashboardExpert],
  templateUrl: './expert.html',
  styleUrls: ['./expert.css'],
  encapsulation: ViewEncapsulation.None
})
export class ExpertComponent implements OnInit, OnDestroy {

  private api = 'http://localhost:8083/api';
  private get h() { return new HttpHeaders({ Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }); }

  page = 'dashboard';
  sidebarOpen = true;
  showUserMenu = false;
  private poll: any;

  currentUser = {
    name:     localStorage.getItem('email') || 'Expert',
    initials: (localStorage.getItem('email') || 'EX').substring(0, 2).toUpperCase(),
    email:    localStorage.getItem('email') || ''
  };

  toasts: { id: number; msg: string; type: string }[] = [];
  private tid = 0;

  // Projets
  projets: ProjetDTO[] = [];
  filteredProjets: ProjetDTO[] = [];
  projetSearch = '';
  selectedProjet: ProjetDTO | null = null;

  // Évaluation en cours
  evalForm: EvaluationDTO = this.emptyEval();
  isSubmitting = false;
  myEvaluations: EvaluationDTO[] = [];

  // Messages
  contacts: string[] = [];
  activeContact = '';
  messages: MessageDTO[] = [];
  newMessage = '';

  // Stats
  documentsNotesMois = 0;
  scoreMoyenDocuments = 0;
  pendingCount = 0;
  documentsEnAttenteCount = 0;


  projects: any[] = [];

  // Phases & documents
  phases: any[] = [];
  selectedPhase: any = null;
  phaseDocuments: DocumentsDTO[] = [];
  draftScores: Record<number, number> = {};
  savingDocId: number | null = null;
  downloadingDocId: number | null = null;
  loadingPhases = false;
  loadingDocuments = false;
  loadingProjects = false;

statutProjetColor(statut: string): string {

    switch (statut) {

      case 'ACCEPTE':
        return '#16a34a';

      case 'REFUSE':
        return '#dc2626';

      case 'EN_COURS_ANALYSE':
        return '#f59e0b';

      default:
        return '#6b7280';
    }
  }




  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private projetService: ProjetService,
    private phaseService: PhaseService,
    private documentsService: DocumentsService
  ) {}

  ngOnInit() {
    this.syncPageFromUrl();
    this.loadDashboard();
    this.loadProjets();
    this.loadMyEvaluations();
    this.loadPageData();
    this.poll = setInterval(() => {
      if (this.page === 'messages' && this.activeContact) this.loadMessages();
    }, 5000);
  }

  /** Déduit la page depuis l’URL sans relancer tout le cycle go(). */
  private syncPageFromUrl() {
    const url = this.router.url;
    if (url.includes('/expert/phases')) this.page = 'phases';
    else if (url.includes('/expert/projets')) this.page = 'projets';
    else if (url.includes('/expert/evaluations') || url.includes('/expert/evaluer')) this.page = 'evaluer';
    else if (url.includes('/expert/messages')) this.page = 'messages';
    else if (url.includes('/expert/profil')) this.page = 'profil';
    else this.page = 'dashboard';
  }

  private loadPageData() {
    if (this.page === 'phases') this.loadPhases();
    if (this.page === 'messages') this.loadContacts();
  }












































  ngOnDestroy() { clearInterval(this.poll); }

  @HostListener('document:keydown.escape') onEsc() {
    this.showUserMenu = false;
    this.selectedProjet = null;
  }

  closeDrops() {
    this.showUserMenu = false;
  }

  goTo(route: string) {
    this.router.navigateByUrl(route);
    const map: Record<string, string> = {
      '/expert':            'dashboard',
      '/expert/projets':    'projets',
      '/expert/phases':     'phases',
      '/expert/evaluer':    'evaluer',
      '/expert/messages':   'messages',
      '/expert/profil':     'profil',
    };
    const p = map[route];
    if (p) this.go(p);
  }

  go(p: string) {
    this.page = p;
    this.selectedProjet = null;
    if (p === 'messages')  this.loadContacts();
    if (p === 'projets')   this.loadProjets();
    if (p === 'phases')    this.loadPhases();
    if (p === 'evaluer')   { this.loadProjets(); this.loadMyEvaluations(); }
    if (p === 'dashboard') { this.loadDashboard(); }
  }

  onDashboardNavigate(p: string) {
    const routes: Record<string, string> = {
      projets: '/expert/projets',
      phases: '/expert/phases',
      evaluer: '/expert/evaluer',
    };
    if (routes[p]) {
      this.goTo(routes[p]);
    } else {
      this.go(p);
    }
  }

  loadDashboard() {
    const expertId = localStorage.getItem('userId') || '1';
    this.http.get<DashboardExpertSnapshot>(`${this.api}/dashboard/expert/${expertId}`, { headers: this.h })
      .subscribe({
        next: snap => {
          const k = snap.kpis;
          this.pendingCount = k.projetsEnAttente;
          this.documentsEnAttenteCount = k.documentsEnAttente;
          this.documentsNotesMois = k.documentsEvaluesMois;
          this.scoreMoyenDocuments = k.scoreMoyenDocuments;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  toggleSb() { this.sidebarOpen = !this.sidebarOpen; }
  logout() {
    this.showUserMenu = false;
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ── PROJETS ──────────────────────────────────────────────
  loadProjets() {
    this.loadingProjects = true;
    this.projetService.findAll().subscribe({
      next: res => {
        this.projects = res ?? [];
        this.projets = this.projects.map(p => this.mapProjetForDashboard(p));
        this.pendingCount = this.projets.filter(
          pr => pr.statut === 'EN_ATTENTE' || pr.statut === 'EN_COURS_ANALYSE'
        ).length;
        this.filterProjets();
        this.loadingProjects = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.projects = [];
        this.projets = [];
        this.filteredProjets = [];
        this.loadingProjects = false;
        this.toast('Impossible de charger les projets', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private mapProjetForDashboard(p: any): ProjetDTO {
    const porteur = p?.porteur;
    const porteurNom = porteur
      ? [porteur.prenom, porteur.nom].filter(Boolean).join(' ').trim() || porteur.email || '—'
      : '—';
    return {
      id: p.id,
      nom: p.titre ?? p.nom ?? '',
      description: p.description ?? '',
      secteur: p.secteur ?? '',
      statut: p.statut ?? '',
      porteurNom,
      porteurEmail: porteur?.email ?? '',
      createdAt: p.dateSoumission ?? p.createdAt ?? ''
    };
  }

  porteurProjetLabel(projet: any): string {
    const p = projet?.porteur;
    if (!p) return '—';
    const name = [p.prenom, p.nom].filter(Boolean).join(' ').trim();
    return name || p.email || '—';
  }

  filterProjets() {
    const q = this.projetSearch.toLowerCase().trim();
    this.filteredProjets = q
      ? this.projets.filter(
          p =>
            (p.nom || '').toLowerCase().includes(q) ||
            (p.secteur || '').toLowerCase().includes(q)
        )
      : [...this.projets];
  }

  selectProjet(p: ProjetDTO) {
    this.selectedProjet = p;
    this.evalForm = this.emptyEval();
    this.evalForm.projetId = p.id;
  }

  statutColor(s: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: '#f59e0b',
      EN_COURS_ANALYSE: '#6366f1',
      ACCEPTE: '#10b981',
      REFUSE: '#ef4444',
      EVALUE: '#10b981',
      REJETE: '#ef4444',
      EN_COURS: '#6366f1'
    };
    return m[s] || '#6b7280';
  }

  // ── ÉVALUATIONS ──────────────────────────────────────────
 loadMyEvaluations() {

  this.http.get<EvaluationDTO[]>(
    `${this.api}/incubateur/1/evaluations`,
    { headers: this.h }

  ).subscribe({

    next: e => {

      this.myEvaluations = e;

      this.cdr.detectChanges();

    },

    error: (err) => {

      console.log(err);

    }

  });

}

  emptyEval(): EvaluationDTO {
    return { projetId: 0, scoreIA: 50, scoreMarket: 50, scoreTeam: 50, scoreTech: 50, scoreFinance: 50, commentaire: '', statut: 'EVALUE' };
  }

  avg(e: EvaluationDTO): number {
    return Math.round((e.scoreIA + e.scoreMarket + e.scoreTeam + e.scoreTech + e.scoreFinance) / 5);
  }

  scoreClass(s: number): string { return s >= 75 ? 'hi' : s >= 50 ? 'md' : 'lo'; }

  submitEval() {

  if (!this.evalForm.projetId) {
    this.toast('Sélectionnez un projet', 'error');
    return;
  }

  this.isSubmitting = true;

  const body = {

    startupId: this.evalForm.projetId,

    scoreInnovation: this.evalForm.scoreIA,

    scoreMarche: this.evalForm.scoreMarket,

    scoreEquipe: this.evalForm.scoreTeam,

    scoreTechnique: this.evalForm.scoreTech,

    scoreFinance: this.evalForm.scoreFinance,

    commentaire: this.evalForm.commentaire

  };

  this.http.post<any>(
    `${this.api}/incubateur/1/evaluations`,
    body,
    { headers: this.h }

  ).subscribe({

    next: () => {

      this.isSubmitting = false;

      this.toast('Évaluation soumise ✅', 'success');

      this.selectedProjet = null;

      this.evalForm = this.emptyEval();

      this.loadMyEvaluations();
      this.loadDashboard();

    },

    error: (err) => {

      console.log(err);

      this.isSubmitting = false;

      this.toast('Erreur soumission', 'error');

    }

  });

}

  // ── MESSAGES ─────────────────────────────────────────────
  loadContacts() {
    this.http.get<string[]>(`${this.api}/messages/contacts`, { headers: this.h })
      .subscribe({ next: c => { this.contacts = c; this.cdr.detectChanges(); }, error: () => {} });
  }

  selectContact(email: string) { this.activeContact = email; this.loadMessages(); }

  loadMessages() {
    if (!this.activeContact) return;
    this.http.get<MessageDTO[]>(`${this.api}/messages/conversation`,
      { headers: this.h, params: new HttpParams().set('with', this.activeContact) })
      .subscribe({ next: m => { this.messages = m; this.cdr.detectChanges(); }, error: () => {} });
  }

  sendMsg() {
    if (!this.newMessage.trim() || !this.activeContact) return;
    const content = this.newMessage.trim();
    this.newMessage = '';
    this.http.post<MessageDTO>(`${this.api}/messages/send`,
      { receiver: this.activeContact, content, type: 'PRIVATE' }, { headers: this.h })
      .subscribe({
        next: m => { this.messages = [...this.messages, m]; this.cdr.detectChanges(); },
        error: () => this.toast('Erreur envoi', 'error')
      });
  }

  isMine(m: MessageDTO): boolean { return m.sender === this.currentUser.email; }

  // ── PHASES & DOCUMENTS ───────────────────────────────────
  loadPhases() {
    this.loadingPhases = true;
    this.phaseService.findAllPhase().subscribe({
      next: list => {
        this.phases = (list || []).sort(
          (a: { numero: number }, b: { numero: number }) => (a.numero ?? 0) - (b.numero ?? 0)
        );
        this.loadingPhases = false;
        if (this.selectedPhase) {
          const still = this.phases.find(p => p.id === this.selectedPhase.id);
          if (still) this.selectPhase(still);
          else {
            this.selectedPhase = null;
            this.phaseDocuments = [];
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPhases = false;
        this.toast('Impossible de charger les phases', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  selectPhase(phase: any) {
    this.selectedPhase = phase;
    this.loadPhaseDocuments(phase.id);
  }

  loadPhaseDocuments(phaseId: number) {
    this.loadingDocuments = true;
    this.documentsService.getDocumentsByPhase(phaseId).subscribe({
      next: docs => {
        this.phaseDocuments = docs || [];
        this.draftScores = {};
        for (const d of this.phaseDocuments) {
          if (d.id != null) {
            this.draftScores[d.id] = d.score != null ? d.score : 50;
          }
        }
        this.loadingDocuments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingDocuments = false;
        this.phaseDocuments = [];
        this.toast('Erreur lors du chargement des documents', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  porteurLabel(doc: DocumentsDTO): string {
    const p = doc.porteur;
    if (!p) return '—';
    const name = [p.prenom, p.nom].filter(Boolean).join(' ').trim();
    return name || p.email || 'Porteur';
  }

  fileTypeLabel(type?: string): string {
    if (!type) return '—';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('png')) return 'PNG';
    if (type.includes('jpeg') || type.includes('jpg')) return 'JPEG';
    if (type.includes('word') || type.includes('document')) return 'Word';
    return type.split('/').pop()?.toUpperCase() || type;
  }

  docStatutLabel(statut?: string): string {
    if (statut === 'EVALUE') return 'Évalué';
    if (statut === 'EN_ATTENTE') return 'En attente';
    return statut || 'En attente';
  }

  docStatutColor(statut?: string): string {
    if (statut === 'EVALUE') return '#10b981';
    return '#f59e0b';
  }

  downloadDocument(doc: DocumentsDTO) {
    const porteurId = doc.porteur?.id;
    const phaseId = doc.phase?.id ?? this.selectedPhase?.id;
    if (!porteurId || !phaseId) {
      this.toast('Document introuvable', 'error');
      return;
    }

    this.downloadingDocId = doc.id ?? null;
    const token = localStorage.getItem('token') || '';
    fetch(`${this.api}/documents/${porteurId}/${phaseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const content = data.document;
        if (!content) throw new Error();
        const binary = atob(content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.fileType || 'application/octet-stream' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = data.fileName || doc.fileName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        this.downloadingDocId = null;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.downloadingDocId = null;
        this.toast('Erreur lors du téléchargement', 'error');
        this.cdr.detectChanges();
      });
  }

  saveDocumentScore(doc: DocumentsDTO) {
    if (!doc.id) return;
    const score = this.draftScores[doc.id];
    if (score == null || score < 0 || score > 100) {
      this.toast('Le score doit être entre 0 et 100', 'error');
      return;
    }
    this.savingDocId = doc.id;
    this.documentsService.updateDocumentScore(doc.id, score).subscribe({
      next: updated => {
        const idx = this.phaseDocuments.findIndex(d => d.id === doc.id);
        if (idx >= 0) this.phaseDocuments[idx] = updated;
        this.savingDocId = null;
        this.toast('Note enregistrée', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingDocId = null;
        this.toast('Erreur lors de l\'enregistrement de la note', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── TOASTS ───────────────────────────────────────────────
  toast(msg: string, type: string = 'info') {
    const t = { id: ++this.tid, msg, type };
    this.toasts.push(t);
    setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id); this.cdr.detectChanges(); }, 3500);
  }
}