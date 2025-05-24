import { DragDropService } from "../services/drag-drop.service"
import { Component, type AfterViewInit, inject, ViewChild, type ElementRef, HostListener } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { SidebarService } from "../services/sidebar.service"
import { SidebarComponent } from "../sidebar/sidebar.component"
import { NotesStateService } from "../services/notes-state.service"
import type { Subscription } from "rxjs"
import { Router, RouterLink, RouterLinkActive } from "@angular/router"
import { VisualizationService } from "../services/hvisualization.service"
import { CommonModule } from "@angular/common"
import { ChartType } from "../services/visualization-types"
import { TypeBasedListComponent } from "../type-based-list/type-based-list.component"
import { BleDevicesAtTimeParams, HttpRequestsService, type AggregationLevel,type SensorDataParams,type ThermalmapParams,type ThermalmapResponse, ExportDataParams } from "../services/http-requests.service"
import * as echarts from "echarts";
import "echarts-gl";
import { ChangeDetectorRef } from "@angular/core"
import { SafeHtmlPipe } from "../pipes/safe-html.pipe"
import { SaraSidebarComponent } from "../sara-sidebar/sara-sidebar.component"
import { AppbarComponent } from "../appbar/appbar.component"

interface CustomColumn {
  id: number
  name: string
  type: string
  displayColor: string
  isGroup: boolean
  datasetId: number
  path: string;
}

// Define compatible chart types for each sensor type
interface ChartCompatibility {
  [sensorType: string]: ChartType[]
}

@Component({
  selector: "historical-visualization",
  imports: [FormsModule, AppbarComponent, CommonModule, TypeBasedListComponent, SafeHtmlPipe],
  standalone: true,
  providers: [HttpRequestsService, DragDropService],
  templateUrl: "./historical-visualization.component.html",
  styleUrls: ["./historical-visualization.component.css"],
})
@HostListener("window:resize")
export class HistoricalVisualizationComponent implements AfterViewInit {
  @ViewChild("chartContainer", { static: false }) chartContainer!: ElementRef
  @ViewChild("xAxisDropZone", { static: false }) xAxisDropZone!: ElementRef
  @ViewChild("yAxisDropZone", { static: false }) yAxisDropZone!: ElementRef

  hasData = false
  showNotes = false
  notesContent = ""
  private routePath = ""
  selectedGranularity = "minute"
  fabHovered = false;
  private notesSubscription!: Subscription
  selectedParams = {
    sensors: [] as any[],
    metric: "",
    granularity: "",
    timeRange: { start: null as Date | null, end: null as Date | null },
  }
  public errorMessage: string = ""
  public ChartType = ChartType
  public sensorDropped = false
  public selectedMetric: string | null = null
  public selectedChartType: string | null = null
  public timeRangeSet = false
  public isCustomDataMode = false
  public customXAxisColumn: CustomColumn | null = null
  public customYAxisColumn: CustomColumn | null = null
  public isLoading = false
private chartInstance!: echarts.ECharts; 

  // Chart compatibility mapping
private chartCompatibility: ChartCompatibility = {
  temperature: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  humidity: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  luminance: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  microphone: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  motion: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  radio: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  pressure: [ChartType.Line, ChartType.Area, ChartType.Bar, ChartType.Scatter, ChartType.Step],
  presence: [ChartType.Bar, ChartType.EventFrequency],
  thermalmap: [ChartType.Heatmap],
  thermography: [ChartType.Heatmap],
  ble: [ChartType.BleDevices], 
}

  // Track UI state
  public uiState = {
    chartsEnabled: false,
    metricsEnabled: false,
    timeControlsEnabled: false,
  }

  startDate?: Date
  endDate?: Date
  sidebarService = inject(SidebarService)
  private chartInitialized = false
  showErrorToast: any

  constructor(
    private cdr: ChangeDetectorRef,
    private httpRequestsService: HttpRequestsService,
    public dragDropService: DragDropService,
    private notesState: NotesStateService,
    private router: Router,
    public visualizationService: VisualizationService,
  ) {}

public currentSensor: {
  sensorType: string;
  agentSerial: string;
  facility: string;          // Added facility from site
  unit: string;
  location?: string;
} | null = null;

