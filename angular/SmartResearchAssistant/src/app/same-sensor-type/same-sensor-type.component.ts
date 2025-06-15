import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit , signal, ChangeDetectorRef } from '@angular/core';
import { DragDropService } from '../services/drag-drop.service';
import { ViewStateService } from '../services/view-state.service';
import { Subscription } from 'rxjs';
import { Router, RouterLink,ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarService } from '../services/sidebar.service';
import { inject } from '@angular/core';
import { NotesStateService } from '../services/notes-state.service';
import { AccordionDirective } from '../directives/accordion.directive';
import { TypeBasedListComponent } from '../type-based-list/type-based-list.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { ChartType } from "../services/visualization-types"
import { VisualizationService } from '../services/hvisualization.service';
import * as echarts from "echarts";
import "echarts-gl";
import { forkJoin } from 'rxjs';
import { SensorDataResponse } from "../services/http-requests.service";
import { AppbarComponent } from '../appbar/appbar.component';
interface ChartCompatibility {
  [sensorType: string]: ChartType[]
}
import { HttpRequestsService, type AggregationLevel,type SensorDataParams} from "../services/http-requests.service"
@Component({
  selector: 'same-sensor-type',
  templateUrl: './same-sensor-type.component.html',
  styleUrls: ['./same-sensor-type.component.css'],
  imports: [CommonModule, FormsModule, AppbarComponent,TypeBasedListComponent, SafeHtmlPipe],
  standalone:true,
  providers: [HttpRequestsService,DragDropService],
})

export class SameSensorTypeComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("chartContainer", { static: false }) chartContainer!: ElementRef
  // Signal properties for accordion states
temperatureOpen = signal(false);
humidityOpen = signal(false);
luminanceOpen = signal(false);
microphoneOpen = signal(false);
motionOpen = signal(false);
observationOpen = signal(false);
presenceOpen = signal(false);
pressureOpen = signal(false);
thermalampOpen = signal(false);
thermographyOpen = signal(false);
classroomOpen = signal(false);
classroomHumidityOpen = signal(false);
classroomLuminanceOpen = signal(false);
classroomMicrophoneOpen = signal(false);
classroomMotionOpen = signal(false);
classroomPressureOpen = signal(false);
classroomPresenceOpen = signal(false);
classroomObservationOpen = signal(false);
classroomThermalampOpen = signal(false);
classroomThermographyOpen = signal(false);
  @ViewChild('differentTypesBtn') differentTypesBtn!: ElementRef<HTMLButtonElement>;
  private viewSubscription!: Subscription;
  private dragDropSubscription!: Subscription;
  public sensorDropped = false
  private chartInstance!: echarts.ECharts; 
  currentView: 'same' | 'different' = 'same';
  showNotes = false;
  notesContent = '';
  public errorMessage: string = ""
  private notesSubscription!: Subscription;
  private routePath: string = '';
  startDate?: Date
  endDate?: Date
  public isCustomDataMode = false
  selectedGranularity = "minute"
  sidebarService = inject(SidebarService);
  public selectedMetric: string | null = null
  public ChartType = ChartType
  public selectedChartType: string | null = null
  public timeRangeSet = false
  public isLoading = false
  private chartInitialized = false
  // UI state object to control metrics and time controls
  public uiState = {
    chartsEnabled: false,
    metricsEnabled: false,
    timeControlsEnabled: false,
  }
 public showToast = false;
