import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, signal, 
  ChangeDetectorRef, WritableSignal, AfterViewInit, inject, ViewChild, Renderer2 } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropService } from '../services/drag-drop.service';
import { ViewStateService } from '../services/view-state.service';
import { Subscription, debounceTime, fromEvent } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarService } from '../services/sidebar.service';
import { NotesStateService } from '../services/notes-state.service';
import { AccordionDirective } from '../directives/accordion.directive';
import { HierarchyService } from '../sara-admin/sara-admin/services/hierarchy.service';
import { ChartType } from '../services/visualization-types';
import * as echarts from 'echarts';
import { MultiVisualizationService } from '../services/multi-visualization.service';
import { 
  SiteLevelLocationCentric,
  LocationLevelLocationCentric,
  SensorBoxLevelLocationCentric,
  SensorAssignmentLevelLocationCentric
} from '../sara-admin/sara-admin/models/hierarchy.model';
import { HttpRequestsService, type AggregationLevel, type SensorDataParams } from '../services/http-requests.service';
import { AppbarComponent } from '../appbar/appbar.component';

interface Chart {
  id: number;
  isExpanded: boolean;
  dropZoneId: string;
  droppedSensors: DraggableSensorAssignment[];
  chartInstance: echarts.ECharts | null;
  sensor?: {
    sensorType: string;
    agentSerial: string;
    facility: string;
    unit: string;
    location?: string;
  };
  selectedChartType?: ChartType;
  selectedMetric?: string;
  granularity?: string;
  compatibleCharts?: ChartType[];
  uiState?: {
    chartsEnabled: boolean;
    metricsEnabled: boolean;
    timeControlsEnabled: boolean;
  };
  sensorDropped?: boolean;
}

interface DraggableSensorAssignment extends SensorAssignmentLevelLocationCentric {
  agentSerial: string;
  facility: string;
  isDropped?: boolean;
  originalContainer?: SensorAssignmentLevelLocationCentric[];
  unit: string;
  location?: string;
}

