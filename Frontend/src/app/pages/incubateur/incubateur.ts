import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewEncapsulation,
  ChangeDetectorRef,
  Pipe,
  PipeTransform
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjetService } from '../porteur/service/projet-service';

// Pipe pour SafeURL (Power BI iframe)
@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private san: DomSanitizer) {}
  transform(url: string): SafeResourceUrl { return this.san.bypassSecurityTrustResourceUrl(url); }
}

interface StartupDTO    { id:number; nom:string; fondateur:string; secteur:string; phase:string; progress:number; aiScore:number; statut:string; statusLabel:string; couleur:string; initiales:string; description?:string; }
interface DashboardStats{ totalStartups:number; startupsActives:number; startupsEnAttente:number; startupsTerminees:number; scoreIAMoyen:number; secteurs:{name:string;count:number;pct:number}[]; }
interface EvenementDTO  { id:number; titre:string; type:string; typeLabel:string; date:string; day:string; month:string; heureDebut:string; heureFin:string; lieu?:string; satisfactionActive?:boolean; }
interface DocumentDTO   { id:number; nom:string; type:string; taille:string; chemin?:string; statut:string; startupNom:string; startupId?:number; uploadedAt:string; visiblePorteur?:boolean; }
interface EvaluationDTO { id:number; scoreIA:number; scoreMarket:number; scoreTeam:number; scoreTech:number; scoreFinance:number; commentaire:string; statut:string; startupNom:string; startupId:number; evaluateur:string; createdAt:string; }
interface MessageDTO    { id:number; sender:string; receiver:string; groupId?:number; content:string; type:string; lu:boolean; sentAt:string; }
interface Phase         { id?:number; numero:number; mois:string; titre:string; icone:string; description:string; couleur:string; }
interface UserContact   { email:string; nom:string; prenom:string; role:string; unread:number; profilPhoto?:string; }
interface GroupeDTO     { id:number; nom:string; membres:string[]; unread:number; createdAt:string; }
interface SatisfactionDTO { id:number; porteurEmail:string; evenementId:number; evenementTitre:string; note:number; commentaire?:string; createdAt:string; }
interface ProjetDTO     { id:number; startupId:number; phasetitre:string; fichierNom:string; fichierPath:string; statut:string; commentaire?:string; soumisLe:string; }

@Component({
  selector: 'app-incubateur',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SafePipe],
  templateUrl: './incubateur.html',
  styleUrls: ['./incubateur.css'],
  encapsulation: ViewEncapsulation.None
})
export class IncubateurComponent implements OnInit, OnDestroy {

  private api = 'http://localhost:8083/api';
  private get incId() { return localStorage.getItem('userId') || '1'; }
  private get h() { return new HttpHeaders({ Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }); }


  projects: any[] = [];
  modalStatus = false;
  selectedProjet: any = null;
  selectedStatus = '';
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

