import { EventPorteur } from './components/event-porteur/event-porteur';
import { ProgrammePorteur } from './components/programme-porteur/programme-porteur';
import { DashboardPorteur } from './components/dashboard-porteur/dashboard-porteur';
import { ProjetService } from './service/projet-service';
import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PhaseService } from './service/phase-service';
import { EventService } from './service/event-service';

interface Phase { id?: number; numero: number; mois: string; titre: string; icone: string; description: string; couleur: string; }
interface EvenementDTO { id: number; titre: string; type: string; typeLabel: string; date: string; day: string; month: string; heureDebut: string; heureFin: string; lieu?: string; satisfactionActive?: boolean; }
interface DocumentDTO { id: number; nom: string; type: string; taille: string; statut: string; startupNom: string; uploadedAt: string; chemin?: string; }
interface EvaluationDTO { id: number; scoreIA: number; scoreMarket: number; scoreTeam: number; scoreTech: number; scoreFinance: number; commentaire: string; statut: string; createdAt: string; }
interface MessageDTO { id: number; sender: string; receiver: string; content: string; sentAt: string; lu: boolean; type: string; }

@Component({
  selector: 'app-porteur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule , ProgrammePorteur, EventPorteur, DashboardPorteur],
  templateUrl: './porteur.html',
  styleUrls: ['./porteur.css'],
  encapsulation: ViewEncapsulation.None
})
export class PorteurComponent implements OnInit, OnDestroy {

  private api = 'http://localhost:8083/api';
  private get h() { return new HttpHeaders({ Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }); }
  // ✅ FIX 1 — utilise userId (même clé que le login stocke)
  private get incId() { return localStorage.getItem('userId') || '1'; }
  phases: any[] = [];

  constructor(
    private http: HttpClient,
    private projetService: ProjetService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private phaseservice: PhaseService,
    private eventService :EventService
  ) { }
  projects: any[] = [];
  showProjetModal = false;
  projetForm!: FormGroup;

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



  // ✅ FIX 2 — page démarre sur 'dashboard'
  page = 'dashboard';
  sidebarOpen = true;
  showUserMenu = false;
  private poll: any;

  get currentUser() {
    const email = localStorage.getItem('email') || '';
    return {
      name: email || 'Porteur',
      initials: (email || 'PO').substring(0, 2).toUpperCase(),
      email: email
    };
  }

  get pageLabel(): string {
    const labels: Record<string, string> = {
      dashboard: 'Tableau de bord',
      projet: 'Mes projets',
      programme: "Phase & événements",
      documents: 'Mes documents',
      evaluations: 'Mes évaluations',
      messages: 'Messages',
      profil: 'Mon profil',
      parametres: 'Paramètres',
    };
    return labels[this.page] || this.page;
  }

  toasts: { id: number; msg: string; type: string }[] = [];
  private tid = 0;

  currentPhaseIndex = 0;

  allEvents: any[] = [];
  upcomingEvents: EvenementDTO[] = [];
  loadingEvents = false;

  documents: DocumentDTO[] = [];
  filteredDocuments: DocumentDTO[] = [];
  docSearch = '';
  isUploading = false;
  uploadProgress = 0;
  uploadFileName = '';
  isDragging = false;
  evaluations: EvaluationDTO[] = [];
  contacts: string[] = [];
  activeContact = '';
  messages: MessageDTO[] = [];
  newMessage = '';

  showAddModal = false;
  showEditModal = false;
  editMode = false;
  currentProjetId: number | null = null;
  openAdd(){
    this.showAddModal=true;
  }

  ngOnInit() {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.sub || payload.email || '';
      const role = payload.role || payload.roles?.[0] || '';
      if (email) localStorage.setItem('email', email);
      if (role) localStorage.setItem('role', role);
      if (role.toUpperCase() === 'INCUBATEUR') {
        this.router.navigate(['/incubateur']);
        return;
      }
    } catch (e) {
      console.error('JWT decode error', e);
    }

