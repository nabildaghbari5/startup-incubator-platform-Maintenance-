import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Modèles ────────────────────────────────────────────────────────────────

export type DocCategory = 'Tous' | 'Contrats' | 'Rapports' | 'Présentations' | 'Financier';
export type DocStatus    = 'Validé' | 'En attente' | 'Rejeté';
export type ViewMode     = 'grid' | 'list';

export interface Document {
  id: number;
  nom: string;
  startup: string;
  categorie: Exclude<DocCategory, 'Tous'>;
  statut: DocStatus;
  taille: string;       // ex : "2.4 Mo"
  date: string;         // ISO string
  extension: string;    // pdf | docx | xlsx | pptx
  uploadePar: string;
}

// ─── Données mock (remplacer par appels HTTP quand l'API est prête) ──────────

const MOCK_DOCUMENTS: Document[] = [
  { id:1,  nom:'Contrat incubation AgriTech Pro',   startup:'AgriTech Pro',  categorie:'Contrats',       statut:'Validé',     taille:'1.2 Mo', date:'2025-04-10', extension:'pdf',  uploadePar:'Ahmed Ben Ali'   },
  { id:2,  nom:'Rapport Q1 2025 EduSmart',           startup:'EduSmart TN',   categorie:'Rapports',       statut:'Validé',     taille:'3.8 Mo', date:'2025-04-05', extension:'pdf',  uploadePar:'Sonia Khlifi'    },
  { id:3,  nom:'Pitch Deck HealthLink',              startup:'HealthLink',    categorie:'Présentations',  statut:'En attente', taille:'8.5 Mo', date:'2025-04-18', extension:'pptx', uploadePar:'Yassine Trabelsi'},
  { id:4,  nom:'Plan financier FinFlow 2025',        startup:'FinFlow',       categorie:'Financier',      statut:'Validé',     taille:'2.1 Mo', date:'2025-03-28', extension:'xlsx', uploadePar:'Imen Hawamdeh'   },
  { id:5,  nom:'Convention partenariat LogiTrack',   startup:'LogiTrack',     categorie:'Contrats',       statut:'Rejeté',     taille:'0.9 Mo', date:'2025-04-20', extension:'docx', uploadePar:'Karim Mansouri'  },
  { id:6,  nom:'Rapport mensuel AgriTech Avril',     startup:'AgriTech Pro',  categorie:'Rapports',       statut:'En attente', taille:'5.2 Mo', date:'2025-04-22', extension:'pdf',  uploadePar:'Ahmed Ben Ali'   },
  { id:7,  nom:'Présentation investisseurs EduSmart',startup:'EduSmart TN',   categorie:'Présentations',  statut:'Validé',     taille:'12 Mo',  date:'2025-04-01', extension:'pptx', uploadePar:'Sonia Khlifi'    },
  { id:8,  nom:'Budget prévisionnel HealthLink',     startup:'HealthLink',    categorie:'Financier',      statut:'En attente', taille:'1.7 Mo', date:'2025-04-15', extension:'xlsx', uploadePar:'Yassine Trabelsi'},
  { id:9,  nom:'Avenant contrat FinFlow',            startup:'FinFlow',       categorie:'Contrats',       statut:'Validé',     taille:'0.6 Mo', date:'2025-04-08', extension:'pdf',  uploadePar:'Imen Hawamdeh'   },
  { id:10, nom:'Rapport audit LogiTrack',            startup:'LogiTrack',     categorie:'Rapports',       statut:'Validé',     taille:'4.4 Mo', date:'2025-03-15', extension:'pdf',  uploadePar:'Karim Mansouri'  },
];

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css']
})
export class DocumentsComponent implements OnInit {

  // ── État ──────────────────────────────────────────────────────────────
  allDocuments: Document[] = MOCK_DOCUMENTS;
  filteredDocuments: Document[] = [];

  categories: DocCategory[] = ['Tous','Contrats','Rapports','Présentations','Financier'];
  activeCategory: DocCategory = 'Tous';

  searchQuery   = '';
  viewMode: ViewMode = 'list';
  sortField     = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  showUploadModal = false;
  uploadFile: File | null = null;
  uploadNom      = '';
  uploadStartup  = '';
  uploadCategorie: Exclude<DocCategory,'Tous'> = 'Rapports';
  uploadLoading  = false;

  // ── Statistiques ──────────────────────────────────────────────────────
  get totalDocs()    { return this.allDocuments.length; }
  get valides()      { return this.allDocuments.filter(d => d.statut === 'Validé').length; }
  get enAttente()    { return this.allDocuments.filter(d => d.statut === 'En attente').length; }
  get rejetes()      { return this.allDocuments.filter(d => d.statut === 'Rejeté').length; }

  ngOnInit(): void {
    this.applyFilters();
  }

  // ── Filtres & recherche ───────────────────────────────────────────────
  setCategory(cat: DocCategory): void {
    this.activeCategory = cat;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allDocuments];

    if (this.activeCategory !== 'Tous') {
      result = result.filter(d => d.categorie === this.activeCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(d =>
        d.nom.toLowerCase().includes(q)     ||
        d.startup.toLowerCase().includes(q) ||
        d.uploadePar.toLowerCase().includes(q)
      );
    }

    // Tri
    result.sort((a, b) => {
      let va: any = (a as any)[this.sortField];
      let vb: any = (b as any)[this.sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.filteredDocuments = result;
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // ── Vue ───────────────────────────────────────────────────────────────
  setView(mode: ViewMode): void { this.viewMode = mode; }

  // ── Upload modal ──────────────────────────────────────────────────────
  openUpload():  void { this.showUploadModal = true; }
  closeUpload(): void {
    this.showUploadModal = false;
    this.uploadFile = null;
    this.uploadNom = '';
    this.uploadStartup = '';
    this.uploadLoading = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) { this.uploadFile = file; this.uploadNom = file.name.replace(/\.[^.]+$/, ''); }
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.uploadFile = file; this.uploadNom = file.name.replace(/\.[^.]+$/, ''); }
  }

  submitUpload(): void {
    if (!this.uploadFile || !this.uploadNom || !this.uploadStartup) return;
    this.uploadLoading = true;

    // Simuler un appel API (remplacer par HttpClient.post)
    setTimeout(() => {
      const ext = this.uploadFile!.name.split('.').pop() ?? 'pdf';
      const newDoc: Document = {
        id: Date.now(),
        nom: this.uploadNom,
        startup: this.uploadStartup,
        categorie: this.uploadCategorie,
        statut: 'En attente',
        taille: (this.uploadFile!.size / 1048576).toFixed(1) + ' Mo',
        date: new Date().toISOString().split('T')[0],
        extension: ext,
        uploadePar: 'Imen Haw'
      };
      this.allDocuments.unshift(newDoc);
      this.applyFilters();
      this.closeUpload();
    }, 1200);
  }

  // ── Actions sur un document ───────────────────────────────────────────
  validerDoc(doc: Document): void  { doc.statut = 'Validé'; }
  rejeterDoc(doc: Document): void  { doc.statut = 'Rejeté'; }
  supprimerDoc(doc: Document): void {
    this.allDocuments = this.allDocuments.filter(d => d.id !== doc.id);
    this.applyFilters();
  }

  // ── Helpers template ─────────────────────────────────────────────────
  getExtIcon(ext: string): string {
    const map: Record<string, string> = {
      pdf: '📄', docx: '📝', xlsx: '📊', pptx: '📋'
    };
    return map[ext] ?? '📎';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  }

  trackById(_: number, doc: Document): number { return doc.id; }
}