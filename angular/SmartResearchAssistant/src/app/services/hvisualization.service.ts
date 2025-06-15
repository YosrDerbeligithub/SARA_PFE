import { Injectable } from '@angular/core';
import * as echarts from 'echarts';
import { LineChart} from 'echarts/charts';
import { use } from 'echarts/core';
import { ChartType, ChartConfig } from './visualization-types';
import { SensorDataResponse, SensorDataPoint, ThermalmapResponse, CustomQueryRequest,CustomQueryResponseItem } from './http-requests.service';
import type { XAXisOption, YAXisOption } from 'echarts/types/dist/shared';
import { BarChart, ScatterChart } from 'echarts/charts';

import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  VisualMapComponent,
  CalendarComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';

use([
  LineChart,
    BarChart,      
  ScatterChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer
]);

export interface CustomChartData {
  x: any[];
  y: number[];
}
@Injectable({providedIn: 'root'})

export class VisualizationService {

  private _chartInstance: echarts.ECharts | null = null;
  private currentMetric: string = 'mean';
  private granularityLevels = ['minute', 'hour', 'day', 'month', 'year'];
  private currentGranularityIndex = 0;
  public currentGranularity:string = 'minute';
  private isInitialized = false;
  private startDate?: Date;
  private endDate?: Date;
  private currentChartType: 'line' | 'bar' | 'scatter' | 'area' | 'step' = 'line';
  private customXAxisColumn: any; //add this
  private customYAxisColumn: any;  //add this
  constructor() { }

