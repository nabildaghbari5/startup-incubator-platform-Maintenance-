import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EChartsCoreOption } from 'echarts/core';
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import {
  DashboardIncubateurService,
  DashboardIncubateurSnapshot,
  DashboardIncubateurKpis,
  DashboardEvenement,
  DashboardProjetRecent,
  DashboardSecteur,
} from '../../service/dashboard-incubateur-service';

echarts.use([
  BarChart,
  GaugeChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-dashboard-incubateur',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './dashboard-incubateur.html',
  styleUrls: ['./dashboard-incubateur.css'],
  providers: [provideEchartsCore({ echarts })],
})
export class DashboardIncubateur implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  snapshot!: DashboardIncubateurSnapshot;
  kpis!: DashboardIncubateurKpis;
  secteurs: DashboardSecteur[] = [];
  projetsRecents: DashboardProjetRecent[] = [];
  upcomingEvents: DashboardEvenement[] = [];
  loading = true;
  loadError = false;

  projetStatusPie!: EChartsCoreOption;
  secteursBar!: EChartsCoreOption;
  acceptationGauge!: EChartsCoreOption;
  activityTimeline!: EChartsCoreOption;
  eventsByType!: EChartsCoreOption;

  constructor(
    private dashboardService: DashboardIncubateurService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.dashboardService.getSnapshot().subscribe({
      next: snapshot => this.applySnapshot(snapshot),
      error: () => {
        this.loadError = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applySnapshot(snapshot: DashboardIncubateurSnapshot): void {
    this.snapshot = snapshot;
    this.kpis = snapshot.kpis;
    this.secteurs = snapshot.secteurs ?? [];
    this.projetsRecents = snapshot.projetsRecents ?? [];
    this.upcomingEvents = snapshot.evenementsProchains ?? [];
    this.loading = false;

    this.projetStatusPie = this.dashboardService.buildProjetStatusPie(this.kpis);
    this.secteursBar = this.dashboardService.buildSecteursBar(this.secteurs);
    this.acceptationGauge = this.dashboardService.buildAcceptationGauge(this.kpis);
    this.activityTimeline = this.dashboardService.buildActivityTimeline(snapshot.activiteMensuelle);
    this.eventsByType = this.dashboardService.buildEventsByType(this.upcomingEvents);

    this.cdr.detectChanges();
  }

  get acceptesPct(): number {
    if (!this.kpis?.totalProjets) return 0;
    return Math.round((this.kpis.projetsAcceptes / this.kpis.totalProjets) * 100);
  }

  go(page: string): void {
    this.navigate.emit(page);
  }

  statutLabel(statut: string): string {
    return this.dashboardService.statutLabel(statut);
  }

  statutColor(statut: string): string {
    return this.dashboardService.statutColor(statut);
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

  actDotColor(type: string): string {
    const m: Record<string, string> = {
      projet: '#a855f7',
      document: '#06b6d4',
      evaluation: '#10b981',
      event: '#f59e0b',
    };
    return m[type] || '#ec4899';
  }

  rdvLabel(): string {
    if (!this.kpis?.prochainRdvTitre) return '';
    const j = this.kpis.prochainRdvJours;
    if (j === 0) return "Aujourd'hui";
    if (j === 1) return 'Demain';
    return `dans ${j}j`;
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.min(5, Math.max(0, n)) });
  }

  emptyStars(n: number): number[] {
    return Array.from({ length: Math.min(5, Math.max(0, 5 - n)) });
  }
}