public toastMessage = '';
public toastType: 'error' | 'info' = 'error'; 
 private chartCompatibility: ChartCompatibility = {
  temperature: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  humidity:[ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step], // Changed to lowercase
  luminance: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  microphone: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  motion: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  radio: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  pressure: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  presence: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  thermalmap: [ChartType.Heatmap],
  thermography: [ChartType.Heatmap],
} 
public droppedSensors: {
  sensorType: string;
  agentSerial: string;
  facility: string;
  unit: string;
  location?: string;
}[] = [];
  constructor(
    public dragDropService: DragDropService,
    private viewStateService: ViewStateService,
    private notesState: NotesStateService,
    private router: Router,
    private route: ActivatedRoute,
    private el: ElementRef,
    public cdr: ChangeDetectorRef,
    public visualizationService: VisualizationService,
    private httpRequestsService: HttpRequestsService,
  ) {}
  toggleNotes() {
    this.showNotes = !this.showNotes;
  }
  onNotesInput(event: Event): void {
    this.notesContent = (event.target as HTMLTextAreaElement).value;
  }
  private showNoDataToast(agentSerials: string[]) {
  this.toastMessage = `No data was fetched from the following agent serials: ${agentSerials.join(', ')}`;
  this.toastType = 'error';
  this.showToast = true;
  setTimeout(() => this.showToast = false, 8000);
}
  ngOnInit(): void {
    this.viewSubscription = this.viewStateService.currentView$.subscribe(view => {
      this.currentView = view;
      this.handleViewChange();
    });
    

    //this.dragDropService.clearDropZone();
    this.routePath = this.router.url;
    const state = this.notesState.getNotesState(this.routePath);
    this.showNotes = state.show;
    this.notesContent = state.content;
    this.initializeDragDrop();
    this.dragDropService.sensorRemoved.subscribe((agentSerial: string) => {
    this.droppedSensors = this.droppedSensors.filter(s => s.agentSerial !== agentSerial);
    this.sensorDropped = this.droppedSensors.length > 0;
    this.cdr.detectChanges();
  });
  }

  ngAfterViewInit(): void {
    this.dragDropService.initializeDragDrop()
    setTimeout(() => this.dragDropService.initializeSensors(), 500);
   this.dragDropService.registerDropZone('main-y-axis'); 
    this.dragDropService.configureDragDrop({
      allowMultipleTypes: true // Allow multiple sensors of same type
    });


  const accordionButtons = document.querySelectorAll('.accordion-button');
  accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(() => this.dragDropService.initializeSensors(), 300);
    });
  });
      
    const metricsContainer = document.querySelector('.metrics-container');
    
    if (metricsContainer) {
        const switches = metricsContainer.querySelectorAll<HTMLInputElement>('.form-check-input');
        
        switches.forEach(switchElement => {
            switchElement.addEventListener('change', (e) => {
                if (switchElement.checked) {
                    switches.forEach(otherSwitch => {
                        if (otherSwitch !== switchElement) otherSwitch.checked = false;
                    });
                }
            });
        });
    }
  setTimeout(() => {
    this.dragDropService.initializeSensors();
    this.dragDropService.initializeDragDrop();
  }, 0);
  }
  onSensorsRendered() {
  setTimeout(() => {
    this.dragDropService.initializeSensors();
    this.dragDropService.initializeDragDrop();
  }, 0);
}
  private initializeDragDrop() {
    // Initialize sensor drag handlers
    this.dragDropService.initializeSensors = () => {
      // Select both sensor items and custom data items
      document.querySelectorAll<HTMLElement>(".sensor-item, .custom-data-item").forEach((element) => {
        this.dragDropService["renderer"].listen(element, "mousedown", (e: MouseEvent) =>
          this.dragDropService["handleMouseDown"](e),
        )
      })
    }

    // Initialize drag-drop system
    this.dragDropService.initializeDragDrop()

    // Listen to drop events from the service
    this.dragDropService.showMessage.subscribe((message) => {
      if (message === "drop-success") {
        const metadata = this.dragDropService.getDroppedMetadata()
        if (metadata) {
          try {
            const parsedMetadata = JSON.parse(metadata)

            // Check if this is a custom column or a sensor

              this.handleSensorDrop(parsedMetadata)
            
          } catch (error) {
             console.error("Error parsing drop metadata:", error)
        }
      }
    }
  }) // Fixed closing parenthesis here
}
  private handleSensorDrop(metadata: any) {
    console.log("Received sensor type:", metadata.sensorType)
    console.log("Handling sensor drop with metadata:", metadata)

    // Validate metadata
    if (!metadata) {
      console.error("Invalid sensor metadata: null or undefined")
      return
    }

    // Use more robust checks for required fields
    const sensorType = metadata.sensorType || "Unknown"
    const agentSerial = metadata.agentSerial || "Unknown"
  if (!metadata?.sensorType || !metadata?.agentSerial) {
    console.error('Invalid sensor metadata:', metadata);
    return;
  }
    // Store sensor data
  const newSensor = {
    sensorType: metadata.sensorType,
    agentSerial: metadata.agentSerial,
    facility: metadata.site,
    unit: metadata.unit,
    location: metadata.location
  };
  // Prevent duplicates
  if (!this.droppedSensors.some(s => s.agentSerial === newSensor.agentSerial)) {
    this.droppedSensors.push(newSensor);
  }
    // Set the sensorDropped flag to true
    this.sensorDropped = this.droppedSensors.length > 0;

    // Enable compatible charts based on sensor type
    this.enableCompatibleCharts(newSensor.sensorType);

    // Enable metrics section
    this.uiState.metricsEnabled = true

    // Enable time controls
    this.uiState.timeControlsEnabled = true

    // Force change detection to update UI
    this.cdr.detectChanges()

    console.log("Sensor drop processed. UI state:", this.uiState)
    console.log("sensorDropped flag:", this.sensorDropped)
  }
    private initializeParameters() {
    // Default values but don't set sensorDropped to true initially
    this.selectedMetric = null
    this.selectedChartType = null
    this.sensorDropped = false
    this.timeRangeSet = false

this.visualizationService.currentGranularity = 'minute'

    // Initialize service states
    

    // Initialize UI state - all disabled initially
    this.uiState = {
      chartsEnabled: false,
      metricsEnabled: false,
      timeControlsEnabled: false,
    }
  }
    isChartCompatible(chartType: ChartType): boolean {
    if (!this.uiState.chartsEnabled) {
      return false;
    }
    // For sensors, check compatibility mapping
    const sensorType = this.droppedSensors.length > 0 ? this.droppedSensors[0].sensorType : "";
    if (!sensorType) {
      return false;
    }
    return this.chartCompatibility[sensorType]?.includes(chartType) || false;
  }
    private enableCompatibleCharts(sensorType: string) {
    console.log("Enabling compatible charts for sensor type:", sensorType)

    // Set the UI state flag to enable charts
    this.uiState.chartsEnabled = true

    // Apply visual styling to chart icons based on compatibility
    setTimeout(() => {
      const compatibleCharts = this.chartCompatibility[sensorType] || []

      console.log("Compatible charts:", compatibleCharts)

    const chartIcons = document.querySelectorAll(".chart-icon");
    chartIcons.forEach((icon: Element) => {
      const chartType = icon.getAttribute("data-chart-type") as ChartType;
      const isCompatible = compatibleCharts.includes(chartType as ChartType.Line | ChartType.Scatter | ChartType.Area | ChartType.Bar | ChartType.Step | ChartType.Heatmap);
      
      icon.classList.toggle("chart-compatible", isCompatible);
      icon.classList.toggle("chart-disabled", !isCompatible);
    });
  }, 0);
  }
    updateMetric(metric: string, isChecked: boolean) {
    // Only allow selection if metrics are enabled
    if (!this.uiState.metricsEnabled) {
      return
    }

    this.selectedMetric = isChecked ? metric : null
    if (isChecked) {
      this.visualizationService.applyMetric(metric)
      
    }
  }