@Component({
  selector: 'different-sensor-types',
  templateUrl: './different-sensor-types.component.html',
  styleUrls: ['./different-sensor-types.component.css'],
  imports: [FormsModule, CommonModule, DragDropModule, AppbarComponent, AccordionDirective],
  standalone: true,
  providers: [DragDropService, MultiVisualizationService]
})
export class DifferentSensorTypesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('chartVisualization') chartVisualizations!: QueryList<ElementRef>;
  @ViewChildren('chartContainer') chartContainers!: QueryList<ElementRef>;
  @ViewChild('startInput') startInputRef!: ElementRef;
  @ViewChild('endInput') endInputRef!: ElementRef;
  
  ChartType = ChartType;
  charts: Chart[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  errorMessage?: string;
  globalChartType: ChartType = ChartType.Line;
  globalMetric: string = 'average';
  compatibleChartTypes: ChartType[] = [];
  hasDroppedSensors = false;
  selectedMetric: string | null = null;
  selectedChartType: ChartType | null = null;
  
  searchQuery = '';
  currentView: 'same' | 'different' = 'different';
  showNotes = false;
  notesContent = '';
  isLoading = false;
  maxCharts = 10;
  minCharts = 2;
  nextChartId = 1;
 public showToast = false;
public toastMessage = '';
public toastType: 'error' | 'info' = 'error'; 
  private hasData = false;
  private timeRangeSet = false;
  private resizeObservers: ResizeObserver[] = [];
  private openStates = new Map<string, WritableSignal<boolean>>();
  private viewSubscription!: Subscription;
  private notesSubscription!: Subscription;
  private routePath: string = '';
  private windowResizeSubscription!: Subscription;

  sites: SiteLevelLocationCentric[] = [];
  
  sidebarService = inject(SidebarService);
  private dragDropService = inject(DragDropService);
  private viewStateService = inject(ViewStateService);
  private router = inject(Router);
  private notesState = inject(NotesStateService);
  private route = inject(ActivatedRoute);
  private hierarchyService = inject(HierarchyService);
  public visualizationService = inject(MultiVisualizationService);
  private httpRequestsService = inject(HttpRequestsService);
  private cdr = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);

  public uiState = {
    chartsEnabled: false,
    metricsEnabled: false,
    timeControlsEnabled: false,
  }

  constructor() {
    const today = new Date();
    this.startDate = new Date(today);
    this.startDate.setHours(0, 0, 0, 0);
    this.endDate = new Date(today);
    this.endDate.setHours(23, 59, 59, 999);
  }

  ngOnInit(): void {
    // Set up notes state
    this.routePath = this.router.url;
    const state = this.notesState.getNotesState(this.routePath);
    this.showNotes = state.show;
    this.notesContent = state.content;
    
    // Subscribe to view changes
    this.viewSubscription = this.viewStateService.currentView$.subscribe(view => {
      this.currentView = view;
      if (view === 'different') {
        this.handleViewActivation();
      }
    });
    
    // Initial chart setup
    this.addChart();
    this.addChart();
    
    // Load hierarchy data
    this.loadHierarchyData();
    
    // Set up window resize handler
    this.windowResizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.resizeAllCharts();
      });
    
    // Initialize parameters
    this.initializeParameters();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeAllCharts();
      this.setupAccordionListeners();
    }, 300);
  
    // Initialize date inputs with current values
    if (this.startInputRef?.nativeElement && this.endInputRef?.nativeElement) {
      const formatDateForInput = (date: Date) => {
        return date.toISOString().slice(0, 16);
      };
      this.startInputRef.nativeElement.value = formatDateForInput(this.startDate);
      this.endInputRef.nativeElement.value = formatDateForInput(this.endDate);
    }
  }

  ngOnDestroy(): void {
    this.viewSubscription?.unsubscribe();
    this.notesSubscription?.unsubscribe();
    this.windowResizeSubscription?.unsubscribe();
    this.resizeObservers.forEach(observer => observer.disconnect());
    this.dragDropService.clearDropZone();
    this.notesState.setNotesState(this.routePath, this.showNotes, this.notesContent);
    this.charts.forEach(chart => {
      if (chart.chartInstance) {
        chart.chartInstance.dispose();
      }
    });
  }

  private loadHierarchyData(): void {
    this.isLoading = true;
    this.hierarchyService.getLocationCentricHierarchy().subscribe({
      next: (data) => {
        this.sites = this.transformBackendData(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading hierarchy:', error);
        this.errorMessage = 'Failed to load sensor data.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private transformBackendData(data: SiteLevelLocationCentric[]): SiteLevelLocationCentric[] {
    return data.map((site: SiteLevelLocationCentric) => ({
      ...site,
      locations: site.locations.map((location: LocationLevelLocationCentric) => ({
        ...location,
        sensorBoxes: location.sensorBoxes.map((sensorBox: SensorBoxLevelLocationCentric) => ({
          ...sensorBox,
          assignments: sensorBox.assignments.map((assignment: SensorAssignmentLevelLocationCentric) => ({
            ...assignment,
            agentSerial: sensorBox.agentSerial,
            facility: site.siteName,
            location: location.locationName,
            displayColor_sensortype: `${assignment.sensorType}_${sensorBox.agentSerial}`
          }))
        }))
      }))
    }));
  }

  private initializeParameters(): void {
    this.selectedMetric = null;
    this.selectedChartType = null;
    this.timeRangeSet = false;
    this.visualizationService.currentGranularity = 'minute';
    this.uiState = {
      chartsEnabled: false,
      metricsEnabled: false,
      timeControlsEnabled: false,
    };
  }

  private handleViewActivation(): void {
    this.dragDropService.clearDropZone();
    setTimeout(() => {
      this.resizeAllCharts();
    }, 100);
  }

  addChart(): void {
    if (this.charts.length < this.maxCharts) {
      const dropZoneId = `dz-${this.nextChartId}-${Date.now()}`;
      const newChart: Chart = {
        id: this.nextChartId++,
        isExpanded: false,
        dropZoneId: dropZoneId,
        droppedSensors: [],
        chartInstance: null,
        uiState: {
          chartsEnabled: false,
          metricsEnabled: false,
          timeControlsEnabled: false
        }
      };

      this.dragDropService.registerDropZone(dropZoneId);
      this.charts.push(newChart);
      
      setTimeout(() => {
        this.initializeChart(newChart);
        this.cdr.detectChanges();
      }, 100);
    }
  }

  removeChart(chartId: number): void {
    if (this.charts.length > this.minCharts) {
      const chart = this.charts.find(c => c.id === chartId);
      if (chart) {
        if (chart.chartInstance) {
          chart.chartInstance.dispose();
        }
        const index = this.charts.findIndex(c => c.id === chartId);
        if (index !== -1 && this.resizeObservers[index]) {
          this.resizeObservers[index].disconnect();
          this.resizeObservers.splice(index, 1);
        }
        this.dragDropService.clearDropZone(chart.dropZoneId);
        this.dragDropService.unregisterDropZone(chart.dropZoneId);
        this.charts = this.charts.filter(c => c.id !== chartId);
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      }
    }
  }

  private initializeAllCharts(): void {
    this.charts.forEach(chart => {
      if (!chart.chartInstance) {
        this.initializeChart(chart);
      }
    });
  }

  private initializeChart(chart: Chart): void {
    setTimeout(() => {
      const container = this.chartContainers.find(
        (c, i) => this.charts[i].id === chart.id
      )?.nativeElement.querySelector('.chart-visualization');

      if (container && !chart.chartInstance) {
        chart.chartInstance = echarts.init(container);
        this.visualizationService.registerChart(
          chart.id.toString(),
          chart.chartInstance,
          {
            granularity: this.visualizationService.currentGranularity,
            chartType: (this.globalChartType as unknown as 'line' | 'bar' | 'scatter' | 'area' | 'step') || 'line',
            metric: this.globalMetric || 'average'
          }
        );
        this.setupResizeObserver(container, chart);
        this.setInitialOptions(chart);
        chart.chartInstance.resize();
      }
    }, 300);
  }

  private setupResizeObserver(element: HTMLElement, chart: Chart): void {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          requestAnimationFrame(() => {
            if (chart.chartInstance) {
              this.setInitialOptions(chart);
              chart.chartInstance.resize();
            }
          });
        }
      }
    });
    observer.observe(element);
    this.resizeObservers.push(observer);
  }

