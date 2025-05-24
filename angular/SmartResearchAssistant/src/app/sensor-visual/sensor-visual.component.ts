import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  Renderer2,
  HostBinding,
  ViewChild,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts/core';
import { SensorStreamService } from '../services/SensorStreamService';
import { Subscription } from 'rxjs';
import { EventEmitter as RxEventEmitter } from '@angular/core';
import {
  FlatLocation,
  TimeOption,
  ChartType,
  SensorType
} from '../models/hierarchy.model';

@Component({
  selector: 'app-sensor-visual',
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [SensorStreamService],
  templateUrl: './sensor-visual.component.html',
  styleUrls: ['./sensor-visual.component.css']
})
export class SensorVisualComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private SENSOR_URL_MAP: Record<string, string> = {
    temperature: 'temperature',
    humidity: 'humidity',
    luminance: 'luminance',
    microphone: 'microphone',
    motion: 'motion',
    presence: 'presence',
    radio: 'radio',
    thermalmap: 'thermalmap',
    thermography: 'thermography',
    ble:'radio'
  };

  private _radioDeviceData: Array<{ imei: string; rssi: number }> = [];

private updateBleData(devices: Array<{ imei: string; rssi: number }>) {
  this._radioDeviceData = devices;
  if (this.chart) {
    console.log('[BLE] rendering with', devices);
    this.renderBleChart();
  }
}

  @Input() sensor!: string;
  @Input() sensorType!: SensorType;
  @Input() sensorColor: string = '#000000';
  @Input() flatLocations: FlatLocation[] = [];
  @Input() timeWindows: TimeOption[] = [];
  @Input() timeIntervals: TimeOption[] = [];
  @Input() chartTypes: ChartType[] = [];
  @Input() globalLocation!: string;
  @Input() globalLocationChanged!: RxEventEmitter<void>;
  @Input() aggregationOptions: string[] = [];


  private _sensorData: Array<{ time: string; value: number }> = [];
  private localOverridden = false;
  localLocation: string = '';


  @Input()
  set sensorData(value: Array<{ time: string; value: number }> | undefined) {
    // default to an empty array if parent passes undefined
    this._sensorData = value ?? [];
    if (this.chart) {
      this.updateChart();
    }
  }
  get sensorData(): Array<{ time: string; value: number }> {
    return this._sensorData;
  }

  @Output() pauseChange = new EventEmitter<{ sensor: string; isPaused: boolean }>();
  @Output() expandChange = new EventEmitter<{ sensor: string; isExpanded: boolean }>();

  @HostBinding('class.expanded') isExpanded: boolean = false;
  isPaused: boolean = false;
  showControls: boolean = true;
  
  timeWindow: string = '';
  timeInterval: string = '1m';
  aggregationMetric: string = 'none';
  chartType: string = 'area';
  private _bleTimestamp: string = '';


  private chart: echarts.ECharts | null = null;
  private resizeObserver!: ResizeObserver;
  private dataSub!: Subscription;
  private globalLocSub!: Subscription;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor(
    private sensorStream: SensorStreamService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resetLocalToGlobal();
    this.applyControls();
    this.subscribeToStream();
  
  }
  private resetLocalToGlobal() {
    this.localLocation = this.globalLocation;
    this.onLocationChange(this.localLocation);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['globalLocation'] && !this.localOverridden) {
      // parent picked a new global, and user hasn't overridden → reset
      this.resetLocalToGlobal();
    }

    if (changes['sensorColor']) {
      this.updateChart();
    }
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.observeResize();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.globalLocSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.sensorStream.disconnect();
  }

  private subscribeToStream(): void {
    this.dataSub = this.sensorStream.dataStream$.subscribe({
      next: (data) => {
        if (!this.isPaused) this.handleNewData(data);
      }
    });
  }

/**
 * Called when a new SSE payload arrives.
 * - Skips empty payloads (`{}`).
 * - Routes thermal-map matrices to handleThermalMap().
 * - Pushes scalar readings (including presence counts) into the time-series buffer.
 */
