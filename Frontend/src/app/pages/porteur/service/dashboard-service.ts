import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EChartsCoreOption } from 'echarts/core';
import { Observable } from 'rxjs';

export interface DashboardPhase {
  id: number;
  numero: number;
  mois: string;
  titre: string;
  icone: string;
  description: string;
  couleur: string;
  statut: 'termine' | 'en_cours' | 'a_venir';
  fichierNom?: string;
  score?: number | null;
  documentStatut?: string;
}

export interface DashboardProjet {
  id: number;
  titre: string;
  description: string;
  secteur: string;
  statut: 'ACCEPTE' | 'REFUSE' | 'EN_COURS_ANALYSE';
  startupValidee: boolean;
  dateSoumission: string;
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

export interface DashboardKpis {
  phasesCompletees: number;
  phasesTotal: number;
  scoreMoyen: number;
  evenementsMois: number;
  projetsActifs: number;
  tauxParticipation: number;
  prochainRdvJours: number;
  prochainRdvTitre: string;
}

export interface DashboardActiviteMensuelle {
  labels: string[];
  evenements: number[];
  documents: number[];
}

export interface DashboardSnapshot {
  kpis: DashboardKpis;
  phases: DashboardPhase[];
  projets: DashboardProjet[];
  evenements: DashboardEvenement[];
  documentsRecents: {
    id: number;
    nom: string;
    type: string;
    taille: string;
    statut: string;
    uploadedAt: string;
  }[];
  activiteMensuelle?: DashboardActiviteMensuelle;
}

const CHART_COLORS = ['#ec4899', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];

const EVENT_TYPE_COLORS: Record<string, string> = {
  workshop: '#a855f7',
  pitch: '#3b82f6',
  reunion: '#10b981',
  formation: '#f59e0b',
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = 'http://localhost:8083/api/dashboard';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    });
  }

  private get userId(): string {
    return localStorage.getItem('userId') || '';
  }

  /** Récupère le snapshot complet depuis le backend Spring Boot */
  getSnapshot(): Observable<DashboardSnapshot> {
    return this.http.get<DashboardSnapshot>(
      `${this.api}/porteur/${this.userId}`,
      { headers: this.headers }
    );
  }

  /** Données simulées — fallback si le backend est indisponible */
  getMockSnapshot(): DashboardSnapshot {
    const phases: DashboardPhase[] = [
      {
        id: 1, numero: 1, mois: 'M1', titre: 'Idéation', icone: '💡',
        description: 'Validation du concept et étude de marché',
        couleur: '#ec4899', statut: 'termine',
        fichierNom: 'business-model-canvas.pdf', score: 82, documentStatut: 'valide',
      },
      {
        id: 2, numero: 2, mois: 'M2', titre: 'Prototypage', icone: '🔧',
        description: 'MVP et tests utilisateurs',
        couleur: '#a855f7', statut: 'termine',
        fichierNom: 'mvp-demo.pdf', score: 75, documentStatut: 'valide',
      },
      {
        id: 3, numero: 3, mois: 'M3', titre: 'Go-to-Market', icone: '🚀',
        description: 'Stratégie commerciale et acquisition',
        couleur: '#06b6d4', statut: 'en_cours',
        fichierNom: 'plan-gtm.pdf', score: null, documentStatut: 'soumis',
      },
      {
        id: 4, numero: 4, mois: 'M4', titre: 'Levée de fonds', icone: '💰',
        description: 'Pitch deck et due diligence',
        couleur: '#10b981', statut: 'a_venir',
      },
      {
        id: 5, numero: 5, mois: 'M5', titre: 'Scale-up', icone: '📈',
        description: 'Croissance et recrutement',
        couleur: '#f59e0b', statut: 'a_venir',
      },
      {
        id: 6, numero: 6, mois: 'M6', titre: 'Graduation', icone: '🎓',
        description: 'Sortie du programme et autonomie',
        couleur: '#3b82f6', statut: 'a_venir',
      },
    ];

    const projets: DashboardProjet[] = [
      {
        id: 1, titre: 'EcoTech Solutions', secteur: 'GreenTech',
        description: 'Plateforme IoT pour la gestion énergétique des bâtiments',
        statut: 'ACCEPTE', startupValidee: true, dateSoumission: '2025-01-15',
      },
      {
        id: 2, titre: 'HealthTrack AI', secteur: 'HealthTech',
        description: 'Suivi prédictif des patients chroniques par IA',
        statut: 'EN_COURS_ANALYSE', startupValidee: false, dateSoumission: '2025-04-02',
      },
    ];

    const evenements: DashboardEvenement[] = [
      {
        id: 1, titre: 'Workshop Business Model', type: 'workshop', typeLabel: 'Workshop',
        date: '2026-06-05', day: '05', month: 'JUN', heureDebut: '09:00', heureFin: '12:00',
        lieu: 'Salle A', satisfactionActive: true,
      },
      {
        id: 2, titre: 'Pitch Day — Session 2', type: 'pitch', typeLabel: 'Pitch',
        date: '2026-06-12', day: '12', month: 'JUN', heureDebut: '14:00', heureFin: '17:00',
        lieu: 'Amphithéâtre', satisfactionActive: true,
      },
      {
        id: 3, titre: 'Mentorat individuel', type: 'reunion', typeLabel: 'Réunion',
        date: '2026-06-18', day: '18', month: 'JUN', heureDebut: '10:00', heureFin: '11:00',
        lieu: 'Visio', satisfactionActive: false,
      },
      {
        id: 4, titre: 'Formation Financement', type: 'formation', typeLabel: 'Formation',
        date: '2026-06-25', day: '25', month: 'JUN', heureDebut: '09:30', heureFin: '12:30',
        lieu: 'Salle B', satisfactionActive: true,
      },
      {
        id: 5, titre: 'Demo Day', type: 'pitch', typeLabel: 'Pitch',
        date: '2026-07-10', day: '10', month: 'JUL', heureDebut: '15:00', heureFin: '18:00',
        lieu: 'Grand Auditorium', satisfactionActive: true,
      },
    ];

    const phasesTerminees = phases.filter(p => p.statut === 'termine').length;
    const scores = phases.filter(p => p.score != null).map(p => p.score!);
    const scoreMoyen = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      kpis: {
        phasesCompletees: phasesTerminees,
        phasesTotal: phases.length,
        scoreMoyen,
        evenementsMois: 4,
        projetsActifs: projets.filter(p => p.statut === 'ACCEPTE').length,
        tauxParticipation: 85,
        prochainRdvJours: 6,
        prochainRdvTitre: evenements[0].titre,
      },
      phases,
      projets,
      evenements,
      documentsRecents: [
        { id: 1, nom: 'business-model-canvas.pdf', type: 'PDF', taille: '1.2 MB', statut: 'valide', uploadedAt: '2026-03-10' },
        { id: 2, nom: 'mvp-demo.pdf', type: 'PDF', taille: '3.4 MB', statut: 'valide', uploadedAt: '2026-04-22' },
        { id: 3, nom: 'plan-gtm.pdf', type: 'PDF', taille: '890 KB', statut: 'soumis', uploadedAt: '2026-05-18' },
        { id: 4, nom: 'pitch-deck-v3.pptx', type: 'PPTX', taille: '5.1 MB', statut: 'en_attente', uploadedAt: '2026-05-25' },
      ],
    };
  }

  buildProgressGauge(kpis: DashboardKpis): EChartsCoreOption {
    const pct = Math.round((kpis.phasesCompletees / kpis.phasesTotal) * 100);
    return {
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '90%',
        center: ['50%', '58%'],
        itemStyle: { color: '#ec4899' },
        progress: {
          show: true,
          width: 14,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#ec4899' },
                { offset: 1, color: '#a855f7' },
              ],
            },
          },
        },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 14, color: [[1, '#e2e8f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 800,
          color: '#0f172a',
          offsetCenter: [0, '10%'],
          formatter: '{value}%',
        },
        data: [{ value: pct }],
      }],
    };
  }

  buildPhaseRadar(phases: DashboardPhase[]): EChartsCoreOption {
    const scored = phases.filter(p => p.score != null);
    const labels = scored.map(p => p.titre);
    const values = scored.map(p => p.score!);

    return {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: labels.map(name => ({ name, max: 100 })),
        radius: '65%',
        center: ['50%', '52%'],
        axisName: { color: '#64748b', fontSize: 11 },
        splitArea: { areaStyle: { color: ['#fff', '#f8fafc'] } },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: 'Scores experts',
          areaStyle: {
            color: {
              type: 'radial', x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: 'rgba(236,72,153,.35)' },
                { offset: 1, color: 'rgba(168,85,247,.08)' },
              ],
            },
          },
          lineStyle: { color: '#ec4899', width: 2 },
          itemStyle: { color: '#a855f7' },
        }],
      }],
    };
  }

  buildPhaseScoresBar(phases: DashboardPhase[]): EChartsCoreOption {
    const data = phases.map(p => ({
      name: `${p.icone} ${p.titre}`,
      value: p.score ?? (p.statut === 'en_cours' ? 0 : null),
      itemStyle: { color: p.couleur },
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number | null }[])[0];
          return p.value == null ? `${p.name}<br/>Non évalué` : `${p.name}<br/>Score : ${p.value}/100`;
        },
      },
      grid: { left: 12, right: 24, top: 12, bottom: 4, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: d.value,
          itemStyle: d.itemStyle,
          label: {
            show: d.value != null && d.value > 0,
            position: 'right',
            formatter: '{c}/100',
            color: '#64748b',
            fontSize: 11,
          },
        })),
        barWidth: 14,
        barCategoryGap: '40%',
        itemStyle: { borderRadius: [0, 6, 6, 0] },
      }],
    };
  }

  buildEventsByType(evenements: DashboardEvenement[]): EChartsCoreOption {
    const counts: Record<string, number> = {};
    for (const ev of evenements) {
      counts[ev.typeLabel] = (counts[ev.typeLabel] || 0) + 1;
    }
    const entries = Object.entries(counts);

    return {
      tooltip: { trigger: 'item', formatter: '{b} : {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 700 },
        },
        data: entries.map(([name, value], i) => ({
          name,
          value,
          itemStyle: {
            color: EVENT_TYPE_COLORS[evenements.find(e => e.typeLabel === name)?.type || ''] || CHART_COLORS[i % CHART_COLORS.length],
          },
        })),
      }],
    };
  }

  buildActivityTimeline(activite?: DashboardActiviteMensuelle): EChartsCoreOption {
    const months = activite?.labels ?? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const eventData = activite?.evenements ?? [1, 2, 1, 3, 2, 4];
    const docData = activite?.documents ?? [0, 1, 1, 0, 2, 1];
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Événements', 'Documents soumis'],
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
          name: 'Documents soumis',
          type: 'bar',
          data: docData,
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

  buildProjetStatutPie(projets: DashboardProjet[]): EChartsCoreOption {
    const labels: Record<string, string> = {
      ACCEPTE: 'Accepté',
      REFUSE: 'Refusé',
      EN_COURS_ANALYSE: 'En analyse',
    };
    const colors: Record<string, string> = {
      ACCEPTE: '#10b981',
      REFUSE: '#ef4444',
      EN_COURS_ANALYSE: '#f59e0b',
    };
    const counts: Record<string, number> = {};
    for (const p of projets) {
      const label = labels[p.statut] || p.statut;
      counts[label] = (counts[label] || 0) + 1;
    }

    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['0%', '68%'],
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { color: '#64748b', fontSize: 11 },
        data: Object.entries(counts).map(([name, value]) => ({
          name,
          value,
          itemStyle: {
            color: colors[Object.keys(labels).find(k => labels[k] === name) || ''] || '#6b7280',
          },
        })),
      }],
    };
  }

  buildPhaseStatusBar(phases: DashboardPhase[]): EChartsCoreOption {
    const statusColors: Record<string, string> = {
      termine: '#10b981',
      en_cours: '#ec4899',
      a_venir: '#cbd5e1',
    };
    const statusLabels: Record<string, string> = {
      termine: 'Terminé',
      en_cours: 'En cours',
      a_venir: 'À venir',
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { dataIndex: number }[];
          const phase = phases[items[0]?.dataIndex];
          if (!phase) return '';
          return `${phase.titre}<br/>${phase.mois} · ${statusLabels[phase.statut]}`;
        },
      },
      grid: { left: 8, right: 8, top: 16, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category',
        data: phases.map(p => p.mois),
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: { show: false, type: 'value', max: 1 },
      series: [{
        type: 'bar',
        data: phases.map(p => ({
          value: p.statut === 'termine' ? 1 : p.statut === 'en_cours' ? 0.65 : 0.25,
          itemStyle: { color: statusColors[p.statut], borderRadius: [6, 6, 0, 0] },
        })),
        barWidth: 28,
      }],
    };
  }
}