  get chartInstance() {
    return this._chartInstance;
  }
  initChart(domElement: HTMLElement): void {
    if (this._chartInstance) this._chartInstance.dispose();
    this._chartInstance = echarts.init(domElement);
  }
private getSuperGranularityLabels(response: SensorDataResponse): string[] {
  const keys = Object.keys(response.aggregated_results || {});
  // For "all", return a single label
  if (keys.length === 1 && keys[0] === 'all') {
    return ['All'];
  }
  return keys;
}
public processAggregatedData(
  response: SensorDataResponse,
  requestStart: Date,
  requestEnd: Date
): { values: [number, number][], sensorType: string } {
  const dataPoints: [number, number][] = [];
  const sensorType = response.sensor_type || 'Unknown Sensor';

  if (!response?.aggregated_results) {
    return { values: [], sensorType };
  }

  // Always include all points returned by the backend
  for (const group of Object.values(response.aggregated_results)) {
    for (const point of group as any[]) {
      try {
        const timestamp = Date.parse(point.time);
        if (!isNaN(timestamp)) {
          dataPoints.push([timestamp, point.value]);
        }
      } catch (e) {
        console.warn('Invalid data point:', point);
      }
    }
  }

  // Sort by timestamp for correct plotting
  return {
    values: dataPoints.sort((a, b) => a[0] - b[0]),
    sensorType
  };
}
updateChart(
  data: { values: [number, number][], sensorType: string, chartType?: 'line' | 'bar' | 'scatter' | 'area' | 'step'},
  chartInstance: echarts.ECharts,
  rawResponse?: SensorDataResponse
): void {
    if (!this._chartInstance) return;

  // Get common chart options (axes, tooltip, etc.)
  const commonOptions = this.getCommonChartOptions(data, rawResponse); 
 
  // Get series-specific configuration
  const seriesConfig = this.getSeriesConfig(data, data.chartType || this.currentChartType);
  const finalOptions = {
    ...commonOptions,
    series: [seriesConfig]
  };

  this._chartInstance.setOption(finalOptions, true);
}

private getCommonChartOptions(
  data: { values: [number, number][], sensorType: string },
  rawResponse?: SensorDataResponse // <-- add this param if needed
): echarts.EChartsOption {
  // Only use real super granularity keys from backend
  let superLabels: string[] = [];
  if (rawResponse && rawResponse.aggregated_results) {
    superLabels = Object.keys(rawResponse.aggregated_results);
if (superLabels.length === 1 && superLabels[0] === 'all') {
if (this.currentGranularity === 'minute' && data.values.length > 0) {
  let lastDay: string | null = null;
  superLabels = data.values.reduce((acc: string[], [timestamp]) => {
    const d = new Date(timestamp);
    const dayLabel = `${d.getUTCDate().toString().padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getUTCFullYear()}`;
    if (dayLabel !== lastDay) {
      acc.push(dayLabel);
      lastDay = dayLabel;
    }
    return acc;
  }, []);
}  else if (this.currentGranularity === 'year' && data.values.length > 0) {
    // For yearly, extract unique years from data
    superLabels = Array.from(new Set(
      data.values.map(([timestamp]) => {
        const d = new Date(timestamp);
        return d.getUTCFullYear().toString();
      })
    ));
  } else {
    superLabels = ['All'];
  }
}
  }const option = {
      ...this.getBaseChartOptions(data),
      xAxis: [
        this.getEnhancedXAxisOptions(data.values),
        {  // Secondary x-axis for superior granularity
          type: 'category'as const,
          position: 'bottom',
          offset: 30,
          data: superLabels,
          axisLabel: {
  formatter: (value: string) => {
    if (this.currentGranularity === 'hour') {
      return value;
    }
    if (this.currentGranularity === 'day') {
      // value: '2023-10'
      const [year, month] = value.split('-');
      if (year && month) {
        return `${new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
      }
      return value;
    }
    if (this.currentGranularity === 'month') {
      // value: '2023'
      return value;
    }
    if (this.currentGranularity === 'year') {
      return value;
    }
    return value;
  },

            color: '#666',
            fontSize: 11,
            fontWeight: 'normal',
            interval: 0,
            rotate: 30,
            margin: 15,
            verticalAlign: 'middle'
          },
          axisLine: { show: false },
          axisTick: {
            show: true,
            alignWithLabel: true
          },
          splitLine: { show: false },
          axisPointer: {
            show: true,
            type: 'shadow',
            label: { show: false }
          }
        } as XAXisOption
      ],
      yAxis: this.getEnhancedYAxisOptions(data.values)
  };
  return option;
}
private getSeriesConfig(data: { values: [number, number][], sensorType: string }, chartType: string): any {
  const baseSeries = {
    data: data.values,
    itemStyle: {
      color: '#6366f1',
      opacity: 0,
      emphasis: {
        opacity: 1,
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  };

  switch(chartType) {
    case 'area':
      return {
        ...baseSeries,
        type: 'line',
        smooth: true,
        areaStyle: {},
        lineStyle: { width: 2 },
        symbol: 'none'
      };

    case 'bar':
      return {
        ...baseSeries,
        type: 'bar',
        barWidth: this.calculateBarWidth(),
        itemStyle: { opacity: 0.8 }
      };

    case 'scatter':
      return {
        ...baseSeries,
        type: 'scatter',
        symbolSize: 8,
        itemStyle: { opacity: 0.8 }
      };

    case 'step':
      return {
        ...baseSeries,
        type: 'line',
        step: 'middle',
        smooth: false,
        lineStyle: { width: 2 },
        symbol: 'none'
      };

    default: // line
      return {
        ...baseSeries,
        type: 'line',
        smooth: true,
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6
      };
  }
}

  private getBaseChartOptions(data: { values: [number, number][], sensorType: string  }): echarts.EChartsOption {
    return {
      grid: {
        top: '5%',
        bottom: '2%',
        left: '2%',
        right: '4%',
        containLabel: true
      },
      toolbox: {
      feature: {
        saveAsImage: {
          name: `${data.sensorType}_chart`,
          title: 'Save as Image',
          type: 'png',
          backgroundColor: '#FFFFFF',
          excludeComponents: ['toolbox'],
          pixelRatio: 2
        }
      },
      right: '20px',
      top: '10px',
      itemSize: 16
    },
      tooltip: {
        trigger: 'axis',
      formatter: (params: any) => {
        const date = new Date(params[0].value[0]);
        return `
         <strong>${data.sensorType}</strong><br>
          ${date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
          })}
          (${date.toLocaleDateString('en-US', {
            weekday: 'short',
            timeZone: 'UTC'
          })})
          ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')} UTC<br>
          ${params[0].marker} ${params[0].value[1].toFixed(2)}
        `;
      }
    },
      dataZoom: [
        { // X-Axis controls
          type: 'inside',
          xAxisIndex: 0,
          zoomLock: false,
          start: 0, // Force initial full view
          end: 100,
          minSpan: 1, // Minimum 30% of total range (prevents over-zooming)
         filterMode: 'filter',
          rangeMode: ['value', 'value'],
          zoomOnMouseWheel: false,
          moveOnMouseMove: true, // Horizontal drag-to-pan
          moveOnMouseWheel: true, // Horizontal scroll-to-pan
          preventDefaultMouseMove: false
        },
        { // Y-Axis controls
          type: 'inside',
          yAxisIndex: 0,
          zoomLock: false,
          filterMode: 'none',
          zoomOnMouseWheel: false,
          moveOnMouseMove: true, // Vertical drag-to-pan
          moveOnMouseWheel: true, // Vertical scroll-to-pan
          preventDefaultMouseMove: false
        },
        { // X-Axis pinch zoom (horizontal)
          type: 'inside',
          xAxisIndex: 0,
          orient: 'horizontal', // Controls horizontal pinch
          zoomOnMouseWheel: true,
          throttle: 0,
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: 'none'
        },
        { // Y-Axis pinch zoom (vertical)
          type: 'inside',
          yAxisIndex: 0,
          orient: 'vertical', // Controls vertical pinch
          zoomOnMouseWheel: true,
          throttle: 0,
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: 'none'
        }
      ],
      graphic: data.values.length === 0 ? [{
        type: 'text',
        left: 'center',
        top: 'middle',
      }] : []
    };
  }




  private getEnhancedXAxisOptions(data: [number, number][]): XAXisOption {
    const baseConfig = this.getXAxisOptions();
    return {
      ...baseConfig,
      type: 'time',
      boundaryGap: ['2%', '2%'],
      axisLabel: {
        ...baseConfig.axisLabel,
        formatter: (value: number) => {
          if (!data.length) return '';
          return this.formatDate(value, this.currentGranularity);
        },
       hideOverlap: true, // Use dynamic interval calculation
      rotate: 45, // Rotate labels for better fit
      margin: 8, // Add margin between labels
      align: 'right',
      verticalAlign: 'bottom'
      },
    min: data.length > 0 ? data[0][0] - this.getGranularityMS() : undefined,
    max: data.length > 0 ? data[data.length - 1][0] + this.getGranularityMS() : undefined,
      minInterval: this.getMinIntervalForGranularity(),// Minimum interval based on granularity
      axisPointer: {
        show: true,
        label: {
          show: true,
          formatter: (params: { value: number | string | Date }) => {          
            const value = params.value;
           
            // Convert Date objects to timestamps
            const timestamp = value instanceof Date ? value.getTime() :
                             typeof value === 'number' ? value :
                             typeof value === 'string' ? parseFloat(value) : NaN;
     
            return isNaN(timestamp) ? '' : this.formatDate(timestamp, 'minute');          
          }
        }
      }
    };
  }

  private getEnhancedYAxisOptions(data: [number, number][]): YAXisOption {
    const baseConfig = this.getYAxisOptions();
    if (!data.length) return baseConfig;

    const values = data.map(d => d[1]);
    const minVal = values.reduce((acc, val) => Math.min(acc, val), Infinity);
    const maxVal = values.reduce((acc, val) => Math.max(acc, val), -Infinity);
    return {
      ...baseConfig,
      type: 'value',
      boundaryGap: [0, 0],
      min: Math.floor(minVal * 0.95),
      max: Math.ceil(maxVal * 1.05),
      axisLabel: {
        formatter: (value: number) => `${value.toFixed(2)}`
      }
    };
  }

  private getXAxisOptions(): XAXisOption {
    return {
      type: 'time',
      axisLabel: {
        formatter: (value: number) => this.formatDate(value, this.currentGranularity),
        showMaxLabel: true,
      },
      axisLine: { lineStyle: { color: '#666' } },
      axisTick: { show: true, alignWithLabel: true },
      splitLine: { show: false },
      utc: true,
      splitNumber: 10, // Controls number of splits
      axisPointer: {
        label: {
          rotate: 45,
          margin: 15
        }
      }
    } as XAXisOption;
  }

  private getYAxisOptions(): YAXisOption {
    return {
      type: 'value',
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { show: true, lineStyle: { color: '#eee' } },
        axisLabel: {
    margin: 1 // Add small margin for y-axis labels
  }
    };
  }

 
  private getMinIntervalForGranularity(): number {
    type GranularityKey = 'minute' | 'hour' | 'day' | 'month' | 'year';
    const intervals: Record<GranularityKey, number> = {
      'minute': 300000,  // 5 minutes
      'hour': 3600000,    // 1 hour
      'day': 86400000,    // 1 day
      'month': 2592000000, // 30 days
      'year': 31536000000 // 1 year
    };
    return intervals[this.currentGranularity as GranularityKey] ?? 60000;
  }
  setTimeRange(start: Date, end: Date) {
    // Ensure end date is after start date
    if (start > end) {
      [this.startDate, this.endDate] = [end, start];
    } else {
      this.startDate = start;
      this.endDate = end;
    }
  }
setGranularity(granularity: 'minute' | 'hour' | 'day' | 'month' | 'year'): void {
  const levels = ['minute', 'hour', 'day', 'month', 'year'];
  this.currentGranularityIndex = levels.indexOf(granularity);
  this.currentGranularity = granularity;
}

 // Add these inside the VisualizationService class
 private calculateBarWidth(): string {
  const widthMap: Record<string, string> = {
    'minute': '2px',
    'hour': '10px',
    'day': '20px',
    'month': '30px',
    'year': '40px'
  };
  return widthMap[this.currentGranularity] || '20px';
}




  private formatDate(value: number, granularity: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    switch(granularity) {
      case 'minute':
        return echarts.time.format(date, '{HH}:{mm}', true); // Last param true for UTC
      case 'hour':
        return echarts.time.format(date, '{HH}:00', true);
      case 'day':
        return echarts.time.format(new Date(date.getTime() + 86400000), '{MMM} {dd}', true); // Add 1 day
      case 'month':
        return echarts.time.format(new Date(date.setMonth(date.getMonth() + 1)), '{yyyy} {MMM}', true); // Add 1 month
      case 'year':
        return echarts.time.format(new Date(date.setFullYear(date.getFullYear() + 1)), '{yyyy}', true); // Add 1 year
      default:
        return '';
    }
  }


  applyMetric(metric: string): void {
    this.currentMetric = metric;
  }

  updateGranularity(direction: 'up' | 'down') {
     const levels = this.granularityLevels;

    // Update index first
    if (direction === 'up' && this.currentGranularityIndex < levels.length - 1) {
      this.currentGranularityIndex++;
    } else if (direction === 'down' && this.currentGranularityIndex > 0) {
      this.currentGranularityIndex--;
    }
   
    // Update current granularity
    this.currentGranularity = levels[this.currentGranularityIndex];
   
    // Maintain time range alignment
    if (this.startDate && this.endDate) {
      const alignedStart = this.alignDateToGranularity(this.startDate.getTime());
      const alignedEnd = this.alignDateToGranularity(this.endDate.getTime());
      this.setTimeRange(new Date(alignedStart), new Date(alignedEnd));
    }
  }


  public alignDateToGranularity(timestamp: number): number {
    const date = new Date(timestamp);
    switch(this.currentGranularity) {
      case 'minute':
        return Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes()
        );
      case 'hour':
        return Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours()
        );
      case 'day':
        return Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate()
        );
      case 'month':
        return Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          1
        );
      case 'year':
        return Date.UTC(
          date.getUTCFullYear(),
          0,
          1
        );
      default:
        return timestamp;
    }
  }
  public getGranularityMS(): number {
    switch(this.currentGranularity) {
      case 'minute': return 60000;
      case 'hour': return 3.6e6;
      case 'day': return 8.64e7;
      case 'month': return 2.628e9; // Approximate 30.44 days
      case 'year': return 3.154e10; // Approximate 365.25 days
      default: return 60000;
    }
  }
  get currentGranularityLabel() {
    return this.currentGranularity;
  }
  setChartType(type: 'line' | 'bar' | 'scatter' | 'area' | 'step'): void {
  this.currentChartType = type;
}

  clearChart() {
    if (this._chartInstance) {
      this._chartInstance.dispose();
      this._chartInstance = null;
    }
  }

  /**
   * Render a heatmap using ECharts.

   */
  renderThermalmapHeatmap(
    matrix: number[][],
    meta: { facility: string; agent_serial: string; timestamp: string },
    chartInstance: echarts.ECharts
  ): void {
    if (!chartInstance) return;

    // Prepare data for ECharts heatmap
    const data: [number, number, number][] = [];
    const numRows = matrix.length;
    const numCols = matrix[0]?.length || 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        data.push([col, row, matrix[row][col]]);
      }
    }

    // Blue-to-red color scale
    const visualMap = {
      min: Math.min(...data.map(d => d[2])),
      max: Math.max(...data.map(d => d[2])),
      calculable: true,
      orient: 'vertical' as const,
      left: 'right',
      top: 'center',
      inRange: {
        color: ['#2166ac', '#67a9cf', '#f7f7f7', '#f46d43', '#b2182b'] // blue to red
      }
    };

    // ECharts option
    const option: echarts.EChartsOption = {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [col, row, value] = params.value;
          return `
            <div>
              <strong>Thermalmap Reading</strong><br>
              <b>Facility:</b> ${meta.facility}<br>
              <b>Agent:</b> ${meta.agent_serial}<br>
              <b>Timestamp:</b> ${meta.timestamp}<br>
              <b>Row:</b> ${row + 1} / ${numRows}<br>
              <b>Col:</b> ${col + 1} / ${numCols}<br>
              <b>Value:</b> ${value.toFixed(2)}
            </div>
          `;
        }
      },
      grid: {
        height: '80%',
        top: '10%',
        left: '8%',
        right: '12%'
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: numCols }, (_, i) => `Col ${i + 1}`),
        splitArea: { show: true },
        name: 'Columns',
        nameLocation: 'middle',
        nameGap: 25,
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: numRows }, (_, i) => `Row ${i + 1}`),
        splitArea: { show: true },
        name: 'Rows',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: { fontSize: 10 }
      },
      visualMap,
      series: [{
        name: 'Thermalmap',
        type: 'heatmap',
        data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.5)'
          }
        }
      }]
    };

    chartInstance.clear();
    chartInstance.setOption(option, true);
  }

  /**

 */
renderBleDevicesBarChart(
  devices: { imei: string; rssi: number }[],
  meta: { facility: string; agent_serial: string; timestamp: string },
  chartInstance: echarts.ECharts
): void {
  if (!chartInstance) return;

  // Sort devices by RSSI (strongest to weakest)
  const sorted = [...devices].sort((a, b) => b.rssi - a.rssi);

  // Prepare data for ECharts
  const yData = sorted.map(d => d.imei);
  const xData = sorted.map(d => d.rssi);

  // Color mapping: green (strong) to red (weak)
  const getColor = (rssi: number) => {
    if (rssi >= -70) return "#43a047"; // strong (green)
    if (rssi >= -85) return "#fbc02d"; // medium (yellow)
    return "#e53935"; // weak (red)
  };

  const option: echarts.EChartsOption = {
    title: {
      text: "BLE Devices Signal Strength",
      left: "center",
      top: 10,
      textStyle: { fontSize: 16 }
    },
    grid: {
      left: 120,
      right: 40,
      top: 60,
      bottom: 40,
      containLabel: true
    },
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const device = sorted[params.dataIndex];
        return `
          <div>
            <strong>IMEI:</strong> ${device.imei}<br>
            <strong>RSSI:</strong> ${device.rssi} dBm<br>
            <strong>Timestamp:</strong> ${meta.timestamp}<br>
            <strong>Facility:</strong> ${meta.facility}<br>
            <strong>Agent:</strong> ${meta.agent_serial}
          </div>
        `;
      }
    },
    xAxis: {
      type: "value",
      name: "RSSI (dBm)",
      min: Math.min(...xData, -100) - 5,
      max: Math.max(...xData, -30) + 5,
      axisLabel: { formatter: "{value} dBm" }
    },
    yAxis: {
      type: "category",
      data: yData,
      name: "IMEI",
      axisLabel: {
        fontSize: 12,
        formatter: (val: string) => val
      }
    },
    series: [{
      type: "bar",
      data: sorted.map(d => ({
        value: d.rssi,
        itemStyle: { color: getColor(d.rssi) }
      })),
      barWidth: 18,
      label: {
        show: true,
        position: "right",
        formatter: (params: any) => `${params.value} dBm`
      }
    }]
  };

  chartInstance.clear();
  chartInstance.setOption(option, true);
}




//methods for custom datsest
processCustomData(response: CustomQueryResponseItem[]): {
  series: { name: string, values: [any, any][] }[],
  xLabel: string,
  yLabel: string
} {
  if (!response.length) return { series: [], xLabel: 'X', yLabel: 'Y' };

  // Helper to flatten or wrap primitives
  const flatten = (val: any) =>
    (typeof val === 'object' && val !== null && !Array.isArray(val))
      ? this.flattenObject(val)
      : { value: val };

  // Gather all possible keys for x and y
  const xKeys = new Set<string>();
  const yKeys = new Set<string>();
 
  response.forEach(item => {
    Object.keys(flatten(item.x)).forEach(k => xKeys.add(k));
    Object.keys(flatten(item.y)).forEach(k => yKeys.add(k));
  });

  // If both axes are objects, pick first yKey
  if (xKeys.size > 1 && yKeys.size > 1) {
    const yKey = Array.from(yKeys)[0];
    const series = Array.from(xKeys).map(xKey => ({
      name: xKey,
      values: response.map(item => [
        flatten(item.x)[xKey],
        flatten(item.y)[yKey]
      ] as [any, any])
    }));
    return {
      series,
      xLabel:  'X',
      yLabel: yKey
    };
  }

  // If x is object, y is primitive or single-key
  if (xKeys.size > 1) {
    const yKey = Array.from(yKeys)[0];
    const series = Array.from(xKeys).map(xKey => ({
      name: xKey,
      values: response.map(item => [
        flatten(item.x)[xKey],
        flatten(item.y)[yKey] ?? flatten(item.y)['value']
      ] as [any, any])
    }));
    return {
      series,
      xLabel: 'X',
      yLabel: yKey
    };
  }

  // If y is object, x is primitive or single-key
  if (yKeys.size > 1) {
    const xKey = Array.from(xKeys)[0];
    const series = Array.from(yKeys).map(yKey => ({
      name: yKey,
      values: response.map(item => [
        flatten(item.x)[xKey] ?? flatten(item.x)['value'],
        flatten(item.y)[yKey]
      ] as [any, any])
    }));
    return {
      series,
      xLabel: xKey,
      yLabel: this.customYAxisColumn?.name || 'Y'
    };
  }

  // Both are primitives or single-key objects
  const xKey = Array.from(xKeys)[0];
  const yKey = Array.from(yKeys)[0];
  return {
    series: [{
      name: this.customYAxisColumn?.name || yKey || 'Value',
      values: response.map(item => [
        flatten(item.x)[xKey] ?? flatten(item.x)['value'],
        flatten(item.y)[yKey] ?? flatten(item.y)['value']
      ] as [any, any])
    }],
    xLabel:  xKey || 'X',
    yLabel:  yKey || 'Y'
  };
}
// add flattenObject()
private flattenObject(obj: any, prefix = ''): Record<string, any> {
  let res: Record<string, any> = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(res, this.flattenObject(val, newKey));
    } else {
      res[newKey] = val;
    }
  }
  return res;
}
//add update custom chart()
updateCustomChart(
  data: {
    series: { name: string, values: [any, any][] }[],
    chartType: string,
    xLabel: string,
    yLabel: string
  },
  chartInstance: echarts.ECharts
): void {
  try {
    // Only plot if Y is numeric
    const filteredSeries = data.series.map(series => ({
      ...series,
      values: series.values.filter(([x, y]) => typeof y === 'number')
    }));

    if (filteredSeries.every(s => s.values.length === 0)) {
      console.warn('No numeric Y values to plot.');
      chartInstance.clear();
      return;
    }
    // Detect x axis type
    const firstX = filteredSeries[0]?.values[0]?.[0];
    const xAxisType = typeof firstX === 'number' ? 'value' : 'category';

    const options: echarts.EChartsOption = {
      toolbox: {
        feature: {
          saveAsImage: {
            name: `${data.yLabel || 'custom'}_chart`,
            title: 'Save as Image',
            type: 'png',
            backgroundColor: '#FFFFFF',
            excludeComponents: ['toolbox'],
            pixelRatio: 2
          }
        },
        right: '20px',
        top: '10px',
        itemSize: 16
      },
      xAxis: {
        name: data.xLabel || 'X',
        type: xAxisType,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        name: data.yLabel || 'Y',
        type: 'value'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const xLabel = data.xLabel || 'X';
          const yLabel = data.yLabel || 'Y';
          return params.map((p: any) => {
            const d = p.data;
            return `
              <strong>${p.seriesName}</strong><br>
              ${xLabel}: ${d[0]}<br>
              ${yLabel}: ${d[1]}
            `;
          }).join('<hr>');
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomLock: false,
          start: 0,
          end: 100,
          minSpan: 5,
          filterMode: 'filter',
          rangeMode: ['value', 'value'],
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
          preventDefaultMouseMove: false
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          zoomLock: false,
          filterMode: 'none',
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
          preventDefaultMouseMove: false
        },
        {
          type: 'inside',
          xAxisIndex: 0,
          orient: 'horizontal',
          zoomOnMouseWheel: true,
          throttle: 0,
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: 'none'
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          orient: 'vertical',
          zoomOnMouseWheel: true,
          throttle: 0,
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: 'none'
        }
      ],
      series: filteredSeries.map(series => {
        let type = data.chartType;
        let extra: any = {};
        if (type === 'area') {
          type = 'line';
          extra = { areaStyle: {} };
        }
        if (type === 'step') {
          type = 'line';
          extra = { step: 'middle' };
        }
        return {
          type,
          name: series.name,
          data: series.values,
          ...this.getSeriesStyleConfig(data.chartType),
          ...extra
        };
      }),
    };

    chartInstance.setOption(options, true);
    setTimeout(() => chartInstance.resize(), 100);
  } catch (e) {
    console.error('Error updating custom chart:', e);
  }
}
// add this too
private getSeriesStyleConfig(chartType: string) {
  const baseStyle = {
    itemStyle: {
      color: '#6366f1',
      opacity: 0.8,
      emphasis: {
        opacity: 1,
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  };

  switch(chartType) {
    case 'area':
      return { ...baseStyle, areaStyle: {} };
    case 'bar':
      return { ...baseStyle, barWidth: this.calculateBarWidth() };
    case 'scatter':
      return { ...baseStyle, symbolSize: 8 };
    case 'step':
      return { ...baseStyle, step: 'middle' };
    default: // line
      return baseStyle;
  }
}


 updateMultiSeriesChart(
    data: { series: { name: string, data: [number, number][] }[], chartType: string },
    chartInstance: echarts.ECharts,
    metaByAgentSerial: Record<string, { facility: string; location: string; sensorType: string }>
  ) {
    // Build legend and series
    const legendData = data.series.map(s => s.name);
const series = data.series.map(s => {
  let type = data.chartType;
  let extra: any = {};
  if (type === 'area') {
    type = 'line';
    extra = { areaStyle: {}, smooth: true };
  }
  if (type === 'step') {
    type = 'line';
    extra = { step: 'middle', smooth: false };
  }
  return {
    name: s.name,
    type,
    data: s.data,
    showSymbol: false,
    emphasis: { focus: 'series' },
    ...extra
  };
});

    // X axis: time (assume all series aligned on time)
    chartInstance.setOption({
        color: [
    '#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE',
    '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'
  ],
      toolbox: {
      feature: {
        saveAsImage: {
          name: 'multi_sensor_chart',
          title: 'Save as Image',
          type: 'png',
          backgroundColor: '#FFFFFF',
          excludeComponents: ['toolbox'],
          pixelRatio: 2
        }
      },
      right: '20px',
      top: '10px',
      itemSize: 16
    },
      dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomLock: false,
        start: 0,
        end: 100,
        minSpan: 1,
        filterMode: 'filter',
        rangeMode: ['value', 'value'],
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
        preventDefaultMouseMove: false
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        zoomLock: false,
        filterMode: 'none',
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
        preventDefaultMouseMove: false
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        orient: 'horizontal',
        zoomOnMouseWheel: true,
        throttle: 0,
        start: 0,
        end: 100,
        zoomLock: false,
        filterMode: 'none'
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        orient: 'vertical',
        zoomOnMouseWheel: true,
        throttle: 0,
        start: 0,
        end: 100,
        zoomLock: false,
        filterMode: 'none'
      }
    ],
tooltip: {
  trigger: 'axis',
  axisPointer: { type: 'cross' },
formatter: (params: any) => {
  if (!params || !params.length) return '';
  const date = new Date(params[0].value[0]);
  const sensorType = (metaByAgentSerial[params[0].seriesName]?.sensorType ?? '');

  // Smaller font for time and sensor type, same weight, same line
  const header = `
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95em; font-weight: 500;">
      <span>
        ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
        })}
        (${date.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'UTC'
        })})
        ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')} UTC
      </span>
      <span style="margin-left:16px;">${sensorType}</span>
    </div>
  `;
  // Body: one line per series
  const lines = params.map((p: any) => {
    const meta = metaByAgentSerial[p.seriesName] || {};
    return `
      <div>
        <span style="display:inline-block;width:10px;height:10px;background:${p.color};border-radius:50%;margin-right:6px;"></span>
        ${meta.facility || '-'}, ${meta.location || '-'}, ${p.value[1] != null ? p.value[1].toFixed(2) : '-'}
      </div>
    `;
  }).join('');
  return header + lines;
}
},
      legend: {
        data: legendData,
        top: 9,
        type: 'scroll'
      },
      grid: {
        left: 50,
        right: 30,
        top: 50,
        bottom: 60
      },
      xAxis: {
        type: 'time',
        name: '',
        axisLabel: {
          rotate: 45,
          formatter: (value: number) => this.formatDate(value, this.currentGranularity),
          hideOverlap: true,
          margin: 8,
          align: 'right',
          verticalAlign: 'bottom'
        },
        min: data.series.length && data.series[0].data.length > 0 ? data.series[0].data[0][0] - this.getGranularityMS() : undefined,
        max: data.series.length && data.series[0].data.length > 0 ? data.series[0].data[data.series[0].data.length - 1][0] + this.getGranularityMS() : undefined,
        minInterval: this.getMinIntervalForGranularity(),
        axisPointer: {
          show: true,
          label: {
            show: true,
            formatter: (params: { value: number | string | Date }) => {
              const value = params.value;
              const timestamp = value instanceof Date ? value.getTime() :
                typeof value === 'number' ? value :
                typeof value === 'string' ? parseFloat(value) : NaN;
              return isNaN(timestamp) ? '' : this.formatDate(timestamp, 'minute');
            }
          }
        }
},
      yAxis: {
        type: 'value',
        name: ''
      },
      series
    });
  }


}