private handleNewData(data: any): void {
  // 0) Skip entirely empty payloads (bus.get_latest returned {}).
  if (!data || data.reading === undefined || data.reading === null) {
    return;
  }

  if (this.sensor === 'ble' && Array.isArray(data.devices)) {
    this._bleTimestamp = data.timeOfReading;

    const devices = data.devices.map((d: any) => ({
      imei: d.imei,
      rssi: +d.rssi
    }));
    this.updateBleData(devices);
    return;
  }
  

  // 1) Thermal map: a matrix of readings → heatmap
  if (Array.isArray(data.reading) && Array.isArray(data.reading[0])) {
    this.handleThermalMap(data.reading as number[][]);
    return;
  }

  // 2) Scalar reading (number) → time-series
  const iso = data.timeOfReading || data.timeOfCreate;
  const timestamp = new Date(iso);
  if (isNaN(timestamp.getTime())) {
    // invalid date, skip
    return;
  }
  const newPoint = {
    time: timestamp.toLocaleTimeString(),
    value: Number(data.reading)
  };

  // Initialize buffer if needed, then slide-window
  if (!Array.isArray(this._sensorData)) {
    this._sensorData = [];
  }
  this._sensorData = this._sensorData.slice(-29).concat(newPoint);

  // Redraw only the time-series chart
  this.updateChart();
}

private handleThermalMap(matrix: number[][]): void {
  if (!this.chart) return;

  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const aspectRatio = cols / rows;

  // Flatten data
  const data: [number, number, number][] = [];
  matrix.forEach((rowArr, rowIdx) => {
    rowArr.forEach((val, colIdx) => {
      data.push([colIdx, rowIdx, val]);
    });
  });

  const option: any = {
    grid: {
      left: 30,
      right: 20,
      top: 10,   // Minimal top padding
      bottom: 30,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: cols }, (_, i) => (i + 1).toString()),
      boundaryGap: true,
      axisLabel: {
        show: true,
        fontSize: 11,
        color: '#666',
        formatter: (val: string) => `Col ${val}`
      }
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: rows }, (_, i) => (i + 1).toString()),
      boundaryGap: true,
      inverse: true,
      axisLabel: {
        show: true,
        fontSize: 11,
        color: '#666',
        formatter: (val: string) => `Row ${val}`
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 5
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        // params.value: [colIdx, rowIdx, value]
        const [col, row, value] = params.value;
        return `
          <div>
            <strong>Value:</strong> ${value}<br/>
            <strong>Position:</strong> Col ${col + 1} / ${cols}, Row ${row + 1} / ${rows}
          </div>
        `;
      }
    },
    series: [{
      type: 'heatmap',
      data,
      aspectScale: aspectRatio,
      itemStyle: {
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.1)'
      },
      emphasis: {
        itemStyle: {
          borderColor: '#333',
          borderWidth: 1
        }
      }
    }]
  };

  this.chart.setOption(option, true);
}

  onLocationChange(newLoc: string): void {
    // Clear existing data and chart
    this._sensorData = [];
    if (this.chart) {
      this.chart.clear();
      this.updateChart();
    }
    if (this.sensor === 'ble') {
  this._radioDeviceData = [];
}
    
    // Force Angular change detection
    this.changeDetector.detectChanges();
    
    // Update stream params
    const [facility, box] = newLoc.split(':');
    this.sensorStream.updateParams({ facility, box, sensor: this.sensor });
  }
  onTimeWindowChange(newWindow: string): void {
    this.timeWindow = newWindow;
    this.applyControls();
  }

  onTimeIntervalChange(newInterval: string): void {
    this.timeInterval = newInterval;
    this.applyControls();
  }

  onAggregationChange(metric: string): void {
    this.aggregationMetric = metric;
    if (metric !== 'none' && !this.timeWindow) {
      return;
    }
    this.applyControls();
  }

  onChartTypeChange(newType: string): void {
    this.chartType = newType;
    this.applyControls();
    this.updateChart();
  }

  toggleControls(): void {
    this.showControls = !this.showControls;
  }

  private applyControls(): void {
    const controls: any = {};
    if (this.aggregationMetric !== 'none') {
      const secsWindow = this.parseIntervalToSeconds(this.timeWindow);
      controls.frequency = secsWindow;
      controls.buffer_time = secsWindow;
      controls.aggregation_metric = this.aggregationMetric;
    } else if (this.timeInterval) {
      const secsInterval = this.parseIntervalToSeconds(this.timeInterval);
      controls.frequency = secsInterval;
    }
    this.sensorStream.updateControls(controls);
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseChange.emit({ sensor: this.sensor, isPaused: this.isPaused });
    this.isPaused ? this.sensorStream.pause() : this.sensorStream.resume();
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.expandChange.emit({ sensor: this.sensor, isExpanded: this.isExpanded });
  }

  private initChart(): void {
    this.chart = echarts.init(this.chartContainer.nativeElement);
    this.updateChart();
  }

  /**
 * Updates the chart according to the current _sensorData buffer,
 * rendering it as either a line/area/bar chart (time-series).
 */
  // Update the updateChart method