private setInitialOptions(chart: Chart): void {
  if (!chart.chartInstance) return;
  const isExpanded = chart.isExpanded;
  chart.chartInstance.setOption({
    grid: {
      containLabel: true,
      top: isExpanded ? 30 : 20,
      bottom: isExpanded ? 20 : 7,
      left: isExpanded ? 28 : 20,
      right: isExpanded ? 20 : 7,
    }
    
  });
}


  private resizeAllCharts(): void {
    this.charts.forEach(chart => {
      if (chart.chartInstance) {
        requestAnimationFrame(() => {
          chart.chartInstance?.resize();
        });
      }
    });
  }

  toggleExpand(chart: Chart): void {
    chart.isExpanded = !chart.isExpanded;
    setTimeout(() => {
      if (chart.chartInstance) {
        this.setInitialOptions(chart);
        const container = this.chartContainers.find(
          (c, i) => this.charts[i].id === chart.id
        )?.nativeElement.querySelector('.chart-visualization');
        if (container) {
          chart.chartInstance.resize({
            width: container.clientWidth,
            height: container.clientHeight
          });
        }
        this.updateChartOptions(chart);
      }
    }, 350);
  }

private updateChartOptions(chart: Chart): void {
  if (!chart.chartInstance || chart.droppedSensors.length === 0) return;
  const isExpanded = chart.isExpanded;
  chart.chartInstance.setOption({
    grid: {
      top: isExpanded ? 30 : 20,
      bottom: isExpanded ? 20 : 7,
      left: isExpanded ? 28 : 20,
      right: isExpanded ? 20 : 7,
      containLabel: true
    }
    
  });
}

  // --- CDK Drag and Drop Handlers Only ---
  onSensorDrop(event: CdkDragDrop<DraggableSensorAssignment[]>, chart: Chart): void {
    if (event.previousContainer === event.container) {
      return;
    }
    if (chart.droppedSensors.length > 0) {
      chart.droppedSensors.forEach(sensor => {
        if (sensor.originalContainer) {
          sensor.originalContainer.push(sensor);
        }
      });
      chart.droppedSensors = [];
    }
    const sensorData = event.previousContainer.data[event.previousIndex];
    const sensorCopy = { 
      ...sensorData,
      originalContainer: event.previousContainer.data
    };
    event.previousContainer.data.splice(event.previousIndex, 1);
    chart.droppedSensors.push(sensorCopy);
    this.updateChartState(chart);
    this.hasDroppedSensors = this.charts.some(c => c.droppedSensors.length > 0);
    if (this.hasDroppedSensors) {
      this.uiState.timeControlsEnabled = true;
      this.uiState.chartsEnabled = true;
      this.uiState.metricsEnabled = true;
    }
    if (!chart.chartInstance) {
      this.initializeChart(chart);
    }
    this.cdr.detectChanges();
  }

  removeSensor(sensor: DraggableSensorAssignment, chart: Chart): void {
    const index = chart.droppedSensors.indexOf(sensor);
    if (index > -1) {
      chart.droppedSensors.splice(index, 1);
      if (sensor.originalContainer) {
        sensor.originalContainer.push(sensor);
      }
      if (chart.chartInstance && chart.droppedSensors.length === 0) {
        chart.chartInstance.clear();
      }
      this.updateChartState(chart);
      this.hasDroppedSensors = this.charts.some(c => c.droppedSensors.length > 0);
      this.cdr.detectChanges();
    }
  }

  private updateChartState(chart: Chart): void {
    chart.uiState = {
      chartsEnabled: chart.droppedSensors.length > 0,
      metricsEnabled: chart.droppedSensors.length > 0,
      timeControlsEnabled: chart.droppedSensors.length > 0
    };
  }

  getAllDropZoneIds(): string[] {
    return this.charts.map(chart => chart.dropZoneId);
  }

  selectChartType(type: ChartType): void {
    this.globalChartType = type;
    this.selectedChartType = type;
    this.visualizationService.setChartType(type as unknown as 'line' | 'bar' | 'scatter' | 'area' | 'step');
  }

  updateGlobalMetric(metric: string): void {
    this.globalMetric = metric;
    this.visualizationService.applyMetric(metric);
    this.cdr.detectChanges();
  }

  onStartDateChange(value: string): void {
    if (!value) return;
    const localDate = new Date(value);
    if (isNaN(localDate.getTime())) return;
    this.startDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes()
    ));
  }

  onEndDateChange(value: string): void {
    if (!value) return;
    const localDate = new Date(value);
    if (isNaN(localDate.getTime())) return;
    this.endDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes()
    ));
  }

  canIncreaseGranularity(): boolean {
    return (
      this.uiState.timeControlsEnabled &&
      this.visualizationService.currentGranularity !== "year"
    );
  }

  canDecreaseGranularity(): boolean {
    return (
      this.uiState.timeControlsEnabled &&
      this.visualizationService.currentGranularity !== "minute"
    );
  }

