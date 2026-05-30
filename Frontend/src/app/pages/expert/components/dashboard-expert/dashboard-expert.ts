import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EChartsCoreOption } from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import {
  DashboardExpertService,
  DashboardExpertSnapshot,
  DashboardExpertKpis,
  DashboardProjetAttente,
  DashboardDocumentAttente,
} from '../../service/dashboard-expert-service';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-dashboard-expert',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './dashboard-expert.html',
  styleUrls: ['./dashboard-expert.css'],
  providers: [provideEchartsCore({ echarts })],
})
export class DashboardExpert implements OnInit {
  @Output() navigate = new EventEmitter<string>();

  snapshot!: DashboardExpertSnapshot;
  kpis!: DashboardExpertKpis;
  projetsAttente: DashboardProjetAttente[] = [];
  documentsAttente: DashboardDocumentAttente[] = [];
  loading = true;
  loadError = false;

  workloadPie!: EChartsCoreOption;
  activityTimeline!: EChartsCoreOption;

  constructor(
    private dashboardService: DashboardExpertService,
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

  private applySnapshot(snapshot: DashboardExpertSnapshot): void {
    this.snapshot = snapshot;
    this.kpis = snapshot.kpis;
    this.projetsAttente = snapshot.projetsEnAttente ?? [];
    this.documentsAttente = snapshot.documentsEnAttente ?? [];
    this.loading = false;

    this.workloadPie = this.dashboardService.buildWorkloadPie(this.kpis);
    this.activityTimeline = this.dashboardService.buildActivityTimeline(snapshot.activiteMensuelle);

    this.cdr.detectChanges();
  }

  get totalTaches(): number {
    return (this.kpis?.projetsEnAttente ?? 0) + (this.kpis?.documentsEnAttente ?? 0);
  }

  go(page: string): void {
    this.navigate.emit(page);
  }

  statutColor(statut: string): string {
    return this.dashboardService.statutColor(statut);
  }

  statutLabel(statut: string): string {
    return this.dashboardService.statutLabel(statut);
  }
}