private updateChart(): void {
  if (this.sensor === 'ble') {
    this.renderBleChart();
    return;
  }
  if (!this.chart || !Array.isArray(this._sensorData) || this._sensorData.length === 0) return;


  const times = this._sensorData.map(pt => pt.time);
  const values = this._sensorData.map(pt => pt.value);

  const option: any = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',  // More space for title
      containLabel: true,
      backgroundColor: '#f8fafc' // Light background for better contrast
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const value = params[0].value;
        const formattedValue = this.sensor === 'luminance' ? 
          value.toFixed(0) : value.toFixed(1);
        return `
          <div class="tooltip-container">
            <div class="time">${params[0].axisValue}</div>
            <div class="value-container">
              <span class="sensor-name">${this.sensorType.name}:</span>
              <span class="value">${formattedValue}</span>
              <span class="unit">${this.sensorType.unit}</span>
            </div>
          </div>
        `;
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#2D3033',
          borderColor: '#404348'
        }
      },
      backgroundColor: '#2D3033', // Dark tooltip
      borderColor: '#404348',
      borderWidth: 1,
      textStyle: {
        color: '#E0E3E7',
        fontSize: 13
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: {
        fontSize: 12,
        color: '#8C8F94',  // Muted gray
        formatter: (value: string) => {
          const parts = value.split(':');
          return `${parts[0]}:${parts[1]}`;
        }
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1' // Original light axis line
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#cbd5e1' // Original light axis line
        }
      },
      axisLabel: {
        color: '#8C8F94',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0', // Original light grid lines
          type: 'solid'
        }
      }
    },
    series: [this.getSeriesConfig(values)]
  };

  this.chart.setOption(option, true);
}

private getSeriesConfig(values: number[]): any {
  const base = {
    data: values,
    name: this.sensorType.name,
    animation: true,
    animationDuration: 400,
    smooth: true,
    showSymbol: false,
    emphasis: {
      focus: 'series',
      itemStyle: {
        color: this.sensorColor,
        borderColor: '#FFFFFF'
      }
    }
  };

  const gradientStops = [
    { offset: 0, color: `${this.sensorColor}CC` },  // 80% opacity
    { offset: 1, color: `${this.darkenColor(this.sensorColor, 25)}33` } // 20% opacity
  ];

  switch (this.chartType) {
    case 'area':
      return {
        ...base,
        type: 'line',
        areaStyle: {
          opacity: 0.9,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, gradientStops)
        },
        lineStyle: {
          width: 2.5,
          color: this.sensorColor,
          shadowColor: `${this.sensorColor}40`,
          shadowBlur: 15,
          shadowOffsetY: 8
        },
        itemStyle: {
          color: this.sensorColor,
          borderWidth: 2
        }
      };

    case 'bar':
      return {
        ...base,
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: this.lightenColor(this.sensorColor, 15) },
            { offset: 1, color: this.darkenColor(this.sensorColor, 15) }
          ]),
          borderRadius: [4, 4, 0, 0],
          borderWidth: 0
        }
      };

    default: // line
      return {
        ...base,
        type: 'line',
        lineStyle: {
          width: 3,
          color: this.sensorColor,
          shadowColor: `${this.sensorColor}40`,
          shadowBlur: 12,
          shadowOffsetY: 6
        },
        itemStyle: {
          color: this.sensorColor,
          borderWidth: 2
        }
      };
  }
}