increaseGranularity() {
  if (this.canIncreaseGranularity()) {
    this.visualizationService.updateGranularity("up");
    // Optionally align dates here
    this.cdr.detectChanges();
  }
}
decreaseGranularity() {
  if (this.canDecreaseGranularity()) {
    this.visualizationService.updateGranularity("down");
    // Optionally align dates here
    this.cdr.detectChanges();
  }
}

  get canApply(): boolean {
    const checks = {
      hasValidGranularity: !!this.visualizationService.currentGranularity,
      hasValidDates: !!this.startDate && !!this.endDate && this.startDate < this.endDate,
      hasGlobalChartType: !!this.globalChartType,
      hasGlobalMetric: !!this.globalMetric,
      hasSensors: this.charts.some(chart => chart.droppedSensors.length > 0)
    };
    return Object.values(checks).every(v => v);
  }

  async applyChanges(): Promise<void> {
    if (!this.canApply) {
      return;
    }
    try {
      this.isLoading = true;
      this.errorMessage = undefined;
      const emptySerials: string[] = [];
      await Promise.all(this.charts.map(async (chart) => {
        if (chart.droppedSensors.length === 0) {
          return;
        }
        const sensor = chart.droppedSensors[0];
        if (!chart.chartInstance) {
          await this.initializeChart(chart);
        }
        console.log('Current granularity:', this.visualizationService.currentGranularity);
        console.log('Mapped aggregation_level:', this.mapGranularity(this.visualizationService.currentGranularity));
        const params: SensorDataParams = {
          facility: sensor.facility,
          sensor_type: sensor.sensorType,
          agent_serial: [sensor.agentSerial],
          aggregation_level: this.mapGranularity(
            this.visualizationService.currentGranularity
          ),
          metric: this.globalMetric,
          start: this.startDate.toISOString(),
          end: this.endDate.toISOString()
        };

        try {
          console.log('fetching data for', params);
          const rawData = await this.httpRequestsService.fetchSensorData(params).toPromise();
          console.log('Fetched data for', sensor.agentSerial, rawData);
          if (!rawData) {
            console.error('[Apply] Empty response for', sensor.agentSerial);
            emptySerials.push(sensor.agentSerial);
            return;
          }
          const processedData = this.visualizationService.processAggregatedData(
            rawData,
            this.startDate,
            this.endDate
          );
          console.log('Processed data for', sensor.agentSerial, processedData);
          this.visualizationService.updateChart(
            chart.id.toString(),
            { 
              ...processedData, 
              chartType: this.globalChartType as unknown as 'area' | 'line' | 'step' | 'bar' | 'scatter' 
            }
          );
          if (chart.chartInstance) {
            const container = this.chartContainers.find(
              (c, i) => this.charts[i].id === chart.id
            )?.nativeElement;
            if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
              requestAnimationFrame(() => {
                chart.chartInstance?.resize();
              });
            }
          }
        } catch (error) {
          emptySerials.push(sensor.agentSerial);
          console.error(`[Apply] Failed for sensor ${sensor.agentSerial}:`, error);
          this.errorMessage = `Error fetching data for ${sensor.sensorType} (${sensor.agentSerial})`;
        }
      }));
          // Show toast if any agent serials had no data
    if (emptySerials.length > 0) {
      this.showToast = true;
      this.toastType = 'error';
      this.toastMessage = `No data was fetched from the following agent serials: ${emptySerials.join(', ')}`;
      this.cdr.detectChanges();
      setTimeout(() => this.showToast = false, 8000);
    }
    } catch (error) {
      console.error('[Apply] General failure:', error);
      this.errorMessage = error instanceof Error ? error.message : "Unknown error";
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
onGranularityChange(granularity: string): void {
  this.visualizationService.setGranularity(granularity as any);
  this.cdr.detectChanges();
}
  private mapGranularity(granularity: string): AggregationLevel {
    const mapping: Record<string, AggregationLevel> = {
      minute: "minute",
      hour: "hourly",
      day: "daily",
      month: "monthly",
      year: "yearly",
    }
    return mapping[granularity] || "minute"
  }

  toggleAccordion(type: 'site' | 'location' | 'sensorBox', id: number): void {
    const key = `${type}-${id}`;
    if (!this.openStates.has(key)) {
      this.openStates.set(key, signal(false));
    }
    const stateSignal = this.openStates.get(key)!;
    stateSignal.update(value => !value);
    // No more initializeSensors here!
  }

  isOpen(type: 'site' | 'location' | 'sensorBox', id: number): boolean {
    return this.openStates.get(`${type}-${id}`)?.() || false;
  }

  private setupAccordionListeners(): void {
    // No more initializeSensors here!
  }

  get filteredData(): SiteLevelLocationCentric[] {
    if (!this.searchQuery) return this.sites;
    return this.sites.filter((site: SiteLevelLocationCentric) => 
      site.siteName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  trackByChartId(index: number, chart: Chart): number {
    return chart.id;
  }

  toggleNotes(): void {
    this.showNotes = !this.showNotes;
  }

  onNotesInput(event: Event): void {
    this.notesContent = (event.target as HTMLTextAreaElement).value;
  }

  clearNotes(): void {
    this.notesContent = '';
    this.notesState.setNotesState(this.routePath, this.showNotes, '');
  }

  switchView(viewType: 'same' | 'different'): void {
    if(viewType === 'different') {
      this.router.navigate(['/data-comparison/different-types']);
    } else {
      this.router.navigate(['/data-comparison/same-type']);
    }
    this.viewStateService.switchView(viewType);
  }

  onChartReorder(event: CdkDragDrop<Chart[]>) {
    moveItemInArray(this.charts, event.previousIndex, event.currentIndex);
    setTimeout(() => this.resizeAllCharts(), 100);
    this.cdr.detectChanges();
  }

  onExportDataClick() {
    const format = window.prompt('Export data as CSV or JSON? Type "csv" or "json":', 'csv');
    if (!format) return;
    if (format.toLowerCase() === 'csv') {
      this.exportDataAsCSV();
    } else if (format.toLowerCase() === 'json') {
      this.exportDataAsJSON();
    } else {
      alert('Invalid format selected.');
    }
  }

  exportDataAsCSV() {
    const link = document.createElement('a');
    link.setAttribute('download', 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportDataAsJSON() {
    // Implement your JSON export logic here
  }

  saveExperiment(){}
}