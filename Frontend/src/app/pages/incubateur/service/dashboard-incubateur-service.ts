import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EChartsCoreOption } from 'echarts/core';
import { Observable } from 'rxjs';

export interface DashboardIncubateurKpis {
  totalProjets: number;
  projetsEnAttente: number;
  projetsAcceptes: number;
  projetsRefuses: number;
  tauxAcceptation: number;
  evenementsMois: number;
  satisfactionsRecues: number;
  noteSatisfactionMoyenne: number;
  documentsEnAttente: number;
  prochainRdvJours: number;
  prochainRdvTitre: string;
}

export interface DashboardSecteur {
  name: string;
  count: number;
  pct: number;
}

export interface DashboardProjetRecent {
  id: number;
  titre: string;
  description: string;
  secteur: string;
  statut: string;
  startupValidee?: boolean;
  dateSoumission?: string;
}

export interface DashboardEvenement {
  id: number;
  titre: string;
  type: string;
  typeLabel: string;
  date: string;
  day: string;
  month: string;
  heureDebut: string;
  heureFin: string;
  lieu?: string;
  satisfactionActive?: boolean;
}

export interface DashboardActiviteMensuelle {
  labels: string[];
  evenements: number[];
  documents: number[];
}

export interface DashboardActiviteRecente {
  type: string;
  texte: string;
  time: string;
}

export interface DashboardSatisfactionRecente {
  id: number;
  porteurEmail: string;
  evenementTitre: string;
  note: number;
  commentaire?: string;
  createdAt: string;
}

export interface DashboardIncubateurSnapshot {
  kpis: DashboardIncubateurKpis;
  secteurs: DashboardSecteur[];
  projetsRecents?: DashboardProjetRecent[];
  evenementsProchains: DashboardEvenement[];
  activitesRecentes: DashboardActiviteRecente[];
  satisfactionsRecentes: DashboardSatisfactionRecente[];
  activiteMensuelle?: DashboardActiviteMensuelle;
}

const CHART_COLORS = ['#ec4899', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: '#f59e0b',
  EN_COURS_ANALYSE: '#f97316',
  ACCEPTE: '#10b981',
  REFUSE: '#ef4444',
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS_ANALYSE: 'En analyse',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

@Injectable({ providedIn: 'root' })
export class DashboardIncubateurService {
  private api = 'http://localhost:8083/api/dashboard';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    });
  }

  private get incId(): string {
    return localStorage.getItem('userId') || '1';
  }

  getSnapshot(): Observable<DashboardIncubateurSnapshot> {
    return this.http.get<DashboardIncubateurSnapshot>(
      `${this.api}/incubateur/${this.incId}`,
      { headers: this.headers }
    );
  }

  statutLabel(statut: string): string {
    return STATUT_LABELS[statut] || statut;
  }

  statutColor(statut: string): string {
    return STATUT_COLORS[statut] || '#6b7280';
  }

  buildProjetStatusPie(kpis: DashboardIncubateurKpis): EChartsCoreOption {
    const data = [
      { name: 'En attente', value: kpis.projetsEnAttente, itemStyle: { color: '#f59e0b' } },
      { name: 'Acceptés', value: kpis.projetsAcceptes, itemStyle: { color: '#10b981' } },
      { name: 'Refusés', value: kpis.projetsRefuses, itemStyle: { color: '#ef4444' } },
    ].filter(d => d.value > 0);

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#64748b', fontSize: 11 },
        data: data.length ? data : [{ name: 'Aucun projet', value: 1, itemStyle: { color: '#e2e8f0' } }],
      }],
    };
  }

  buildSecteursBar(secteurs: DashboardSecteur[]): EChartsCoreOption {
    const names = secteurs.map(s => s.name);
    const counts = secteurs.map(s => s.count);

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 12, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: names.length ? names : ['—'],
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [{
        type: 'bar',
        data: counts.length ? counts.map((v, i) => ({
          value: v,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: CHART_COLORS[i % CHART_COLORS.length] },
                { offset: 1, color: CHART_COLORS[(i + 1) % CHART_COLORS.length] },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })) : [0],
        barWidth: 16,
      }],
    };
  }

  buildAcceptationGauge(kpis: DashboardIncubateurKpis): EChartsCoreOption {
    const score = kpis.tauxAcceptation;
    return {
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '88%',
        center: ['50%', '58%'],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[0.4, '#ef4444'], [0.7, '#f59e0b'], [1, '#10b981']],
          },
        },
        pointer: { show: true, length: '55%', width: 5, itemStyle: { color: '#ec4899' } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10, distance: 18 },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          fontSize: 28,
          fontWeight: 800,
          color: '#1e293b',
          offsetCenter: [0, '20%'],
        },
        data: [{ value: score }],
      }],
    };
  }

  buildActivityTimeline(activite?: DashboardActiviteMensuelle): EChartsCoreOption {
    const months = activite?.labels ?? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const eventData = activite?.evenements ?? [0, 0, 0, 0, 0, 0];
    const projetData = activite?.documents ?? [0, 0, 0, 0, 0, 0];

    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Événements', 'Projets soumis'],
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
      series: [
        {
          name: 'Événements',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: eventData,
          lineStyle: { color: '#a855f7', width: 2 },
          itemStyle: { color: '#a855f7' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(168,85,247,.25)' },
                { offset: 1, color: 'rgba(168,85,247,.02)' },
              ],
            },
          },
        },
        {
          name: 'Projets soumis',
          type: 'bar',
          data: projetData,
          barWidth: 18,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#06b6d4' },
                { offset: 1, color: '#10b981' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }

  buildEventsByType(evenements: DashboardEvenement[]): EChartsCoreOption {
    const typeColors: Record<string, string> = {
      workshop: '#a855f7',
      pitch: '#3b82f6',
      reunion: '#10b981',
      formation: '#f59e0b',
    };
    const counts: Record<string, number> = {};
    for (const ev of evenements) {
      const label = ev.typeLabel || ev.type;
      counts[label] = (counts[label] || 0) + 1;
    }
    const entries = Object.entries(counts);

    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['0%', '68%'],
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#64748b', fontSize: 11 },
        data: entries.length
          ? entries.map(([name, value], i) => ({
              name,
              value,
              itemStyle: { color: Object.values(typeColors)[i % 4] || CHART_COLORS[i % CHART_COLORS.length] },
            }))
          : [{ name: 'Aucun événement', value: 1, itemStyle: { color: '#e2e8f0' } }],
      }],
    };
  }
}
