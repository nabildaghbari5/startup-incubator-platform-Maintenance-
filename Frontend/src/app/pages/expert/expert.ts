import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ProjetService } from '../porteur/service/projet-service';

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
  imports: [CommonModule, FormsModule, RouterModule],
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
  totalEvals = 0;
  avgScore = 0;
  pendingCount = 0;


  projects: any[] = [];
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
    private projetService:ProjetService
  ) {}

  ngOnInit() {
    this.loadProjets();
    this.loadMyEvaluations();
    this.poll = setInterval(() => {
      if (this.page === 'messages' && this.activeContact) this.loadMessages();
    }, 5000);

    this.findAllProjet();
  }

   findAllProjet(){
      this.projetService.findAll()
    .subscribe({

      next: (res) => {
        this.projects = res;
      },

      error: (err) => {
        console.error(err);
      }

    });
  }












































  ngOnDestroy() { clearInterval(this.poll); }

  @HostListener('document:keydown.escape') onEsc() {
    this.showUserMenu = false;
    this.selectedProjet = null;
  }

  goTo(route: string) {
    const map: Record<string, string> = {
      '/expert':            'dashboard',
      '/expert/projets':    'projets',
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
    if (p === 'evaluer')   { this.loadProjets(); this.loadMyEvaluations(); }
    if (p === 'dashboard') { this.loadProjets(); this.loadMyEvaluations(); }
  }

  toggleSb() { this.sidebarOpen = !this.sidebarOpen; }
  logout()   { localStorage.clear(); this.router.navigate(['/login']); }

  // ── PROJETS ──────────────────────────────────────────────
  loadProjets() {
    this.http.get<ProjetDTO[]>(`${this.api}/startups`, { headers: this.h })
      .subscribe({
        next: p => {
          this.projets = p;
          this.pendingCount = p.filter(pr => pr.statut === 'EN_ATTENTE').length;
          this.filterProjets();
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  filterProjets() {
    const q = this.projetSearch.toLowerCase().trim();
    this.filteredProjets = q
      ? this.projets.filter(p => p.nom.toLowerCase().includes(q) || p.secteur.toLowerCase().includes(q))
      : [...this.projets];
  }

  selectProjet(p: ProjetDTO) {
    this.selectedProjet = p;
    this.evalForm = this.emptyEval();
    this.evalForm.projetId = p.id;
  }

  statutColor(s: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: '#f59e0b', EVALUE: '#10b981', REJETE: '#ef4444', EN_COURS: '#6366f1'
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

      this.totalEvals = e.length;

      this.avgScore = e.length
        ? Math.round(
            e.reduce((acc, ev) => acc + this.avg(ev), 0) / e.length
          )
        : 0;

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

  // ── TOASTS ───────────────────────────────────────────────
  toast(msg: string, type: string = 'info') {
    const t = { id: ++this.tid, msg, type };
    this.toasts.push(t);
    setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id); this.cdr.detectChanges(); }, 3500);
  }
}