  // Add to your class:
public exportMessage: string = '';
public exportMessageType: 'success' | 'error' | '' = '';

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
onStartDateChange(value: string) {
  // Parse as local date-time and preserve hours/minutes/seconds
  const localDate = new Date(value);
  this.startDate = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds(),
    localDate.getMilliseconds()
  ));
}

onEndDateChange(value: string) {
  const localDate = new Date(value);
  this.endDate = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds(),
    localDate.getMilliseconds()
  ));
}
  ngOnInit(): void {
    this.initializeParameters()
    this.initializeDragDrop()
    this.routePath = this.router.url
    const state = this.notesState.getNotesState(this.routePath)
    this.showNotes = state.show
    this.notesContent = state.content
    this.dragDropService.configureDragDrop({ allowMultipleTypes: false })
  }

  ngAfterViewInit() {
    this.dragDropService.initializeDragDrop()
    setTimeout(() => this.dragDropService.initializeSensors(), 500);
    this.cdr.detectChanges()
    const metricsContainer = document.querySelector(".metrics-container")
    this.dragDropService.registerDropZone("main-y-axis")
    this.dragDropService.registerDropZone("x-axis-drop")

    if (metricsContainer) {
      const switches = metricsContainer.querySelectorAll<HTMLInputElement>(".form-check-input")

      switches.forEach((switchElement) => {
        switchElement.addEventListener("change", (e) => {
          if (switchElement.checked) {
            switches.forEach((otherSwitch) => {
              if (otherSwitch !== switchElement) otherSwitch.checked = false
            })
          }
        })
      })
    }
  }