    this.initForm();
    this.syncPageFromUrl();
    this.loadProjects();
    this.loadPhases();
    this.loadEvents();
    this.loadDocuments();
    this.loadEvaluations();
    this.poll = setInterval(() => {
      if (this.page === 'messages' && this.activeContact) this.loadMessages();
    }, 5000);
  }

  private syncPageFromUrl() {
    const url = this.router.url;
    if (url.includes('/porteur/programme')) this.page = 'programme';
    else if (url.includes('/porteur/projet')) this.page = 'projet';
    else if (url.includes('/porteur/documents')) this.page = 'documents';
    else if (url.includes('/porteur/evaluations')) this.page = 'evaluations';
    else if (url.includes('/porteur/messages')) this.page = 'messages';
    else if (url.includes('/porteur/profil')) this.page = 'profil';
    else if (url.includes('/porteur/parametres')) this.page = 'parametres';
    else this.page = 'dashboard';
  }

 initForm(): void {

  this.projetForm = this.fb.group({

    titre: ['', Validators.required],
    description: ['', Validators.required],
    secteur: ['', Validators.required]

  });
}

onClickUpdateProjet(id: number): void {

  this.editMode = true;
  this.currentProjetId = id;

  this.showEditModal = true;

  this.projetService.getProjetById(id)
    .subscribe({

      next: (data) => {

        this.projetForm.patchValue({
          titre: data.titre,
          description: data.description,
          secteur: data.secteur
        });
      },

      error: (err) => console.error(err)

    });
}

submitProjet(): void {

  if (this.projetForm.invalid) {

    this.projetForm.markAllAsTouched();

    return;
  }

  const request = this.projetForm.value;

  if (this.editMode && this.currentProjetId !== null) {

    this.projetService
      .updateProjet(this.currentProjetId, request)

      .subscribe({

        next: (updatedProjet) => {

          this.projects = this.projects.map(p =>

            p.id === this.currentProjetId
              ? updatedProjet
              : p
          );

          this.projects = [...this.projects];

          this.afterSave();

        },

        error: (err) => {

          console.error('UPDATE ERROR', err);

        }

      });

  } else {

    this.projetService
      .ajouterProjet(request)

      .subscribe({

        next: (newProjet) => {

          this.projects = [
            newProjet,
            ...this.projects
          ];

          this.projects = [...this.projects];

          this.afterSave();

        },

        error: (err) => {

          console.error('CREATE ERROR', err);

        }

      });
  }
}

private afterSave(): void {

  this.showAddModal = false;

  this.showEditModal = false;

  this.projetForm.reset();

  this.editMode = false;

  this.currentProjetId = null;

  this.cdr.detectChanges();

}

loadProjects(): void {

  this.projetService.getMesProjets()
    .subscribe({

      next: (res) => {
        this.projects = res;
      },

      error: (err) => {
        console.error(err);
      }

    });
}
supprimerProjet(id: number): void {

  this.projetService.supprimerProjet(id)
    .subscribe({

      next: () => {

        this.projects = this.projects.filter(
          p => p.id !== id
        );

        this.projects = [...this.projects];

        this.cdr.detectChanges();

        console.log('Projet supprimé');

      },

      error: (err) => {

        console.error(err);

      }

    });

}


