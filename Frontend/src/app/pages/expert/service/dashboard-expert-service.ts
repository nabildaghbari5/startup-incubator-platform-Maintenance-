import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EChartsCoreOption } from 'echarts/core';
import { Observable } from 'rxjs';

export interface DashboardExpertKpis {
  projetsEnAttente: number;
  documentsEnAttente: number;
  documentsEvaluesMois: number;
  scoreMoyenDocuments: number;
  documentsNotesTotal: number;
}

export interface DashboardProjetAttente {
  id: number;
  titre: string;
  secteur: string;
  statut: string;
  porteurNom: string;
  porteurEmail: string;
  dateSoumission: string;
}

export interface DashboardDocumentAttente {
  id: number;
  fileName: string;
  phaseTitre: string;
  porteurNom: string;
  score: number | null;
  statut: string;
  uploadedAt: string;
}

export interface DashboardActiviteMensuelle {
  labels: string[];
  evenements: number[];
  documents: number[];
}

export interface DashboardExpertSnapshot {
  kpis: DashboardExpertKpis;
  projetsEnAttente: DashboardProjetAttente[];
  documentsEnAttente: DashboardDocumentAttente[];
  activiteMensuelle?: DashboardActiviteMensuelle;
}

@Injectable({ providedIn: 'root' })
export class DashboardExpertService {
  private api = 'http://localhost:8083/api/dashboard';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    });
  }

  private get expertId(): string {
    return localStorage.getItem('userId') || '1';
  }

  getSnapshot(): Observable<DashboardExpertSnapshot> {
    return this.http.get<DashboardExpertSnapshot>(
      `${this.api}/expert/${this.expertId}`,
      { headers: this.headers }
    );
  }

  statutColor(statut: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: '#f59e0b',
      EN_COURS_ANALYSE: '#6366f1',
      ACCEPTE: '#10b981',
      REFUSE: '#ef4444',
      EVALUE: '#10b981',
      EN_ATTENTE_DOC: '#f59e0b',
    };
    return m[statut] || '#6b7280';
  }

  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      EN_COURS_ANALYSE: 'En analyse',
      ACCEPTE: 'Accepté',
      REFUSE: 'Refusé',
      EVALUE: 'Évalué',
      EN_ATTENTE_DOC: 'En attente',
    };
    return m[statut] || statut;
  }

  buildWorkloadPie(kpis: DashboardExpertKpis): EChartsCoreOption {
    const data = [
      { name: 'Projets en attente', value: kpis.projetsEnAttente, itemStyle: { color: '#f59e0b' } },
      { name: 'Documents à noter', value: kpis.documentsEnAttente, itemStyle: { color: '#a855f7' } },
      { name: 'Documents notés', value: kpis.documentsNotesTotal, itemStyle: { color: '#10b981' } },
    ].filter(d => d.value > 0);

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#64748b', fontSize: 11 },
        data: data.length ? data : [{ name: 'Aucune charge', value: 1, itemStyle: { color: '#e2e8f0' } }],
      }],
    };
  }

  buildActivityTimeline(activite?: DashboardActiviteMensuelle): EChartsCoreOption {
    const months = activite?.labels ?? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const docData = activite?.documents ?? [0, 0, 0, 0, 0, 0];

    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Documents notés'],
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      grid: { left: 12, right: 16, top: 16, bottom: 36, containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [{
        name: 'Documents notés',
        type: 'bar',
        data: docData,
        barWidth: 28,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ec4899' },
              { offset: 1, color: '#a855f7' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      }],
    };
  }
}