canApply(): boolean {
  if (this.isCustomDataMode) {
    return !!this.customYAxisColumn &&!!this.customXAxisColumn && !!this.selectedChartType ;
  }

  const isHeatmap = this.selectedChartType === 'heatmap';
  const isBleDevices = this.selectedChartType === 'bledevices';
  const hasSensor = this.sensorDropped;
  const hasStart = !!this.startDate;

  if (isHeatmap || isBleDevices) {
    // For heatmap/thermalmap and BLE, only require sensor and start date
    return hasSensor && hasStart;
  }

  // For other charts, require sensor, metric, chart type, and full date range
  const hasMetric = !!this.selectedMetric;
  const hasChartType = !!this.selectedChartType;
  const hasFullRange = !!this.startDate && !!this.endDate && this.startDate < this.endDate;
  const hasValidGranularity = !!this.visualizationService.currentGranularity;

  return hasSensor && hasMetric && hasChartType && hasFullRange && hasValidGranularity;
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
            if (parsedMetadata.isCustomColumn) {
              this.handleCustomColumnDrop(parsedMetadata)
            } else {
              this.handleSensorDrop(parsedMetadata)
            }
          } catch (error) {
            console.error("Error parsing drop metadata:", error)
          }
        }
      } else if (message === "drop-removed") {
        // Handle element removal
        this.checkDropZones()
      }
    })
  }

  // Fix the handleSensorDrop method to properly set the sensorDropped flag and enable charts

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
  this.currentSensor = {
    sensorType: metadata.sensorType,
    agentSerial: metadata.agentSerial,
    facility: metadata.site, // Facility comes from site
    unit: metadata.unit,
    location: metadata.location
  };

    // Set the sensorDropped flag to true
    this.sensorDropped = true

    // Enable compatible charts based on sensor type
    this.enableCompatibleCharts(sensorType)

    // Enable metrics section
    this.uiState.metricsEnabled = true

    // Enable time controls
    this.uiState.timeControlsEnabled = true

    // Force change detection to update UI
    this.cdr.detectChanges()

    console.log("Sensor drop processed. UI state:", this.uiState)
    console.log("sensorDropped flag:", this.sensorDropped)
  }

  // Enable compatible chart types based on sensor type
  // Fix the enableCompatibleCharts method to properly enable chart types
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
      const isCompatible = compatibleCharts.includes(chartType);
      
      icon.classList.toggle("chart-compatible", isCompatible);
      icon.classList.toggle("chart-disabled", !isCompatible);
    });
  }, 0);
  }
  
  // Check if a chart type is compatible with current sensor
  // Fix the isChartCompatible method to properly check compatibility
  isChartCompatible(chartType: ChartType): boolean {
    if (!this.uiState.chartsEnabled) {
      return false
    }

    if (this.isCustomDataMode) {
      return true;
    }

    // Make sure we have a valid sensor type
    const sensorType = this.currentSensor?.sensorType || ""
    if (!sensorType) {
      return false
    }

    // Check if the chart type is compatible with the sensor type
    return this.chartCompatibility[sensorType]?.includes(chartType) || false
  }

  private handleCustomColumnDrop(metadata: any) {
  console.log('Drop metadata:', metadata);
const datasetId = metadata.datasetId;


   if (this.isCustomDataMode) {
  this.uiState.chartsEnabled = true;
}
  const path = metadata.path || metadata.columnId;
  const name = metadata.name || metadata.columnName;

 const column: CustomColumn = {
    id: metadata.path,
    name: name,
    type: metadata.isGroup ? 'group' : 'column',
    displayColor: metadata.displayColor,
    isGroup: metadata.isGroup,
    datasetId: Number(datasetId),
    path: path
  };

  var dropZoneId = this.dragDropService["lastDropZoneId"];
  console.log("dropzoneid",dropZoneId)
  if (dropZoneId === "x-axis-drop") {
    this.customXAxisColumn = column;

  }
   if (dropZoneId === "main-y-axis") {
    this.customYAxisColumn = column;

  }

  // 3. Force update UI state
  this.uiState.chartsEnabled = true;

 

}
  // Check drop zones to update model state
  private checkDropZones() {
    const xAxisElement = this.xAxisDropZone?.nativeElement
    const yAxisElement = this.yAxisDropZone?.nativeElement

    // Check if elements exist in zones
    const xAxisHasElement = xAxisElement?.querySelector(".dropped-item, .dropped-sensor")
    const yAxisHasElement = yAxisElement?.querySelector(".dropped-item, .dropped-sensor")

    // Update model state
    if (!xAxisHasElement) {
      this.customXAxisColumn = null
    }

    if (!yAxisHasElement) {
      this.customYAxisColumn = null
      this.sensorDropped = false
      this.currentSensor = null

      // Disable UI elements when Y-axis is empty
      this.uiState.chartsEnabled = false
      this.uiState.metricsEnabled = false
      this.uiState.timeControlsEnabled = false
      this.selectedChartType = null
      this.selectedMetric = null
    }

    // If no custom data elements, switch back to sensor mode
    if (!this.customXAxisColumn && !this.customYAxisColumn && this.isCustomDataMode) {
      this.isCustomDataMode = false
    }

    this.cdr.detectChanges()
  }

  private getColumnType(metadata: any): string {
    // Simple type detection based on value
    if (typeof metadata.value === "number") return "number"
    if (metadata.value instanceof Date) return "datetime"
    if (metadata.value && typeof metadata.value === "string" && !isNaN(Date.parse(metadata.value))) return "date"
    return "string"
  }

  private createDroppedElement(container: HTMLElement, column: CustomColumn) {
    // Clear existing content
    container.innerHTML = ""

    // Create dropped element
    const element = document.createElement("div")
    element.className = "dropped-item"

    // Add color dot
    const colorDot = document.createElement("div")
    colorDot.className = "color-dot"
    colorDot.style.backgroundColor = column.displayColor
    element.appendChild(colorDot)

    // Add text
    const text = document.createElement("span")
    text.textContent = column.name
    element.appendChild(text)

    // Add to container
    container.appendChild(element)

    // Add double-click handler for removal
    element.addEventListener("dblclick", () => {
      // Remove element
      element.remove()

      // Update model
      if (container === this.xAxisDropZone.nativeElement) {
        this.customXAxisColumn = null
      } else {
        this.customYAxisColumn = null
        this.sensorDropped = false

        // Disable UI elements when Y-axis is empty
        this.uiState.chartsEnabled = false
        this.uiState.metricsEnabled = false
        this.uiState.timeControlsEnabled = false
        this.selectedChartType = null
        this.selectedMetric = null
      }

      // Restore drop instructions
      this.restoreDropInstructions(container)

      // Update chart
      this.updateChartData()
    })
  }

  private restoreDropInstructions(container: HTMLElement) {
    // Only restore if container is empty
    if (container.childElementCount === 0) {
      const isXAxis = container === this.xAxisDropZone.nativeElement

      // Create instruction element
      const instruction = document.createElement("div")
      instruction.className = "drop-instruction"

      // Create span with text
      const span = document.createElement("span")
      span.innerHTML = `Drop ${this.isCustomDataMode ? "custom data" : isXAxis ? "X-Axis" : "sensor"}<br>here`

      // Add to DOM
      instruction.appendChild(span)
      container.appendChild(instruction)
    }
  }


  // Handle custom data mode toggle from TypeBasedListComponent
  onCustomDataModeChanged(isCustomMode: boolean) {
    this.isCustomDataMode = isCustomMode

    // Clear existing data when switching modes
    if (isCustomMode) {
      this.currentSensor = null,
      this.uiState.chartsEnabled = true;
    } else {
      this.customXAxisColumn = null
      this.customYAxisColumn = null
      this.sensorDropped = false

      // Disable UI elements when switching modes
      this.uiState.chartsEnabled = false
      this.uiState.metricsEnabled = false
      this.uiState.timeControlsEnabled = false
      this.selectedChartType = null
      this.selectedMetric = null
      this.tryAutoVisualizeCustomData();
    }

    // Update drop zone instructions
    this.updateDropZoneInstructions()

    // Force change detection
    this.cdr.detectChanges()

    // Reinitialize drag handlers after DOM update
    setTimeout(() => {
      this.dragDropService.initializeSensors()
      this.dragDropService.initializeDragDrop()
    }, 0)
  }

  private updateDropZoneInstructions() {
    // Update Y-axis drop zone
    if (this.yAxisDropZone?.nativeElement) {
      const yContainer = this.yAxisDropZone.nativeElement
      if (!yContainer.querySelector(".dropped-item, .dropped-sensor")) {
        yContainer.innerHTML = ""
        const instruction = document.createElement("div")
        instruction.className = "drop-instruction"
        const span = document.createElement("span")
        span.innerHTML = this.isCustomDataMode ? "Drop custom data<br>here" : "Drop sensor<br>here"
        instruction.appendChild(span)
        yContainer.appendChild(instruction)
      }
    }

    // Update X-axis drop zone if in custom data mode
    if (this.isCustomDataMode && this.xAxisDropZone?.nativeElement) {
      const xContainer = this.xAxisDropZone.nativeElement
      if (!xContainer.querySelector(".dropped-item, .dropped-sensor")) {
        xContainer.innerHTML = ""
        const instruction = document.createElement("div")
        instruction.className = "drop-instruction"
        const span = document.createElement("span")
        span.innerHTML = "Drop custom data<br>column here"
        instruction.appendChild(span)
        xContainer.appendChild(instruction)
      }
    }
  }

  // Fix the selectChartType method to properly set the selectedChartType
  selectChartType(type: ChartType) {
    console.log("Selecting chart type:", type)
    console.log("Charts enabled:", this.uiState.chartsEnabled)
    console.log("Is chart compatible:", this.isChartCompatible(type))

    // Only allow selection if charts are enabled and the chart is compatible
    if (!this.uiState.chartsEnabled || !this.isChartCompatible(type)) {
      console.log("Chart selection blocked: charts not enabled or chart not compatible")
      return
    }

    // Set the selectedChartType
    this.selectedChartType = type
this.visualizationService.setChartType(type as unknown as 'line' | 'bar' | 'scatter' | 'area' | 'step');
    // Update visual selection state
  const chartIcons = document.querySelectorAll(".chart-icon");
  chartIcons.forEach(icon => {
    const iconType = icon.getAttribute("data-chart-type") as ChartType;
    icon.classList.toggle("chart-selected", iconType === type);
  });

    // Update chart data
    

    console.log("Chart type selected:", this.selectedChartType)
  }

  async loadData() {
    await this.initializeChart()
    this.hasData = true
    this.updateChartData()
  }




  private async updateChartData() {
    if (!this.canApply()) {
      
      console.log("Cannot apply changes: conditions not met")
      return;}
    this.errorMessage = "";
    if (!this.currentSensor && !this.customYAxisColumn) return;

  // Only require selectedMetric for non-heatmap/BLE charts
    const isHeatmap = this.selectedChartType === 'heatmap' && this.currentSensor?.sensorType === 'thermalmap';
    const isBleDevices = this.selectedChartType === 'bledevices' && this.currentSensor?.sensorType === 'ble';

    if (!isHeatmap && !isBleDevices && (!this.selectedMetric || !this.selectedChartType)) return;

    // Show loading state
    this.isLoading = true

    try {
      // Different data fetching logic based on mode
      if (this.isCustomDataMode && this.customYAxisColumn) {
        // Custom data visualization logic
        //this.updateCustomDataChart()
      } else if (this.currentSensor) {


      if (isBleDevices) {
      // --- BLE DEVICES LOGIC ---
      if (!this.allConditionsMet()) {
        this.isLoading = false;
        return;
      }
      const bleParams: BleDevicesAtTimeParams = {
        facility: this.currentSensor!.facility,
        agent_serial: this.currentSensor!.agentSerial,
        timestamp: this.startDate?.toISOString() ?? '',
      };
      console.log("[BLE] Request params:", bleParams);

      

      const response = await this.httpRequestsService
        .fetchBleDevicesAtTime(bleParams)
        .toPromise();

      console.log("[BLE] Response:", response);

      if (!response || !response.devices || response.devices.length === 0) {
        this.errorMessage = "No BLE devices data received.";
        this.isLoading = false;
        return;
      }

      if (!this.chartInitialized) {
        await this.initializeChart();
      }
      this.visualizationService.renderBleDevicesBarChart(
        response.devices,
        {
          facility: bleParams.facility,
          agent_serial: bleParams.agent_serial,
          timestamp: response.time
        },
        this.chartInstance
      );
      this.isLoading = false;
      return;
    }


           // --- HEATMAP LOGIC ---
    if (
      this.selectedChartType === 'heatmap' &&
      this.currentSensor &&
      this.currentSensor.sensorType === 'thermalmap'
    ) {
      // Prepare params for backend
      const thermalmapParams: ThermalmapParams = {
        facility: this.currentSensor.facility,
        agent_serial: this.currentSensor.agentSerial,
        timestamp: this.startDate?.toISOString() ?? '',
      };
      console.log("Thermalmap params:", thermalmapParams);

      // Fetch heatmap data
      if (!this.allConditionsMet()) {
        this.isLoading = false
        return
      }


      const response = await this.httpRequestsService
        .fetchThermalmap(thermalmapParams)
        .toPromise();
      console.log("Thermalmap response:", response);

      if (!response || !response.reading) {
        this.errorMessage = "No thermalmap data received.";
        this.isLoading = false;
        return;
      }

      // Render heatmap
      if (!this.chartInitialized) {
        await this.initializeChart();
      }
      this.visualizationService.renderThermalmapHeatmap(
        response.reading,
        {
          facility: thermalmapParams.facility,
          agent_serial: thermalmapParams.agent_serial,
          timestamp: response.time
        },
        this.chartInstance
      );
      this.isLoading = false;
      return;
    }
    else{
         const params: SensorDataParams = {
      facility: this.currentSensor!.facility,
      sensor_type: this.currentSensor!.sensorType,
      agent_serial: [this.currentSensor!.agentSerial],
      aggregation_level: this.mapGranularity(
        this.visualizationService.currentGranularity
      ),
  metric: this.selectedMetric!,
  start: this.startDate?.toISOString() ?? '', 
  end: this.endDate?.toISOString() ?? ''
};

    console.log('start', params.start);
    console.log('end', params.end);

    const thermalmapParams: ThermalmapParams = {
      facility: this.currentSensor!.facility,
  agent_serial: this.currentSensor!.agentSerial,
  timestamp: this.startDate?.toISOString() ?? '',
};

console.log('thermalmapParams',thermalmapParams)

// Check if all conditions are met before proceeding
if (!this.allConditionsMet()) {
  this.isLoading = false
  return
}

console.log("Fetching data with params:",params)

const rawData = await this.httpRequestsService
  .fetchSensorData(params)
  .toPromise();

        if (!rawData) {
          console.error("Received empty response from API")
          this.isLoading = false
          return
        }

        console.log("Raw data received:", rawData)
        const processedData = this.visualizationService.processAggregatedData(rawData, this.startDate!,this.endDate!)
        console.log("Processed data:", processedData)
        if (!this.chartInitialized) {
          await this.initializeChart()
        }

        this.visualizationService.updateChart(      {
        ...processedData,
        chartType: ChartType[this.selectedChartType as keyof typeof ChartType] as 
          'line' | 'bar' | 'scatter' | 'area' | 'step'
      },
      this.chartInstance // Add the chart instance parameter
    );
      }
    }
  } catch (error) {
    console.error("Chart update failed:", error);
    this.errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to load data. Please check your parameters";
  } finally {
      this.isLoading = false
    }

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




async applyChanges() {
  // Only require endDate for non-thermalmap charts
  



  if (this.isLoading) return; // Prevent concurrent execution
  this.isLoading = true;
console.log("wating for changes to apply")



  try {
    await this.initializeChart();
    if (this.isCustomDataMode) {
      await this.fetchAndVisualizeCustomData();
    } else {
        const isHeatmap = this.selectedChartType === 'heatmap' && this.currentSensor?.sensorType === 'thermalmap';
       const isBleDevices = this.selectedChartType === 'bledevices' && this.currentSensor?.sensorType === 'ble';
        if (!this.canApply()) return;

        if (!isHeatmap && !isBleDevices && (!this.startDate || !this.endDate)) return;
        if (isHeatmap && !this.startDate) return;
        if (isBleDevices && !this.startDate) return;
        await this.updateChartData();
    }
  } catch (error) {
    console.error('Apply error:', error);
  } finally {
    this.isLoading = false;
  }
}

private async fetchAndVisualizeCustomData() {
  if (!this.customXAxisColumn || !this.customYAxisColumn) return;

  try {
    const response = await this.httpRequestsService.fetchCustomData({
      xPath: this.customXAxisColumn.path,
      yPath: this.customYAxisColumn.path,
      datasetId: this.customXAxisColumn.datasetId
    }).toPromise();
console.log("raw response",response)
const processed = this.visualizationService.processCustomData(response || []);console.log("processed response",processed)
    this.visualizationService.updateCustomChart({
      ...processed,
      chartType: this.selectedChartType as string
    }, this.chartInstance);

  } catch (error) {
    this.errorMessage = error instanceof Error ? error.message : 'Failed to load data';
  }
}




public allConditionsMet(): boolean {
  if (this.isCustomDataMode) {
    return !!this.customYAxisColumn && !!this.selectedChartType;
  }

  const isHeatmap = this.selectedChartType === 'heatmap';
  const isBleDevices = this.selectedChartType === 'bledevices';
  const hasSensor = this.sensorDropped;
  const hasStart = !!this.startDate;

  if (isHeatmap || isBleDevices) {
    return hasSensor && hasStart;
  }

  const hasMetric = !!this.selectedMetric;
  const hasChartType = !!this.selectedChartType;
  const hasFullRange = !!this.startDate && !!this.endDate;
  return hasSensor && hasMetric && hasChartType && hasFullRange;
}


  private async initializeChart(): Promise<boolean> {
    if (!this.chartContainer?.nativeElement) return false

    // Destroy existing instance
  const existingInstance = echarts.getInstanceByDom(this.chartContainer.nativeElement);
  if (existingInstance) {
    existingInstance.dispose();
  }

    // Create new instance
  this.chartInstance = echarts.init(this.chartContainer.nativeElement);
  this.visualizationService.initChart(this.chartContainer.nativeElement);

    // Force Angular change detection
    this.cdr.detectChanges()

    // Add slight delay for DOM update
    await new Promise((resolve) => setTimeout(resolve, 50))

    this.chartInitialized = true
    return true
  }

  onMetricChange(metric: string): void {
    // Only allow selection if metrics are enabled
    if (!this.uiState.metricsEnabled) {
      return
    }

    this.selectedMetric = metric
    this.visualizationService.applyMetric(metric)
  }

  onResize() {
    if (this.visualizationService.chartInstance) {
      this.visualizationService.chartInstance.resize()
    }
  }

  onNotesInput(event: Event): void {
    this.notesContent = (event.target as HTMLTextAreaElement).value
  }

  toggleNotes() {
    this.showNotes = !this.showNotes
  }

  ngOnDestroy(): void {
    if (this.visualizationService.chartInstance) {
      this.visualizationService.clearChart()
    }
    this.notesState.setNotesState(this.routePath, this.showNotes, this.notesContent)
    this.dragDropService.clearDropZone("main-y-axis")
    this.dragDropService.clearDropZone("x-axis-drop")
    this.dragDropService.ngOnDestroy()
  }

  clearNotes(): void {
    this.notesContent = ""
    this.notesState.setNotesState(this.routePath, this.showNotes, "")
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
    if (this.canIncreaseGranularity()) {
      this.visualizationService.updateGranularity("up")

      // Adjust time range to natural boundaries
      const newStart = this.visualizationService.alignDateToGranularity(this.startDate!.getTime())
      const newEnd = this.visualizationService.alignDateToGranularity(
      this.endDate!.getTime()
    );

      this.startDate = new Date(newStart)
         this.endDate = new Date(
      Math.max(newEnd, this.endDate!.getTime()) // Ensure end doesn't go backward
    );

this.cdr.detectChanges(); 
    }
  }

  decreaseGranularity() {
    if (this.canDecreaseGranularity()) {
      // Update service state first
      this.visualizationService.updateGranularity("down")

      // Get mapped HTTP parameter
      const newGranularity = this.mapGranularity(this.visualizationService.currentGranularity)

      // Update component state
      this.selectedGranularity = newGranularity

      // Refresh data
this.cdr.detectChanges(); 
    }
  }

  showChartDebugInfo() {
    if (!this.visualizationService.chartInstance) return

    const option = this.visualizationService.chartInstance.getOption() as any
    console.log("Current X-Axis Configuration:", option["xAxis"])
    console.log("Current Data Points:", option["series"]?.[0]?.data)
  }

  onExportDataClick() {
    console.log("Export data clicked")
    if (!this.sensorDropped || !this.startDate || !this.endDate || !this.currentSensor) {
      this.exportMessage = 'Please select a sensor and a valid date range before exporting.';
      this.exportMessageType = 'error';
      return;
    }

    const format = window.prompt('Export data as CSV or JSON? Type "csv" or "json":', 'csv');
    if (!format || (format.toLowerCase() !== 'csv' && format.toLowerCase() !== 'json')) {
      this.exportMessage = 'Invalid format selected.';
      this.exportMessageType = 'error';
      return;
    }

    const params: ExportDataParams = {
      facility: this.currentSensor.facility,
      sensor_type: this.currentSensor.sensorType,
      agent_serial: [this.currentSensor.agentSerial],
      start: this.startDate.toISOString(),
      end: this.endDate.toISOString(),
      format: format.toLowerCase() as 'csv' | 'json'
    };
    console.log('Export parameters:', params);

    this.isLoading = true;
    this.httpRequestsService.exportData(params).subscribe({
      next: (blob) => {
        this.isLoading = false;
        if (!blob || blob.size === 0) {
          this.exportMessage = 'Export failed or returned no data.';
          this.exportMessageType = 'error';
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exportMessage = 'Export successful!';
        this.exportMessageType = 'success';
      },
      error: (err) => {
        this.isLoading = false;
        this.exportMessage = 'Export failed.';
        this.exportMessageType = 'error';
      }
    });
  }


  private tryAutoVisualizeCustomData() {
  if (this.isCustomDataMode && this.customXAxisColumn && this.customYAxisColumn) {
    // Convert both IDs to numbers for comparison
    const xId = Number(this.customXAxisColumn.datasetId);
    const yId = Number(this.customYAxisColumn.datasetId);
   
    if (xId !== yId) {
      this.errorMessage = "X and Y must be from the same dataset.";
      return;
    }
   
    this.errorMessage = "";
    this.cdr.detectChanges();
    this.applyChanges();
  }
}


  onSensorsRendered() {
  setTimeout(() => {
    this.dragDropService.initializeSensors();
    this.dragDropService.initializeDragDrop();
  }, 0);
}



}
