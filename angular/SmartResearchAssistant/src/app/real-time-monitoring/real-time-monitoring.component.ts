import { Component, OnInit, OnDestroy, EventEmitter, Output, Input, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import * as echarts from 'echarts/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SensorVisualComponent } from '../sensor-visual/sensor-visual.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HierarchyService } from '../services/hierarchy.service'; // Import the service

import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { LineChart, BarChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { 
  Site, 
  SiteLocation, 
  FlatLocation, 
  SensorDataPoint, 
  SensorType, 
  TimeOption, 
  ChartType, 
  Alert 
} from '../models/hierarchy.model';
import { AppbarComponent } from '../appbar/appbar.component';
// Register ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
  UniversalTransition
]);


/**
 * Main component for the Real-Time Monitoring Interface
 * Manages global state, data updates, and UI layout
 */
@Component({
  selector: 'app-real-time-monitoring',
  templateUrl: './real-time-monitoring.component.html',
  imports: [SensorVisualComponent, FormsModule, CommonModule, AppbarComponent], // Add SensorVisualComponent here
  standalone: true,
  styleUrls: ['./real-time-monitoring.component.css']
})
export class RealTimeMonitoringComponent implements OnInit, OnDestroy {
  

  @Input() expandedChange!: EventEmitter<boolean>;
  @HostListener('window:resize')
  onWindowResize() {
    // Trigger change detection
    this.changeDetector.detectChanges();
  }
  private expandedByTab: Record<string,string[]> = {
    environmental: [],
    occupancy: [],
    thermal: []
  };

  get expandedCards(): string[] {
    return this.expandedByTab[this.activeTab];
  }
  onCardExpand(event: { sensor: string, isExpanded: boolean }) {
    const arr = this.expandedByTab[this.activeTab];
    if (event.isExpanded) {
      if (!arr.includes(event.sensor)) {
        arr.push(event.sensor);
      }
    } else {
      this.expandedByTab[this.activeTab] = arr.filter(s => s !== event.sensor);
    }
  }
  // Active tab
  activeTab: keyof typeof this.expandedByTab = 'occupancy'; // Default to 'occupancy' tab
  isExpanded: boolean = true; // Default value for expanded state
  
  // Global location selection
  globalLocation: string = '';
  
  // Alerts data
  alerts: Alert[] = [
    { id: 1, sensor: "Temperature", location: "Classroom 1", message: "Abnormal spike detected", time: "2 mins ago", read: false },
    { id: 2, sensor: "Humidity", location: "Lab 1", message: "Below threshold", time: "15 mins ago", read: true },
    { id: 3, sensor: "Occupancy", location: "Classroom 3", message: "Above threshold (25 people)", time: "5 mins ago", read: false }
  ];
  
  // Sensor data
  sensorData: { [key: string]: SensorDataPoint[] } = {};
  
  // Paused sensors tracking
  pausedSensors: { [key: string]: boolean } = {};
  
  // Update interval subscription
  private updateSubscription: Subscription | null = null;
  
  // Last update time
  lastUpdateTime: string = new Date().toLocaleTimeString();
  sites: Site[] = []; // Initialize as an empty array
  private siteSubscription: Subscription | null = null;

  // Locations data structure
  locations: SiteLocation[] = [];
   
  
  // Flattened locations for easier selection
  flatLocations: FlatLocation[] = [];
  
  // Sensor types with display names and units
  sensorTypes: { [key: string]: SensorType } = {
    temperature: { name: "Temperature", unit: "°C" },
    humidity: { name: "Humidity", unit: "%" },
    luminance: { name: "Luminance", unit: "lux" },
    motion: { name: "Motion", unit: "%" },
    presence: { name: "Presence", unit: "People" },
    thermalamap: { name: "Thermalmap", unit: "°C" },
    thermography: { name: "Thermography", unit: "°C" },
    microphone: { name: "Microphone", unit: "dB" },
    radio: { name: "Radio", unit: "device" },
    ble:{ name: "BLE", unit: "dB" },
  };

  // Sensor colors
  sensorColors: { [key: string]: string } = {
    temperature: "#FF4D4D",  // Vibrant red
    humidity: "#66dedc",     // Bright cyan
    luminance: "#fab752",    // Gold yellow
    microphone: "#AA6FFF",   // Vibrant purple
    motion: "#eb7568",       // Coral pink
    presence: "#68aefd",     // Electric blue
    thermalamp: "#7eeec9",   // Orange
    thermography: "#FF966B", // Mint green
    occupancy: "#f84da1",    // Bright pink
    noise: "#ce46a9",
    radio: '#4F46E5',
    ble: '#4F46E5',
    // Golden yellow
  };