onStartDateChange(value: string) {
  // Parse as local date then convert to UTC midnight
  const localDate = new Date(value);
  this.startDate = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  ));
}

onEndDateChange(value: string) {
  // Parse as local date then convert to UTC end of day
  const localDate = new Date(value);
  const utcEnd = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    23, 59, 59, 999
  ));
  this.endDate = new Date(utcEnd.getTime() + 1);
}
  canIncreaseGranularity(): boolean {
    return (
      this.uiState.timeControlsEnabled &&
      this.visualizationService.currentGranularity !== "year" 
      
    )
  }

  canDecreaseGranularity(): boolean {
    return (
      this.uiState.timeControlsEnabled &&
      this.visualizationService.currentGranularity !== "minute" 
      
    )
  }

increaseGranularity() {
  if (!this.startDate || !this.endDate) return; // Prevent error if dates are not set
  if (this.canIncreaseGranularity()) {
    this.visualizationService.updateGranularity("up");
    const newStart = this.visualizationService.alignDateToGranularity(this.startDate.getTime());
    const newEnd = this.visualizationService.alignDateToGranularity(this.endDate.getTime());
    this.startDate = new Date(newStart);
    this.endDate = new Date(Math.max(newEnd, this.endDate.getTime()));
    this.cdr.detectChanges();
  }
}