loadPhases(): void {
  this.phaseservice.findAllPhase().subscribe({
    next: (phases) => {
      this.phases = phases;
      console.log(this.phases);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des phases :', err);
    }  
  });
}
























  ngOnDestroy() { clearInterval(this.poll); }

  @HostListener('document:keydown.escape') onEsc() { this.showUserMenu = false; }

  goTo(route: string) {
    const map: Record<string, string> = {
      '/porteur': 'dashboard',
      '/porteur/projet': 'projet',
      '/porteur/programme': 'programme',
      '/porteur/documents': 'documents',
      '/porteur/evaluations': 'evaluations',
      '/porteur/messages': 'messages',
      '/porteur/profil': 'profil',
      '/porteur/parametres': 'parametres',
    };
    const p = map[route];
    if (p) this.go(p);
  }

  go(p: string) {
    this.page = p;
    if (p === 'messages') this.loadContacts();
    if (p === 'documents') this.loadDocuments();
    if (p === 'evaluations') this.loadEvaluations();
    if (p === 'programme' && !this.allEvents.length && !this.loadingEvents) {
      this.loadEvents();
    }
  }

  toggleSb() { this.sidebarOpen = !this.sidebarOpen; }
  logout() { localStorage.clear(); this.router.navigate(['/login']); }

  // ── KPIs ─────────────────────────────────────────────────
  get currentPhaseName(): string { return this.phases[this.currentPhaseIndex]?.titre || '—'; }
  get progressPct(): number {
    if (!this.phases.length) return 0;
    return Math.round(((this.currentPhaseIndex + 1) / this.phases.length) * 100);
  }
  get nextJalon(): string {
    return this.phases[this.currentPhaseIndex + 1]?.titre || 'Programme terminé ✅';
  }
  get nextEvent(): EvenementDTO | null { return this.upcomingEvents[0] || null; }



  phaseStatut(i: number): string {
    if (i < this.currentPhaseIndex) return 'termine';
    if (i === this.currentPhaseIndex) return 'en_cours';
    return 'a_venir';
  }
  phaseStatutLabel(i: number): string {
    if (i < this.currentPhaseIndex) return 'Terminé';
    if (i === this.currentPhaseIndex) return 'En cours';
    return 'À venir';
  }
  phaseColor(i: number): string {
    if (i === this.currentPhaseIndex) return this.phases[i]?.couleur || '#6366f1';
    if (i < this.currentPhaseIndex) return '#10b981';
    return '#94a3b8';
  }

  // ── ÉVÉNEMENTS ───────────────────────────────────────────
  loadEvents() {
    this.loadingEvents = true;
    this.eventService.findAll().subscribe({
      next: e => {
        this.applyEventsData(e ?? []);
        this.loadingEvents = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erreur chargement événements', err);
        this.allEvents = [];
        this.upcomingEvents = [];
        this.loadingEvents = false;
        this.toast('Impossible de charger les événements', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private applyEventsData(events: EvenementDTO[]) {
    this.allEvents = [...events].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingEvents = this.allEvents
      .filter(ev => ev.date && new Date(ev.date) >= today)
      .slice(0, 5);
  }

  typeColor(type: string): string {
    const m: Record<string, string> = { workshop: '#7c3aed', pitch: '#3b82f6', reunion: '#10b981', formation: '#f59e0b' };
    return m[type] || '#6b7280';
  }

  // ── DOCUMENTS ────────────────────────────────────────────
  loadDocuments() {
    this.http.get<DocumentDTO[]>(`${this.api}/incubateur/${this.incId}/documents`, { headers: this.h })
      .subscribe({
        next: d => { this.documents = [...d]; this.filterDocuments(); this.cdr.detectChanges(); },
        error: () => { }
      });
  }

  filterDocuments() {
    const q = this.docSearch.toLowerCase().trim();
    this.filteredDocuments = q
      ? this.documents.filter(d => d.nom.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
      : [...this.documents];
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    event.target.value = '';
    if (file) this.uploadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { this.toast('Fichier trop volumineux (max 10 MB)', 'error'); return; }
    this.isUploading = true; this.uploadProgress = 0; this.uploadFileName = file.name;
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('token') || '';
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) { this.uploadProgress = Math.round((e.loaded / e.total) * 100); this.cdr.detectChanges(); }
    });
    xhr.addEventListener('load', () => {
      this.isUploading = false;
      if (xhr.status === 200) {
        try {
          const doc: DocumentDTO = JSON.parse(xhr.responseText);
          this.documents = [...this.documents, doc];
          this.filterDocuments(); this.cdr.detectChanges();
          this.toast(`"${file.name}" uploadé ✅`, 'success');
        } catch { this.loadDocuments(); }
      } else { this.toast('Erreur upload', 'error'); this.cdr.detectChanges(); }
    });
    xhr.addEventListener('error', () => { this.isUploading = false; this.toast('Erreur réseau', 'error'); this.cdr.detectChanges(); });
    xhr.open('POST', `${this.api}/incubateur/${this.incId}/documents/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 60000;
    xhr.send(fd);
  }

  downloadDoc(d: DocumentDTO) {
    const token = localStorage.getItem('token') || '';
    fetch(`${this.api}/incubateur/${this.incId}/documents/${d.id}/download`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = d.nom;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(a.href);
      }).catch(() => this.toast('Erreur téléchargement', 'error'));
  }

  docIcon(type: string): string {
    const m: Record<string, string> = { PDF: '📄', DOCX: '📝', DOC: '📝', XLSX: '📊', XLS: '📊', JPG: '🖼️', JPEG: '🖼️', PNG: '🖼️', ZIP: '🗜️', MP4: '🎬', TXT: '📃' };
    return m[type?.toUpperCase()] || '📎';
  }

  statutDocColor(s: string): string {
    const m: Record<string, string> = { soumis: '#f59e0b', valide: '#10b981', rejete: '#ef4444', en_attente: '#6b7280' };
    return m[s] || '#6b7280';
  }

  // ── ÉVALUATIONS ──────────────────────────────────────────
  loadEvaluations() {
    this.http.get<EvaluationDTO[]>(`${this.api}/incubateur/${this.incId}/evaluations`, { headers: this.h })
      .subscribe({ next: e => { this.evaluations = [...e]; this.cdr.detectChanges(); }, error: () => { } });
  }

  avg(e: EvaluationDTO): number {
    return Math.round((e.scoreIA + e.scoreMarket + e.scoreTeam + e.scoreTech + e.scoreFinance) / 5);
  }
  scoreClass(s: number): string { return s >= 75 ? 'hi' : s >= 50 ? 'md' : 'lo'; }

  // ── MESSAGES ─────────────────────────────────────────────
  loadContacts() {
    const myEmail = localStorage.getItem('email') || '';
    this.http.get<{ email: string; nom: string; prenom: string; role: string }[]>(
      `${this.api}/messages/users`, { headers: this.h }
    ).subscribe({
      next: users => {
        // Double filtre : exclure soi-même côté frontend aussi
        this.contacts = users
          .filter(u => u.email !== myEmail)
          .map(u => u.email);
        this.cdr.detectChanges();
      },
      error: () => { }
    });
  }

  selectContact(email: string) { this.activeContact = email; this.loadMessages(); }

  loadMessages() {
    if (!this.activeContact) return;
    this.http.get<MessageDTO[]>(`${this.api}/messages/conversation`,
      { headers: this.h, params: new HttpParams().set('with', this.activeContact) })
      .subscribe({ next: m => { this.messages = [...m]; this.cdr.detectChanges(); }, error: () => { } });
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

  private getEmailFromToken(): string {
    // Priorité 1 : email stocké depuis le formulaire login (100% fiable)
    const stored = localStorage.getItem('email') || '';
    if (stored) return stored;
    // Priorité 2 : décoder le token JWT
    const token = localStorage.getItem('token') || '';
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email || '';
    } catch { return ''; }
  }

  isMine(m: MessageDTO): boolean { return m.sender === this.getEmailFromToken(); }

  toast(msg: string, type: string = 'info') {
    const t = { id: ++this.tid, msg, type };
    this.toasts.push(t);
    setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id); this.cdr.detectChanges(); }, 3500);
  }
}