import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EChartsCoreOption } from 'echarts/core';
import { BarChart, GaugeChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import {
  DashboardEvenement,
  DashboardKpis,
  DashboardService,
  DashboardSnapshot,
} from '../../service/dashboard-service';

echarts.use([
  BarChart,
  GaugeChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-dashboard-porteur',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './dashboard-porteur.html',
  styleUrls: ['./dashboard-porteur.css'],
  providers: [provideEchartsCore({ echarts })],
})
export class DashboardPorteur implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  snapshot!: DashboardSnapshot;
  kpis!: DashboardKpis;
  upcomingEvents: DashboardEvenement[] = [];
  loading = true;
  loadError = false;

  progressGauge!: EChartsCoreOption;
  phaseRadar!: EChartsCoreOption;
  phaseScoresBar!: EChartsCoreOption;
  eventsByType!: EChartsCoreOption;
  activityTimeline!: EChartsCoreOption;
  projetStatutPie!: EChartsCoreOption;
  phaseStatusBar!: EChartsCoreOption;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getSnapshot().subscribe({
      next: snapshot => this.applySnapshot(snapshot),
      error: () => {
        this.loadError = true;
        this.applySnapshot(this.dashboardService.getMockSnapshot());
      },
    });
  }

  private applySnapshot(snapshot: DashboardSnapshot): void {
    this.snapshot = snapshot;
    this.kpis = snapshot.kpis;
    this.loading = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.upcomingEvents = snapshot.evenements
      .filter(ev => ev.date && new Date(ev.date) >= today)
      .slice(0, 4);

    this.progressGauge = this.dashboardService.buildProgressGauge(this.kpis);
    this.phaseRadar = this.dashboardService.buildPhaseRadar(this.snapshot.phases);
    this.phaseScoresBar = this.dashboardService.buildPhaseScoresBar(this.snapshot.phases);
    this.eventsByType = this.dashboardService.buildEventsByType(this.snapshot.evenements);
    this.activityTimeline = this.dashboardService.buildActivityTimeline(snapshot.activiteMensuelle);
    this.projetStatutPie = this.dashboardService.buildProjetStatutPie(this.snapshot.projets);
    this.phaseStatusBar = this.dashboardService.buildPhaseStatusBar(this.snapshot.phases);

    this.cdr.detectChanges();
  }

  get progressPct(): number {
    return Math.round((this.kpis.phasesCompletees / this.kpis.phasesTotal) * 100);
  }

  get currentPhaseName(): string {
    return this.snapshot.phases.find(p => p.statut === 'en_cours')?.titre ?? '—';
  }

  get nextJalon(): string {
    const idx = this.snapshot.phases.findIndex(p => p.statut === 'en_cours');
    return this.snapshot.phases[idx + 1]?.titre ?? 'Programme terminé ✅';
  }

  go(page: string): void {
    this.navigate.emit(page);
  }

  typeColor(type: string): string {
    const m: Record<string, string> = {
      workshop: '#a855f7',
      pitch: '#3b82f6',
      reunion: '#10b981',
      formation: '#f59e0b',
    };
    return m[type] || '#6b7280';
  }

  docIcon(type: string): string {
    const m: Record<string, string> = {
      PDF: '📄', DOCX: '📝', DOC: '📝', PPTX: '📊', XLSX: '📊',
    };
    return m[type?.toUpperCase()] || '📎';
  }

  statutDocColor(s: string): string {
    const m: Record<string, string> = {
      soumis: '#f59e0b', valide: '#10b981', rejete: '#ef4444', en_attente: '#6b7280',
    };
    return m[s] || '#6b7280';
  }
}