private renderBleChart() {
  const data = this._radioDeviceData;
  const imeis = data.map(d => d.imei);
  const rssis = data.map(d => d.rssi);

  const option = {
    grid: {
      left: '6%',
      right: '4%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: imeis.map((_, i) => (i + 1).toString()), // Just indices
      name: 'Device',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        fontSize: 10,
        color: '#333',
        interval: 0,
        show: false // Hide all x labels for clarity
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'RSSI (dB)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        fontSize: 12,
        color: '#333'
      },
      splitLine: { show: true }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const idx = params.dataIndex;
        const imei = imeis[idx];
        const rssi = rssis[idx];
        // Use the latest BLE timestamp
        const timestamp = this._bleTimestamp ? `<br/><strong>Time:</strong> ${this._bleTimestamp}` : '';
        return `
          <div>
            <strong>IMEI:</strong> ${imei}<br/>
            <strong>RSSI:</strong> ${rssi} dB${timestamp}
          </div>
        `;
      }
    },
    series: [{
      type: 'bar',
      data: rssis,
      barWidth: '70%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(
          0, 0, 0, 1,
          [
            { offset: 0, color: this.lightenColor(this.sensorColor, 15) },
            { offset: 1, color: this.darkenColor(this.sensorColor, 15) }
          ]
        ),
        borderRadius: [4, 4, 0, 0],
        borderWidth: 0
      },
      emphasis: {
        itemStyle: {
          opacity: 0.8
        }
      },
      label: {
        show: false
      }
    }]
  };

  this.chart!.setOption(option, true);
}





// New color manipulation functions
private darkenColor(color: string, percent: number): string {
  if (!color || typeof color.replace !== 'function') return '#2D3033';
  
  const hex = color.replace('#', '');
  const num = parseInt(hex.length === 3 ? 
    hex.split('').map(c => c + c).join('') : hex, 16);
  
  const clamp = (value: number) => Math.min(Math.max(value, 0), 255);
  const amt = Math.round(2.55 * percent);

  return `#${[
    clamp((num >> 16) - amt),
    clamp(((num >> 8) & 0x00FF) - amt),
    clamp((num & 0x0000FF) - amt)
  ].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
// Add this new helper method
private lightenColor(color: string, percent: number): string {
  // Validate input and provide fallback
  if (!color || typeof color.replace !== 'function') {
    console.warn('Invalid color format, using default');
    return '#4F46E5'; // Sophisticated purple fallback
  }

  // Normalize color format
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  // Validate hex length
  if (hex.length !== 6) {
    console.error('Invalid hex color length');
    return '#4F46E5';
  }

  // Parse and validate numeric value
  const num = parseInt(hex, 16);
  if (isNaN(num)) {
    console.error('Invalid hex color value');
    return '#4F46E5';
  }

  // Calculate adjustment with bounds
  const amt = Math.min(Math.max(percent, 0), 100);
  const adjustment = Math.round(2.55 * amt);

  // Component manipulation with clamping
  const clamp = (value: number) => Math.min(Math.max(value, 0), 255);
  const components = {
    red: clamp((num >> 16) + adjustment),
    green: clamp(((num >> 8) & 0x00FF) + adjustment),
    blue: clamp((num & 0x0000FF) + adjustment)
  };

  // Convert back to hex with padding
  return `#${[
    components.red.toString(16).padStart(2, '0'),
    components.green.toString(16).padStart(2, '0'),
    components.blue.toString(16).padStart(2, '0')
  ].join('').toUpperCase()}`;
}
  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private parseIntervalToSeconds(interval: string): number {
    const unit = interval.slice(-1);
    const val = parseInt(interval.slice(0, -1), 10);
    return unit === 'h' ? val * 3600 : val * 60;
  }

  setChartType(type: string): void {
    this.onChartTypeChange(type);
  }

  resetChart(): void {
    this.onChartTypeChange('line');
  }
get latestValue(): string {
  if (!this._sensorData || this._sensorData.length === 0) return '--';
  
  const rawValue = this._sensorData[this._sensorData.length - 1].value;
  const formattedValue = this.sensor === 'luminance' 
    ? rawValue.toFixed(0)
    : rawValue.toFixed(1);

  return `${formattedValue}${this.sensorType?.unit ? ` ${this.sensorType.unit}` : ''}`;
}
}