  // Time interval options
  timeIntervals: TimeOption[] = [
    { value: "1m", label: "1 min" },
    { value: "3m", label: "3 min" },

    { value: "5m", label: "5 min" },
    { value: "7m", label: "7 min" },

    { value: "10m", label: "10 min" },
    { value: "15m", label: "5 min" },

    { value: "30m", label: "30 min" },
    { value: "1h", label: "1 hour" },
    { value: "custom", label: "Custom" }
  ];
  
  // Time window options
timeWindows: TimeOption[] = [
  { value: "2m",  label: "2 minutes"  },
  { value: "5m",  label: "5 minutes"  },
  { value: "10m", label: "10 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" }
];
  
  // Chart type options
// In parent component
chartTypes: ChartType[] = [
  { value: 'area', icon: 'area-chart', label: 'Area', viewType: 'default' },
  { value: 'bar', icon: 'bar-chart', label: 'Bar', viewType: 'default' },
  { value: 'signal', icon: 'signal', label: 'Signal Strength', viewType: 'radio' },
  { value: 'line', icon: 'line-chart', label: 'Line', viewType: 'default' },
];
  aggregationOptions: string[] = ['max', 'min', 'count', 'average', 'sum'];

  
  //@Output() globalLocationChanged = new EventEmitter<void>();

  expandedCard: string | null = null; // Track which card is expanded

  constructor(
    private changeDetector: ChangeDetectorRef,
    private hierarchyService: HierarchyService // Inject the service
  ) {}
  
  /**
   * Initialize component, generate mock data, and start update interval
   */
  ngOnInit(): void {
    this.hierarchyService.getSiteHierarchy().subscribe({
      next: (data) => {
        this.sites = data;
        this.flattenLocations();

        
        // Initialize these AFTER data loads
        this.startUpdateInterval();
        
        // Set default location
        if (this.flatLocations.length > 0) {
          this.globalLocation = this.flatLocations[0].id;
        }
      },
      error: (err) => console.error(err)
    });
  }
  
  private startUpdateInterval(): void {
    this.updateSubscription = interval(5000).subscribe(() => {
      this.updateSensorData();
    });
  }
  
  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from the site subscription to avoid memory leaks
    if (this.siteSubscription) {
      this.siteSubscription.unsubscribe();
    }
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }
  
  /**
   * Flatten the hierarchical location structure for easier selection
   */
  flattenLocations(): void {
    this.flatLocations = []; // Reset the array

    this.sites.forEach((site, siteIndex) => {
      console.log(`Processing site ${siteIndex}:`, site);

      if (!site.locations || site.locations.length === 0) {
        console.warn(`Site ${site.siteName} has no locations.`);
        return; // Skip sites with no locations
      }

      site.locations.forEach((location, locationIndex) => {
        console.log(`Processing location ${locationIndex} in site ${site.siteName}:`, location);

        if (!location.sensorBoxes || location.sensorBoxes.length === 0) {
          console.warn(`Location ${location.locationName} in site ${site.siteName} has no sensor boxes.`);
          return; // Skip locations with no sensor boxes
        }

        location.sensorBoxes.forEach((sensorBox, sensorBoxIndex) => {
          console.log(`Processing sensor box ${sensorBoxIndex} in location ${location.locationName}:`, sensorBox);

          // Add the flattened location to the array
          this.flatLocations.push({
            id: `${site.siteName}:${sensorBox.agentSerial}`, // MUST use colon format
            name: sensorBox.agentSerial,
            path: [site.siteName, location.locationName],
            fullPath: `${site.siteName} > ${location.locationName} > ${sensorBox.agentSerial}`
          });;
        });
      });
    });

    console.log('Flattened locations:', this.flatLocations);
  }
  
  /**
   * Generate initial mock data for all sensors
   */
  
  updateSensorData(): void {
    
    this.lastUpdateTime = new Date().toLocaleTimeString();
  }
  
  
  /**
   * Handle sensor pause/resume
   * @param event Event containing sensor and pause state
   */
  onSensorPause(event: { sensor: string, isPaused: boolean }): void {
    this.pausedSensors[event.sensor] = event.isPaused;
  }
  
  /**
   * Mark all alerts as read
   */
  markAllAlertsAsRead(): void {
    this.alerts = this.alerts.map(alert => ({ ...alert, read: true }));
  }
  
  /**
   * Mark a specific alert as read
   * @param alertId ID of the alert to mark as read
   */
  markAlertAsRead(alertId: number): void {
    this.alerts = this.alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    );
  }
  
  /**
   * Get count of unread alerts
   */
  get unreadAlertsCount(): number {
    return this.alerts.filter(alert => !alert.read).length;
  }
  
  /**
   * Set the active tab
   * @param tab Tab to set as active
   */
  setActiveTab(tab: keyof typeof this.expandedByTab) {    
    this.activeTab = tab;
  }
  
  /**
   * Set the global location
   * @param locationId Location ID to set globally
   */
  setGlobalLocation(locationId: string): void {
    this.globalLocation = locationId;
  }





}