decreaseGranularity() {
  if (!this.startDate || !this.endDate) return; // Prevent error if dates are not set
  if (this.canDecreaseGranularity()) {
    this.visualizationService.updateGranularity("down");
    const newGranularity = this.mapGranularity(this.visualizationService.currentGranularity);
    this.selectedGranularity = newGranularity;
    this.cdr.detectChanges();
  }
}
async applyChanges() {
  //update from here after checking for the heatmap and ble devices
    if (this.isLoading) return; // Prevent concurrent execution
  this.isLoading = true;
console.log("wating for changes to apply")
  try {
    await this.initializeChart();

      await this.updateChartData();
    
  } catch (error) {
    console.error('Apply error:', error);
  } finally {
    this.isLoading = false;
  }// to here

  if (!this.startDate || !this.endDate) return;
  const commonParams = {
    start: this.startDate.toISOString(), // Convert Date to ISO string
    end: this.endDate.toISOString(),     // Convert Date to ISO string
    granularity: this.visualizationService.currentGranularity
  }; 
  try {
    await this.initializeChart();
    this.updateChartData();
  } catch (error) {
    console.error('Error applying changes:', error);
  }
}
private async initializeChart(): Promise<boolean> {
  if (!this.chartContainer?.nativeElement) return false;
  const dom = this.chartContainer.nativeElement;
  // Guard: Only initialize if visible and has size
  if (dom.offsetWidth === 0 || dom.offsetHeight === 0) {
    console.warn('Chart container has no width or height');
    return false;
  }
  // Destroy existing instance
  const existingInstance = echarts.getInstanceByDom(dom);
  if (existingInstance) {
    existingInstance.dispose();
  }
  // Create new instance
  this.chartInstance = echarts.init(dom);
  this.visualizationService.initChart(dom);
  this.cdr.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 50));
  this.chartInitialized = true;
  return true;
}
private async updateChartData() {
  if (!this.canApply()) return;
  this.isLoading = true;

  try {
    // Build a request for each dropped sensor
    const requests = this.droppedSensors.map(sensor => {
      const params: SensorDataParams = {
        facility: sensor.facility,
        sensor_type: sensor.sensorType,
        agent_serial: [sensor.agentSerial],
        aggregation_level: this.mapGranularity(this.visualizationService.currentGranularity),
        metric: this.selectedMetric!,
        start: this.formatDateNoMillis(this.startDate),
        end: this.formatDateNoMillis(this.endDate),
      };
      return this.httpRequestsService.fetchSensorData(params);
    });

    // Wait for all requests to complete
const results = await forkJoin(requests).toPromise();
const emptySerials: string[] = [];
const validResults: SensorDataResponse[] = [];

(results as (SensorDataResponse | null)[]).forEach((r, idx) => {
  // Get all arrays in aggregated_results
  const allValues = r && r.aggregated_results
    ? Object.values(r.aggregated_results).flat()
    : [];
  if (!r || allValues.length === 0) {
    emptySerials.push(this.droppedSensors[idx].agentSerial);
  } else {
    validResults.push(r);
  }
});

if (emptySerials.length > 0 && validResults.length > 0 || validResults.length === 0) {
  this.showNoDataToast(emptySerials);
}
const metaByAgentSerial: Record<string, { facility: string; location: string; sensorType: string }> = {};
this.droppedSensors.forEach(sensor => {
  metaByAgentSerial[sensor.agentSerial] = {
    facility: sensor.facility,
    location: sensor.location ?? '',
    sensorType: sensor.sensorType
  };
});
    // Process each result and build series for the chart
const series = validResults.map((rawData, idx) => {
  const processed = this.visualizationService.processAggregatedData(rawData, this.startDate!, this.endDate!);
  const sensor = this.droppedSensors[idx];
  // Use agent serial for chart legend
  return {
    name: sensor.agentSerial,
    data: processed.values
  };
}).filter(s => s.data.length > 0);

    if (!this.chartInitialized) {
      await this.initializeChart();
    }

    // Update chart with all series
this.visualizationService.updateMultiSeriesChart({
  series,
  chartType: this.selectedChartType as 'line' | 'bar' | 'scatter' | 'area' | 'step'
}, this.chartInstance, metaByAgentSerial);

  } catch (error) {
    console.error("Chart update failed:", error);
    this.errorMessage = error instanceof Error
      ? error.message
      : "Failed to load data. Please check your parameters";
  } finally {
    this.isLoading = false;
  }
}

  canApply(): boolean {
  // Sensor mode
  return !!this.visualizationService.currentGranularity && this.sensorDropped && !!this.selectedMetric && !!this.selectedChartType && !!this.startDate && !!this.endDate;
}
readonly sensorPalette = [
  '#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE',
  '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'
];
getSeriesColor(index: number): string {
  return this.sensorPalette[index % this.sensorPalette.length];
}
private formatDateNoMillis(date?: Date): string {
  if (!date) return '';
  // toISOString() returns 'YYYY-MM-DDTHH:mm:ss.sssZ'
  // We want 'YYYY-MM-DDTHH:mm:ssZ'
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
  selectChartType(type: ChartType) {
    console.log("Selecting chart type:", type)
    console.log("Charts enabled:", this.uiState.chartsEnabled)
    console.log("Is chart compatible:", this.isChartCompatible(type))


    // Set the selectedChartType
  this.selectedChartType = type
  this.visualizationService.setChartType(type as 'line' | 'bar' | 'scatter' | 'area' | 'step');
  // Update visual selection state
  const chartIcons = document.querySelectorAll(".chart-icon");
  chartIcons.forEach(icon => {
    const iconType = icon.getAttribute("data-chart-type") as ChartType;
    icon.classList.toggle("chart-selected", iconType === type);
  });

    // Update chart data
    

    console.log("Chart type selected:", this.selectedChartType)
   
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
    public allConditionsMet(): boolean {


    // In sensor mode, we need sensor, metric, chart type and time range
    const conditions = {
      sensorDropped: this.sensorDropped,
      selectedMetric: !!this.selectedMetric,
      selectedChartType: !!this.selectedChartType,
      timeRange: !!this.startDate && !!this.endDate,
      
    }

    return conditions.sensorDropped && conditions.selectedMetric && conditions.selectedChartType && conditions.timeRange
  }
  private animateHeight(start: number, end: number) {
    const element = this.el.nativeElement;
    element.style.height = `${start}px`;
    element.offsetHeight; // Trigger reflow
    
    requestAnimationFrame(() => {
        element.style.height = `${end}px`;
        element.addEventListener('transitionend', () => {
            element.style.height = '';
        }, { once: true });
    });
}
// Accordion toggle handler
toggleAccordion(section: string) {
  const stateMap = {
    'temperature': this.temperatureOpen,
    'humidity': this.humidityOpen,
    'luminance': this.luminanceOpen,
    'microphone': this.microphoneOpen,
    'motion': this.motionOpen,
    'observation': this.observationOpen,
    'presence': this.presenceOpen,
    'pressure': this.pressureOpen,
    'thermalamp': this.thermalampOpen,
    'thermography': this.thermographyOpen,
    'classroom': this.classroomOpen,
    'classroomHumidity': this.classroomHumidityOpen,
    'classroomLuminance': this.classroomLuminanceOpen,
    'classroomMicrophone': this.classroomMicrophoneOpen,
    'classroomMotion': this.classroomMotionOpen,
    'classroomPressure': this.classroomPressureOpen,
    'classroomPresence': this.classroomPresenceOpen,
    'classroomObservation': this.classroomObservationOpen,
    'classroomThermalamp': this.classroomThermalampOpen,
    'classroomThermography': this.classroomThermographyOpen
  } as const;

  type ValidSection = keyof typeof stateMap;

  if (section in stateMap) {
    const validSection = section as ValidSection;
    stateMap[validSection].update(v => !v);
    
    if (validSection.startsWith('classroom')) {
      const sensorType = validSection.replace('classroom', '').toLowerCase();
      if (sensorType && sensorType in stateMap) {
        const parentSection = sensorType as ValidSection;
        stateMap[parentSection].set(true);
      }
    }
  }
}
private configureDragDrop(): void {
  this.dragDropService.configureDragDrop({
    allowMultipleTypes: true // Match historical visualization
  });
}

 
  private handleViewChange(): void {
    this.configureDragDrop();
    this.dragDropService.clearDropZone();

  }



  switchView(viewType: 'same' | 'different'): void {
    if(viewType === 'different') {
      this.router.navigate(['/data-comparison/different-types']);
    }
    this.viewStateService.switchView(viewType);
  }

  ngOnDestroy(): void {
 
    this.notesState.setNotesState(this.routePath, this.showNotes, this.notesContent);
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.dragDropSubscription) {
      this.dragDropSubscription.unsubscribe();
    }
    if (this.notesSubscription) {
      this.notesSubscription.unsubscribe();
    }
  }
  clearNotes(): void {
    this.notesContent = '';
    this.notesState.setNotesState(this.routePath, this.showNotes, '');
  }

  
  
}