  openStatusModal(projet: any): void {

  this.selectedProjet = projet;

  this.selectedStatus = projet.statut;

  this.modalStatus = true;

}

closeStatusModal(): void {

  this.modalStatus = false;

  this.selectedProjet = null;

  this.selectedStatus = '';

}
  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private projetService:ProjetService
  ) {}

  ngOnInit() {
    this.findAllProjet();

    const token = localStorage.getItem('token') || '';
    if (!token) { this.router.navigate(['/login']); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.sub || payload.email || '';
      const role  = payload.role || '';
      if (email) localStorage.setItem('email', email);
      if (role)  localStorage.setItem('role', role);
      //if (userId != null) localStorage.setItem('userId', String(userId));
      if (role.toUpperCase() === 'PORTEUR') { this.router.navigate(['/porteur']); return; }
    } catch(e) {}

    this.page = 'Tableau de board';
    this.profilPhoto = localStorage.getItem('profilPhoto') || '';
    this.loadDashboard();
    this.loadPhases();
    this.poll = setInterval(() => {
      this.loadUnreadCount();
      if (this.page === 'messages' && (this.activeContact||this.activeGroupId)) this.loadMessages();
    }, 5000);
  }  

  openModal(){
    this.modalStatus=true;
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
changerStatutProjet(): void {
  
  if (!this.selectedProjet) {
    return;
  }

  this.projetService

    .changerStatutProjet(
      this.selectedProjet.id,
      this.selectedStatus
    )

    .subscribe({

      next: (updatedProjet) => {

        this.projects = this.projects.map(p =>

          p.id === updatedProjet.id
            ? updatedProjet
            : p

        );

        this.projects = [...this.projects];

        this.closeStatusModal();

      },

      error: (err) => {

        console.error(err);

      }

    });

}





































  page = 'Tableau de board';
  sidebarOpen = true; showUserMenu = false; isLoading = false;
  toasts: {id:number;msg:string;type:string}[] = [];
  private tid = 0; private poll: any;

  get currentUser() {
    const email = localStorage.getItem('email') || 'Incubateur';
    const nom = localStorage.getItem('nom') || email;
    return { name: nom, initials: nom.substring(0,2).toUpperCase(), email, role: 'Incubateur' };
  }

  get pageLabel(): string {
    const m: Record<string,string> = {
      'Tableau de board':'Tableau de board', startups:'Projets', projets:'Rapports mensuels',
      programme:'Programme', documents:'Documents', evaluations:'Satisfactions',
      messages:'Messagerie', analytics:'Analytics', profil:'Profil'
    };
    return m[this.page] || this.page;
  }

  // ── Profil ────────────────────────────────────────────────
  profilPhoto = localStorage.getItem('profilPhoto') || '';
  profilForm = { nom: localStorage.getItem('nom') || '', newPassword: '', confirmPassword: '' };

  // ── Dashboard ─────────────────────────────────────────────
  stats: DashboardStats = {totalStartups:0,startupsActives:0,startupsEnAttente:0,startupsTerminees:0,scoreIAMoyen:0,secteurs:[]};
  activites: any[] = []; upcomingEvents: EvenementDTO[] = []; unreadCount = 0;
  upcomingRdv: EvenementDTO|null = null; rdvDaysLeft = 0;
  pendingSatisfactions = 0; pendingSatisfactionsList: SatisfactionDTO[] = [];
  currentPhaseIndex = 0;

  get currentActivePhase(): Phase|null { return this.phases[this.currentPhaseIndex] || null; }
  get phaseProgressPct(): number { return this.phases.length ? Math.round(((this.currentPhaseIndex+1)/this.phases.length)*100) : 0; }
  get totalProjets(): number { return this.allProjets.length; }

  // ── Power BI ──────────────────────────────────────────────
  powerBiUrl = localStorage.getItem('powerBiUrl') || '';
  powerBiUrlInput = '';
  powerBiHeight = parseInt(localStorage.getItem('powerBiHeight')||'500');
  showPowerBiModal = false;

  // ── Startups ──────────────────────────────────────────────
  startups: StartupDTO[] = []; filteredStartups: StartupDTO[] = [];
  searchQuery = ''; activeFilter = 'tous';
  sortField = ''; sortDir: 'asc'|'desc' = 'asc';
  currentPage = 1; itemsPerPage = 5;
  filterOptions = [{key:'tous',label:'Tous'},{key:'actif',label:'Actif'},{key:'en_attente',label:'En attente'},{key:'termine',label:'Terminé'}];
  sectorOptions = ['Agriculture','EdTech','HealthTech','FinTech','Logistique','GreenTech','E-commerce'];
  phaseOptions = ['Idéation','Amorçage','Croissance','Expansion','Déploiement'];
  showFormModal=false; showViewModal=false; showDeleteModal=false;
  editMode=false; isSaving=false; isDeleting=false;
  selectedStartup: StartupDTO|null=null; startupToDelete: StartupDTO|null=null;
  formErrors: {nom?:boolean;fondateur?:boolean} = {};
  formData = {nom:'',fondateur:'',secteur:'Agriculture',phase:'Idéation',aiScore:70,statut:'actif',progress:50,description:''};

  // ── Phases ────────────────────────────────────────────────
  phases: Phase[] = []; programmeStatut = 'actif';
  showPhaseModal=false; isSavingPhase=false; editPhaseMode=false;
  phaseToDelete: Phase|null=null; showPhaseDeleteModal=false;
  phaseForm: Phase = {numero:1,mois:'MOIS 1',titre:'',icone:'📌',description:'',couleur:'#ec4899'};
  iconOptions = ['💡','🎯','📊','⚡','🎨','🚀','📋','🤝','💰','📱','🔬','🌱','🏆','🔧','📈'];
  colorOptions = ['#ec4899','#a855f7','#06b6d4','#10b981','#f59e0b','#3b82f6','#f43f5e','#14b8a6','#22c55e','#8b5cf6'];

  // ── Événements ────────────────────────────────────────────
  allEvents: EvenementDTO[] = []; showEventModal=false; isSavingEvent=false;
  eventForm = {titre:'',type:'workshop',date:'',heureDebut:'09:00',heureFin:'11:00',lieu:'',description:'',satisfactionActive:false};
  satisfactions: SatisfactionDTO[] = [];
  showSatisfactionModal = false;
  selectedEventForSat: EvenementDTO|null = null;
  selectedEventSatisfactions: SatisfactionDTO[] = [];

  // ── Documents ─────────────────────────────────────────────
  documents: DocumentDTO[] = []; filteredDocuments: DocumentDTO[] = [];
  docFilter='tous'; docSearch='';
  isDragging=false; isUploading=false; uploadProgress=0; uploadFileName='';
  showDocDeleteModal=false; isDeletingDoc=false; docToDelete: DocumentDTO|null=null;

  // ── Évaluations ───────────────────────────────────────────
  evaluations: EvaluationDTO[] = []; showEvalModal=false; isSavingEval=false;
  evalForm = {startupId:0,scoreIA:70,scoreMarket:70,scoreTeam:70,scoreTech:70,scoreFinance:70,commentaire:''};

  // ── Projets ───────────────────────────────────────────────
  allProjets: ProjetDTO[] = [];
  projetPhaseFilter = '';
  projetStatutFilter = '';
  projetStats = {total:0,enRevision:0,valides:0,rejetes:0};

  get projetsGroupes(): StartupDTO[] {
    return this.startups.filter(s => this.allProjets.some(p => p.startupId === s.id));
  }

  getProjet(startupId: number, phaseTitre: string): ProjetDTO|null {
    return this.allProjets.find(p => p.startupId===startupId && p.phasetitre===phaseTitre) || null;
  }

  filterProjets() { this.loadProjets(); }

  // ── Messages ──────────────────────────────────────────────
  contacts: UserContact[] = []; filteredContacts: UserContact[] = [];
  filteredGroups: GroupeDTO[] = [];
  contactFilter = 'tous'; contactSearch = '';
  activeContact = ''; activeContactRole = ''; activeContactNom = ''; activeContactPhoto = '';
  activeGroupId: number|null = null; activeGroupNom = ''; activeGroupMembers = '';
  messages: MessageDTO[] = []; newMessage = '';
  groupes: GroupeDTO[] = [];
  showNewGroupModal = false;
  newGroupForm = { nom: '', membres: [] as string[] };
  contactsMap: Record<string, UserContact> = {};































  ngOnDestroy() { clearInterval(this.poll); }

  @HostListener('document:keydown.escape') onEsc() { this.closeAll(); }

  go(p: string) {
    this.page = p;
    switch(p) {
      case 'Tableau de board': this.loadDashboard(); break;
      case 'startups':    this.loadStartups(); break;
      case 'projets':     this.loadProjets(); if(!this.startups.length) this.loadStartups(); break;
      case 'programme':   this.loadPhases(); this.loadEvents(); this.loadSatisfactions(); break;
      case 'documents':   this.loadDocuments(); break;
      case 'evaluations': this.loadSatisfactions(); this.loadEvents(); break;
      case 'messages':    this.loadContacts(); this.loadGroupes(); break;
      case 'analytics':   break;
      case 'profil':      break;
    }
  }

  toggleSb()   { this.sidebarOpen = !this.sidebarOpen; }
  closeDrops() { this.showUserMenu = false; }
  closeAll()   {
    this.showFormModal=this.showViewModal=this.showDeleteModal=this.showEventModal=
    this.showEvalModal=this.showPhaseModal=this.showPhaseDeleteModal=
    this.showPowerBiModal=this.showSatisfactionModal=this.showNewGroupModal=false;
  }
  logout() { localStorage.clear(); this.router.navigate(['/login']); }

  // ── DASHBOARD ─────────────────────────────────────────────
  loadDashboard() {
    this.http.get<DashboardStats>(`${this.api}/incubateur/${this.incId}/startups/stats`,{headers:this.h})
      .subscribe({next:s=>{this.stats={...s};this.cdr.detectChanges();},error:()=>{}});
    this.http.get<EvenementDTO[]>(`${this.api}/incubateur/${this.incId}/evenements/upcoming`,{headers:this.h})
      .subscribe({next:e=>{this.upcomingEvents=[...e];this.checkRdv(e);this.cdr.detectChanges();},error:()=>{}});
    this.http.get<any[]>(`${this.api}/incubateur/${this.incId}/activites`,{headers:this.h})
      .subscribe({next:a=>{this.activites=[...a];this.cdr.detectChanges();},error:()=>{}});
    this.loadUnreadCount();
    this.loadPendingSatisfactions();
  }

  loadUnreadCount() {
    this.http.get<{count:number}>(`${this.api}/messages/unread`,{headers:this.h})
      .subscribe({next:r=>{this.unreadCount=r.count;this.cdr.detectChanges();},error:()=>{}});
  }

  checkRdv(evs: EvenementDTO[]) {
    const today = new Date();
    const soon = evs.find(e => {
      const d = new Date(e.date);
      const diff = Math.ceil((d.getTime()-today.getTime())/86400000);
      return diff>=0 && diff<=7;
    });
    if(soon){this.upcomingRdv=soon;this.rdvDaysLeft=Math.ceil((new Date(soon.date).getTime()-today.getTime())/86400000);}
    else this.upcomingRdv=null;
  }

  loadPendingSatisfactions() {
    this.http.get<SatisfactionDTO[]>(`${this.api}/incubateur/${this.incId}/satisfactions`,{headers:this.h})
      .subscribe({next:s=>{this.satisfactions=s;this.pendingSatisfactions=s.length;this.pendingSatisfactionsList=s.slice(0,5);this.cdr.detectChanges();},error:()=>{}});
  }

  // ── POWER BI ──────────────────────────────────────────────
  openPowerBiConfig() { this.powerBiUrlInput=this.powerBiUrl; this.showPowerBiModal=true; }
  savePowerBiConfig() {
    this.powerBiUrl = this.powerBiUrlInput;
    localStorage.setItem('powerBiUrl', this.powerBiUrl);
    localStorage.setItem('powerBiHeight', this.powerBiHeight.toString());
    this.showPowerBiModal = false;
    this.toast('Power BI configuré ✅','success');
  }

  // ── STARTUPS ──────────────────────────────────────────────
  loadStartups(){this.isLoading=true;this.http.get<StartupDTO[]>(`${this.api}/incubateur/${this.incId}/startups`,{headers:this.h}).subscribe({next:s=>{this.startups=[...s];this.applyFilters();this.isLoading=false;this.cdr.detectChanges();},error:()=>{this.isLoading=false;}});}
  applyFilters(){let r=[...this.startups];if(this.activeFilter!=='tous')r=r.filter(s=>s.statut===this.activeFilter);if(this.searchQuery.trim()){const q=this.searchQuery.toLowerCase();r=r.filter(s=>s.nom.toLowerCase().includes(q)||s.fondateur.toLowerCase().includes(q));}if(this.sortField){r.sort((a,b)=>{const va=(a as any)[this.sortField],vb=(b as any)[this.sortField];const c=typeof va==='string'?va.localeCompare(vb):va-vb;return this.sortDir==='asc'?c:-c;});}this.filteredStartups=r;this.currentPage=1;}
  setFilter(f:string){this.activeFilter=f;this.applyFilters();}
  sortBy(f:string){this.sortDir=this.sortField===f&&this.sortDir==='asc'?'desc':'asc';this.sortField=f;this.applyFilters();}
  getFilterCount(k:string){return k==='tous'?this.startups.length:this.startups.filter(s=>s.statut===k).length;}
  clearSearch(){this.searchQuery='';this.applyFilters();}
  get totalPages(){return Math.max(1,Math.ceil(this.filteredStartups.length/this.itemsPerPage));}
  get paged(){const s=(this.currentPage-1)*this.itemsPerPage;return this.filteredStartups.slice(s,s+this.itemsPerPage);}
  get pageNums(){const p:number[]=[],s=Math.max(1,this.currentPage-1);for(let i=s;i<=Math.min(this.totalPages,s+2);i++)p.push(i);return p;}
  gotoPage(p:number){this.currentPage=Math.max(1,Math.min(p,this.totalPages));}
  prevPage(){this.gotoPage(this.currentPage-1);} nextPage(){this.gotoPage(this.currentPage+1);}
  trackById(_:number,s:StartupDTO){return s.id;} trackByPhId(_:number,p:Phase){return p.id??p.numero;}
  openAdd(){this.editMode=false;this.formData={nom:'',fondateur:'',secteur:'Agriculture',phase:'Idéation',aiScore:70,statut:'actif',progress:50,description:''};this.formErrors={};this.showFormModal=true;}
  openEdit(s:StartupDTO){this.editMode=true;this.selectedStartup=s;this.formData={nom:s.nom,fondateur:s.fondateur,secteur:s.secteur,phase:s.phase,aiScore:s.aiScore,statut:s.statut,progress:s.progress,description:s.description||''};this.formErrors={};this.showFormModal=true;}
  openView(s:StartupDTO){this.selectedStartup=s;this.showViewModal=true;}
  openDel(s:StartupDTO){this.startupToDelete=s;this.showDeleteModal=true;}
  goMessageStartup(s: StartupDTO) {
    this.go('messages');
    setTimeout(() => {
      const c = this.contacts.find(c => c.nom.toLowerCase().includes(s.fondateur.toLowerCase()) || c.email.toLowerCase().includes(s.fondateur.toLowerCase()));
      if (c) this.selectContact(c);
    }, 800);
  }
  save(){
    this.formErrors={};
    if(!this.formData.nom.trim())this.formErrors.nom=true;
    if(!this.formData.fondateur.trim())this.formErrors.fondateur=true;
    if(Object.keys(this.formErrors).length)return;
    const isEdit=this.editMode&&this.selectedStartup;
    const url=isEdit?`${this.api}/incubateur/${this.incId}/startups/${this.selectedStartup!.id}`:`${this.api}/incubateur/${this.incId}/startups`;
    this.showFormModal=false;
    this.toast(isEdit?'Startup mise à jour':'Startup ajoutée 🚀','success');
    const req=isEdit?this.http.put<StartupDTO>(url,this.formData,{headers:this.h}):this.http.post<StartupDTO>(url,this.formData,{headers:this.h});
    req.subscribe({next:(s)=>{if(isEdit){const idx=this.startups.findIndex(x=>x.id===s.id);if(idx>-1)this.startups[idx]={...s};}else{this.startups=[...this.startups,s];this.stats.totalStartups++;if(s.statut==='actif')this.stats.startupsActives++;}this.startups=[...this.startups];this.applyFilters();this.cdr.detectChanges();this.loadDashboard();},error:(e)=>{this.toast(e.error?.error||'Erreur','error');this.loadStartups();}});
  }
  del(){
    if(!this.startupToDelete)return;
    const id=this.startupToDelete.id,statut=this.startupToDelete.statut;
    this.startups=this.startups.filter(s=>s.id!==id);this.applyFilters();
    this.stats.totalStartups=Math.max(0,this.stats.totalStartups-1);
    if(statut==='actif')this.stats.startupsActives=Math.max(0,this.stats.startupsActives-1);
    this.showDeleteModal=false;this.toast('Startup supprimée','warning');this.startupToDelete=null;
    this.http.delete(`${this.api}/incubateur/${this.incId}/startups/${id}`,{headers:this.h}).subscribe({next:()=>this.cdr.detectChanges(),error:()=>{this.toast('Erreur','error');this.loadStartups();}});
  }
  exportCSV(){const h='Nom,Fondateur,Secteur,Phase,Score IA,Statut\n';const r=this.filteredStartups.map(s=>`"${s.nom}","${s.fondateur}","${s.secteur}","${s.phase}",${s.aiScore},"${s.statusLabel}"`).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h+r],{type:'text/csv'}));a.download='startups.csv';a.click();}
  sc(score:number){return score>=75?'hi':score>=50?'md':'lo';}

  // ── PROJETS ───────────────────────────────────────────────
  loadProjets() {
    this.http.get<ProjetDTO[]>(`${this.api}/incubateur/${this.incId}/projets`,{headers:this.h})
      .subscribe({
        next: p => {
          this.allProjets = p;
          this.projetStats = {
            total: p.length,
            enRevision: p.filter(x=>x.statut==='en_revision').length,
            valides: p.filter(x=>x.statut==='valide').length,
            rejetes: p.filter(x=>x.statut==='rejete').length
          };
          if (!this.startups.length) this.loadStartups();
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }
  updateProjetStatut(id: number, statut: string) {
    const idx = this.allProjets.findIndex(p => p.id===id);
    if (idx>-1) { this.allProjets[idx]={...this.allProjets[idx],statut}; this.cdr.detectChanges(); }
    this.http.patch(`${this.api}/incubateur/${this.incId}/projets/${id}/statut`,{statut},{headers:this.h})
      .subscribe({next:()=>this.toast('Statut mis à jour','success'),error:()=>this.toast('Erreur','error')});
  }
  saveProjetComment(id: number, commentaire: string) {
    this.http.patch(`${this.api}/incubateur/${this.incId}/projets/${id}/commentaire`,{commentaire},{headers:this.h})
      .subscribe({next:()=>this.toast('Commentaire enregistré','success'),error:()=>{}});
  }
  downloadProjet(p: ProjetDTO) {
    const token = localStorage.getItem('token')||'';
    fetch(`${this.api}/incubateur/${this.incId}/projets/${p.id}/download`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>{if(!r.ok)throw new Error();return r.blob();})
      .then(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=p.fichierNom;document.body.appendChild(a);a.click();document.body.removeChild(a);})
      .catch(()=>this.toast('Erreur téléchargement','error'));
  }

  // ── PHASES ────────────────────────────────────────────────
  loadPhases(){
    this.http.get<Phase[]>(`${this.api}/incubateur/${this.incId}/phases`,{headers:this.h})
      .subscribe({next:p=>{this.phases=[...p];this.cdr.detectChanges();},error:()=>{}});
  }
  openAddPhase(){
    this.editPhaseMode=false;
    const n=this.phases.length+1;
    this.phaseForm={numero:n,mois:`MOIS ${n}`,titre:'',icone:'📌',description:'',couleur:'#ec4899'};
    this.showPhaseModal=true;
  }
  openEditPhase(p:Phase){
    this.editPhaseMode=true;
    this.phaseForm={...p};
    this.showPhaseModal=true;
  }
  setActivePhase(i: number) {
    this.currentPhaseIndex=i;
    this.toast(`Phase "${this.phases[i].titre}" définie comme active`,'success');
  }
  savePhase(){
    if(!this.phaseForm.titre?.trim()){this.toast('Le titre est requis','error');return;}
    const payload={
      titre:this.phaseForm.titre.trim(),
      mois:this.phaseForm.mois,
      icone:this.phaseForm.icone||'📌',
      description:this.phaseForm.description||'',
      couleur:this.phaseForm.couleur||'#ec4899',
      numero:this.phaseForm.numero
    };
    const url=this.editPhaseMode&&this.phaseForm.id
      ?`${this.api}/incubateur/${this.incId}/phases/${this.phaseForm.id}`
      :`${this.api}/incubateur/${this.incId}/phases`;
    const req=this.editPhaseMode&&this.phaseForm.id
      ?this.http.put<Phase>(url,payload,{headers:this.h})
      :this.http.post<Phase>(url,payload,{headers:this.h});
    req.subscribe({
      next:(phase)=>{
        if(this.editPhaseMode){
          const idx=this.phases.findIndex(p=>p.id===phase.id);
          if(idx>-1)this.phases[idx]={...phase};
          this.phases=[...this.phases];
        } else {
          this.phases=[...this.phases,phase];
        }
        this.showPhaseModal=false;
        this.toast(this.editPhaseMode?'Phase mise à jour ✅':'Phase ajoutée ✅','success');
        this.cdr.detectChanges();
      },
      error:(err)=>this.toast(err.error?.error||'Erreur','error')
    });
  }
  openDelPhase(p:Phase){this.phaseToDelete=p;this.showPhaseDeleteModal=true;}
  delPhase(){
    if(!this.phaseToDelete)return;
    const id=this.phaseToDelete.id;
    this.http.delete(`${this.api}/incubateur/${this.incId}/phases/${id}`,{headers:this.h})
      .subscribe({
        next:()=>{
          this.phases=this.phases.filter(p=>p.id!==id);
          this.phases.forEach((p,i)=>{p.numero=i+1;p.mois=`MOIS ${i+1}`;});
          this.phases=[...this.phases];
          this.showPhaseDeleteModal=false;
          this.phaseToDelete=null;
          this.toast('Phase supprimée','warning');
          this.cdr.detectChanges();
        },
        error:()=>{this.toast('Erreur suppression','error');this.loadPhases();}
      });
  }
  movePhase(i:number,d:-1|1){
    const t=i+d;
    if(t<0||t>=this.phases.length)return;
    const phase=this.phases[i];
    if(!phase?.id)return;
    const dir=d===-1?'up':'down';
    this.http.patch<Phase[]>(`${this.api}/incubateur/${this.incId}/phases/${phase.id}/move?direction=${dir}`,{},{headers:this.h})
      .subscribe({
        next:u=>{this.phases=[...u];this.cdr.detectChanges();},
        error:()=>{this.toast('Erreur déplacement','error');this.loadPhases();}
      });
  }
  toggleProg(){
    this.programmeStatut=this.programmeStatut==='actif'?'inactif':'actif';
    this.toast(`Programme ${this.programmeStatut==='actif'?'activé':'désactivé'}`,'info');
  }

  // ── ÉVÉNEMENTS ────────────────────────────────────────────
  loadEvents(){
    this.http.get<EvenementDTO[]>(`${this.api}/incubateur/${this.incId}/evenements`,{headers:this.h})
      .subscribe({next:e=>{this.allEvents=e;this.cdr.detectChanges();},error:()=>{}});
  }
  openEvModal(){
    const today=new Date();
    const yyyy=today.getFullYear();
    const mm=String(today.getMonth()+1).padStart(2,'0');
    const dd=String(today.getDate()).padStart(2,'0');
    this.eventForm={titre:'',type:'workshop',date:`${yyyy}-${mm}-${dd}`,heureDebut:'09:00',heureFin:'11:00',lieu:'',description:'',satisfactionActive:false};
    this.showEventModal=true;
  }
  saveEv(){
    if(!this.eventForm.titre.trim()){this.toast('Le titre est requis','error');return;}
    if(!this.eventForm.date){this.toast('La date est requise','error');return;}
    const payload={
      titre:this.eventForm.titre.trim(),
      type:this.eventForm.type,
      date:this.eventForm.date,
      heureDebut:this.eventForm.heureDebut,
      heureFin:this.eventForm.heureFin,
      lieu:this.eventForm.lieu?.trim()||null,
      description:this.eventForm.description?.trim()||null,
      satisfactionActive:this.eventForm.satisfactionActive
    };
    this.http.post<EvenementDTO>(`${this.api}/incubateur/${this.incId}/evenements`,payload,{headers:this.h})
      .subscribe({
        next:(ev)=>{
          this.allEvents=[...this.allEvents,ev];
          this.upcomingEvents=[...this.allEvents];
          this.showEventModal=false;
          this.toast(`"${ev.titre}" créé ✅`,'success');
          this.checkRdv(this.allEvents);
          this.cdr.detectChanges();
        },
        error:(err)=>this.toast(err.error?.error||'Erreur','error')
      });
  }
  delEv(id:number){
    if(!confirm('Supprimer ?'))return;
    this.allEvents=this.allEvents.filter(e=>e.id!==id);
    this.upcomingEvents=this.upcomingEvents.filter(e=>e.id!==id);
    this.cdr.detectChanges();
    this.http.delete(`${this.api}/incubateur/${this.incId}/evenements/${id}`,{headers:this.h})
      .subscribe({error:()=>{this.toast('Erreur','error');this.loadEvents();}});
  }

  // ── SATISFACTIONS ─────────────────────────────────────────
  loadSatisfactions() {
    this.http.get<SatisfactionDTO[]>(`${this.api}/incubateur/${this.incId}/satisfactions`,{headers:this.h})
      .subscribe({next:s=>{this.satisfactions=s;this.cdr.detectChanges();},error:()=>{}});
  }
  getSatisfactionCount(eventId: number): number { return this.satisfactions.filter(s=>s.evenementId===eventId).length; }
  getSatisfactionAvg(eventId: number): string {
    const list = this.satisfactions.filter(s=>s.evenementId===eventId);
    if (!list.length) return '0';
    return (list.reduce((a,s)=>a+s.note,0)/list.length).toFixed(1);
  }
  getSatisfactionsForEvent(eventId: number): SatisfactionDTO[] {
    return this.satisfactions.filter(s => s.evenementId === eventId);
  }
  voirSatisfactionsEvent(e: EvenementDTO) {
    this.selectedEventForSat = e;
    this.selectedEventSatisfactions = this.satisfactions.filter(s=>s.evenementId===e.id);
    this.showSatisfactionModal = true;
  }
  voirSatisfaction(s: SatisfactionDTO) {
    const ev = this.allEvents.find(e=>e.id===s.evenementId)||null;
    if (ev) this.voirSatisfactionsEvent(ev);
  }
  getModalSatAvg(): number {
    if (!this.selectedEventSatisfactions.length) return 0;
    return Math.round(this.selectedEventSatisfactions.reduce((a,s)=>a+s.note,0)/this.selectedEventSatisfactions.length);
  }

  // ── DOCUMENTS ─────────────────────────────────────────────
  loadDocuments(){
    this.isLoading=true;
    let url=`${this.api}/incubateur/${this.incId}/documents`;
    if(this.docFilter!=='tous')url+=`?statut=${this.docFilter}`;
    this.http.get<DocumentDTO[]>(url,{headers:this.h}).subscribe({next:d=>{this.documents=[...d];this.filterDocuments();this.isLoading=false;this.cdr.detectChanges();},error:()=>{this.isLoading=false;this.cdr.detectChanges();}});
  }
  filterDocuments(){const q=this.docSearch.toLowerCase().trim();this.filteredDocuments=q?this.documents.filter(d=>d.nom.toLowerCase().includes(q)||(d.startupNom&&d.startupNom.toLowerCase().includes(q))||d.type.toLowerCase().includes(q)):[...this.documents];}
  setDocF(f:string){this.docFilter=f;this.loadDocuments();}
  countDocByStatut(s:string){return this.documents.filter(d=>d.statut===s).length;}
  onFileSelected(event:any){const file:File=event.target.files[0];event.target.value='';if(file)this.uploadFile(file);}
  onDrop(event:DragEvent){event.preventDefault();this.isDragging=false;const file=event.dataTransfer?.files[0];if(file)this.uploadFile(file);}
  uploadFile(file:File){
    if(file.size>10*1024*1024){this.toast('Fichier trop volumineux','error');return;}
    this.isUploading=true;this.uploadProgress=0;this.uploadFileName=file.name;
    const fd=new FormData();const token=localStorage.getItem('token')||'';fd.append('file',file);
    const xhr=new XMLHttpRequest();
    xhr.upload.addEventListener('progress',(e)=>{if(e.lengthComputable){this.uploadProgress=Math.round((e.loaded/e.total)*100);this.cdr.detectChanges();}});
    xhr.addEventListener('load',()=>{this.isUploading=false;if(xhr.status===200){try{const doc:DocumentDTO=JSON.parse(xhr.responseText);this.documents=[...this.documents,doc];this.filterDocuments();this.cdr.detectChanges();this.toast(`"${file.name}" uploadé ✅`,'success');}catch{this.loadDocuments();}}else{this.toast('Erreur upload','error');this.cdr.detectChanges();}});
    xhr.addEventListener('error',()=>{this.isUploading=false;this.toast('Erreur réseau','error');this.cdr.detectChanges();});
    xhr.open('POST',`${this.api}/incubateur/${this.incId}/documents/upload`);
    xhr.setRequestHeader('Authorization',`Bearer ${token}`);xhr.timeout=60000;xhr.send(fd);
  }
  updateDocStat(id:number,statut:string){const idx=this.documents.findIndex(d=>d.id===id);if(idx>-1){this.documents[idx]={...this.documents[idx],statut};this.documents=[...this.documents];this.filterDocuments();this.cdr.detectChanges();}this.http.patch<DocumentDTO>(`${this.api}/incubateur/${this.incId}/documents/${id}/statut`,{statut},{headers:this.h}).subscribe({next:()=>this.toast('Statut mis à jour','success'),error:()=>{this.loadDocuments();}});}
  toggleDocVisibilite(d: DocumentDTO) {
    const visiblePorteur = !d.visiblePorteur;
    const idx = this.documents.findIndex(x=>x.id===d.id);
    if(idx>-1){this.documents[idx]={...this.documents[idx],visiblePorteur};this.documents=[...this.documents];this.filterDocuments();this.cdr.detectChanges();}
    this.http.patch(`${this.api}/incubateur/${this.incId}/documents/${d.id}/visibilite`,{visiblePorteur},{headers:this.h})
      .subscribe({next:()=>this.toast(visiblePorteur?'Visible chez le porteur':'Caché du porteur','info'),error:()=>this.loadDocuments()});
  }
  downloadDoc(d:DocumentDTO){const token=localStorage.getItem('token')||'';fetch(`${this.api}/incubateur/${this.incId}/documents/${d.id}/download`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>{if(!r.ok)throw new Error();return r.blob();}).then(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=d.nom;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);}).catch(()=>this.toast('Erreur téléchargement','error'));}
  confirmDelDoc(d:DocumentDTO){this.docToDelete=d;this.showDocDeleteModal=true;}
  delDocConfirmed(){if(!this.docToDelete)return;const id=this.docToDelete.id;this.documents=this.documents.filter(d=>d.id!==id);this.filteredDocuments=this.filteredDocuments.filter(d=>d.id!==id);this.showDocDeleteModal=false;this.toast('Document supprimé','warning');this.docToDelete=null;this.cdr.detectChanges();this.http.delete(`${this.api}/incubateur/${this.incId}/documents/${id}`,{headers:this.h}).subscribe({error:()=>{this.loadDocuments();}});}
  docIcon(type:string):string{const m:Record<string,string>={PDF:'📄',DOCX:'📝',DOC:'📝',XLSX:'📊',XLS:'📊',JPG:'🖼️',JPEG:'🖼️',PNG:'🖼️',GIF:'🖼️',ZIP:'🗜️',MP4:'🎬',TXT:'📃'};return m[type?.toUpperCase()]||'📎';}
  getDocTypeClass(type:string):string{return(type||'').toLowerCase();}

  // ── ÉVALUATIONS ───────────────────────────────────────────
  loadEvaluations(){this.http.get<EvaluationDTO[]>(`${this.api}/incubateur/${this.incId}/evaluations`,{headers:this.h}).subscribe({next:e=>this.evaluations=e,error:()=>{}});}
  openEvalM(){if(!this.startups.length)this.loadStartups();this.evalForm={startupId:this.startups[0]?.id||0,scoreIA:70,scoreMarket:70,scoreTeam:70,scoreTech:70,scoreFinance:70,commentaire:''};this.showEvalModal=true;}
  saveEval(){if(!this.evalForm.startupId){this.toast('Sélectionnez une startup','error');return;}this.isSavingEval=true;this.http.post<EvaluationDTO>(`${this.api}/incubateur/${this.incId}/evaluations`,this.evalForm,{headers:this.h}).subscribe({next:(e)=>{this.isSavingEval=false;this.showEvalModal=false;this.evaluations=[...this.evaluations,e];this.toast('Évaluation créée ✅','success');},error:()=>{this.isSavingEval=false;this.toast('Erreur','error');}});}
  delEval(id:number){if(!confirm('Supprimer ?'))return;this.evaluations=this.evaluations.filter(e=>e.id!==id);this.http.delete(`${this.api}/incubateur/${this.incId}/evaluations/${id}`,{headers:this.h}).subscribe({error:()=>{this.loadEvaluations();}});}
  avg(e:EvaluationDTO){return Math.round((e.scoreIA+e.scoreMarket+e.scoreTeam+e.scoreTech+e.scoreFinance)/5);}

  // ── MESSAGES ──────────────────────────────────────────────
  loadContacts() {
    const myEmail = localStorage.getItem('email') || '';
    this.http.get<UserContact[]>(`${this.api}/messages/users`,{headers:this.h})
      .subscribe({
        next: users => {
          this.contactsMap = {};
          const filtered = users.filter(u => u.email !== myEmail);
          filtered.forEach(u => this.contactsMap[u.email] = u);
          this.http.get<string[]>(`${this.api}/messages/contacts`,{headers:this.h}).subscribe({
            next: existing => {
              this.contacts = filtered.map(u => ({...u, unread:0, hasConversation:existing.includes(u.email)}));
              this.filterContacts();
              this.cdr.detectChanges();
            },
            error: () => {
              this.contacts = filtered.map(u => ({...u, unread:0}));
              this.filterContacts();
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {}
      });
  }
  loadGroupes() {
    this.http.get<GroupeDTO[]>(`${this.api}/messages/groupes`,{headers:this.h})
      .subscribe({next:g=>{this.groupes=g;this.filterContacts();this.cdr.detectChanges();},error:()=>{}});
  }
  filterContacts() {
    const f = this.contactFilter;
    const q = this.contactSearch.toLowerCase().trim();
    let list = [...this.contacts];
    if (f === 'PORTEUR') list = list.filter(c=>c.role==='PORTEUR');
    else if (f === 'EXPERT') list = list.filter(c=>c.role==='EXPERT');
    else if (f === 'INCUBATEUR') list = list.filter(c=>c.role==='INCUBATEUR');
    else if (f === 'groupe') { list = []; }
    if (q) list = list.filter(c=>c.email.toLowerCase().includes(q)||(c.nom||'').toLowerCase().includes(q));
    this.filteredContacts = list;
    this.filteredGroups = f==='tous'||f==='groupe' ? this.groupes.filter(g=>!q||g.nom.toLowerCase().includes(q)) : [];
  }
  setCF(f:string){this.contactFilter=f;this.filterContacts();}
  selectContact(c: UserContact) {
    this.activeContact = c.email;
    this.activeContactRole = c.role;
    this.activeContactNom = (c.nom+' '+c.prenom).trim() || c.email;
    this.activeContactPhoto = c.profilPhoto || '';
    this.activeGroupId = null;
    this.loadMessages();
  }
  selectGroup(g: GroupeDTO) {
    this.activeGroupId = g.id;
    this.activeGroupNom = g.nom;
    this.activeGroupMembers = g.membres.length + ' membres';
    this.activeContact = '';
    this.loadMessages();
  }
  loadMessages() {
    if (this.activeGroupId) {
      this.http.get<MessageDTO[]>(`${this.api}/messages/groupe/${this.activeGroupId}`,{headers:this.h})
        .subscribe({next:m=>{this.messages=[...m];this.cdr.detectChanges();},error:()=>{}});
    } else if (this.activeContact) {
      this.http.get<MessageDTO[]>(`${this.api}/messages/conversation`,{headers:this.h,params:new HttpParams().set('with',this.activeContact)})
        .subscribe({next:m=>{this.messages=[...m];this.cdr.detectChanges();},error:()=>{}});
    }
  }
  sendMsg() {
    if(!this.newMessage.trim()) return;
    const content = this.newMessage.trim();
    this.newMessage = '';
    if (this.activeGroupId) {
      this.http.post<MessageDTO>(`${this.api}/messages/groupe/${this.activeGroupId}/send`,{content},{headers:this.h})
        .subscribe({next:m=>{this.messages=[...this.messages,m];this.cdr.detectChanges();},error:()=>this.toast('Erreur','error')});
    } else if (this.activeContact) {
      this.http.post<MessageDTO>(`${this.api}/messages/send`,{receiver:this.activeContact,content,type:'PRIVATE'},{headers:this.h})
        .subscribe({next:m=>{this.messages=[...this.messages,m];this.cdr.detectChanges();},error:()=>this.toast('Erreur','error')});
    }
  }
  isMine(m: MessageDTO) { return m.sender === (localStorage.getItem('email')||''); }
  getSenderPhoto(email: string): string { return this.contactsMap[email]?.profilPhoto || ''; }
  deleteConversation() {
    if(!this.activeContact)return;
    if(!confirm('Supprimer la conversation ?'))return;
    this.http.delete(`${this.api}/messages/conversation?with=${this.activeContact}`,{headers:this.h})
      .subscribe({next:()=>{this.messages=[];this.activeContact='';this.loadContacts();this.toast('Conversation supprimée','warning');},error:()=>this.toast('Erreur','error')});
  }
  contactInitials(c: UserContact): string {
    if(c.nom&&c.prenom)return(c.nom[0]+c.prenom[0]).toUpperCase();
    if(c.nom)return c.nom.substring(0,2).toUpperCase();
    return c.email.substring(0,2).toUpperCase();
  }
  roleLabel(role:string):string{const m:Record<string,string>={PORTEUR:'Porteur',INCUBATEUR:'Incubateur',EXPERT:'Expert',ADMIN:'Admin'};return m[role]||role;}
  roleColor(role:string):string{const m:Record<string,string>={PORTEUR:'#a855f7',INCUBATEUR:'#3b82f6',EXPERT:'#10b981',ADMIN:'#f43f5e'};return m[role]||'#6b7280';}

  // ── GROUPES ───────────────────────────────────────────────
  openNewGroupModal() { this.newGroupForm={nom:'',membres:[]};this.showNewGroupModal=true; }
  toggleGroupMember(email: string) {
    const i = this.newGroupForm.membres.indexOf(email);
    if(i>-1) this.newGroupForm.membres.splice(i,1);
    else this.newGroupForm.membres.push(email);
  }
  createGroup() {
    if(!this.newGroupForm.nom.trim()){this.toast('Nom requis','error');return;}
    if(this.newGroupForm.membres.length<1){this.toast('Ajoutez au moins un membre','error');return;}
    this.http.post<GroupeDTO>(`${this.api}/messages/groupes`,{nom:this.newGroupForm.nom,membres:this.newGroupForm.membres},{headers:this.h})
      .subscribe({next:g=>{this.groupes=[...this.groupes,g];this.showNewGroupModal=false;this.toast(`Groupe "${g.nom}" créé ✅`,'success');this.selectGroup(g);},error:()=>this.toast('Erreur création groupe','error')});
  }
  openEditGroupModal() { /* TODO */ }

  // ── PROFIL ────────────────────────────────────────────────
  triggerPhotoUpload() { document.querySelector<HTMLInputElement>('#photoInput')?.click(); }
  onPhotoSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilPhoto = e.target.result;
      localStorage.setItem('profilPhoto', this.profilPhoto);
      this.cdr.detectChanges();
      this.toast('Photo de profil mise à jour ✅','success');
      const fd = new FormData();
      fd.append('photo', file);
      this.http.post(`${this.api}/users/photo`,fd,{headers:new HttpHeaders({Authorization:'Bearer '+(localStorage.getItem('token')||'')})})
        .subscribe({error:()=>{}});
    };
    reader.readAsDataURL(file);
  }
  saveProfil() {
    if(this.profilForm.newPassword && this.profilForm.newPassword !== this.profilForm.confirmPassword) {
      this.toast('Les mots de passe ne correspondent pas','error'); return;
    }
    const payload: any = {};
    if(this.profilForm.nom) { payload.nom=this.profilForm.nom; localStorage.setItem('nom',this.profilForm.nom); }
    if(this.profilForm.newPassword) payload.password=this.profilForm.newPassword;
    this.http.put(`${this.api}/users/profil`,payload,{headers:this.h})
      .subscribe({next:()=>this.toast('Profil mis à jour ✅','success'),error:()=>this.toast('Erreur','error')});
  }

  // ── TOASTS ────────────────────────────────────────────────
  toast(msg:string,type:string='info'){const t={id:++this.tid,msg,type};this.toasts.push(t);setTimeout(()=>this.toasts=this.toasts.filter(x=>x.id!==t.id),3500);}
  rmToast(id:number){this.toasts=this.toasts.filter(t=>t.id!==id);}
}