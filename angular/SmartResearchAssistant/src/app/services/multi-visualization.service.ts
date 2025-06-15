import { Injectable } from '@angular/core';
import * as echarts from 'echarts';
import { LineChart, BarChart, ScatterChart } from 'echarts/charts';
import { use } from 'echarts/core';
import type { XAXisOption, YAXisOption } from 'echarts/types/dist/shared';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { SensorDataResponse } from './http-requests.service';

// Register necessary ECharts components
use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer
]);

/**
 * Service for managing multiple chart visualizations
 * This service provides chart configuration, time granularity management, and data processing
 */
@Injectable({ providedIn: 'root' })
export class MultiVisualizationService {
  // Chart registry to track all chart instances
  private chartRegistry = new Map<string, {
    instance: echarts.ECharts,
    config: {
      granularity: string;
      chartType: 'line' | 'bar' | 'scatter' | 'area' | 'step';
      metric: string;
    }
  }>();
 
  // Chart configs for specific charts
  private chartConfigs = new Map<string, {
    granularity: string;
    chartType: 'line' | 'bar' | 'scatter' | 'area' | 'step';
    metric: string;
  }>();
 
  // Granularity and time management
  private granularityLevels = ['minute', 'hour', 'day', 'month', 'year'];
  private currentGranularityIndex = 0;
  public currentGranularity: string = 'minute';
  private startDate?: Date;
  private endDate?: Date;
 
  // Chart configuration
  private currentChartType: 'line' | 'bar' | 'scatter' | 'area' | 'step' = 'line';
  public currentMetric: string | undefined;

  constructor() { }

  /**
   * Register a chart with the service
   */
  registerChart(chartId: string, instance: echarts.ECharts, config: {
    granularity: string;
    chartType: 'line' | 'bar' | 'scatter' | 'area' | 'step';
    metric: string;
  }): void {
    this.chartRegistry.set(chartId, { instance, config });
    this.chartConfigs.set(chartId, config);
   
    // Apply initial configuration
    const options = this.getBaseChartOptions({ values: [], sensorType: '' });
    instance.setOption(options);
  }

  /**
   * Unregister a chart from the service
   */
  unregisterChart(chartId: string): void {
    this.chartRegistry.get(chartId)?.instance.dispose();
    this.chartRegistry.delete(chartId);
    this.chartConfigs.delete(chartId);
  }

  /**
   * Update a chart with new data
   */
updateChart(
  chartId: string,
  data: {
    values: [number, number][],
    sensorType: string,
    chartType: 'line' | 'bar' | 'scatter' | 'area' | 'step',
    grid?: { top?: number, bottom?: number, left?: number, right?: number }
  }
): void {
  const chart = this.chartRegistry.get(chartId);
  if (!chart) return;

  // Always use getFullChartOptions for all chart types
  const options = this.getFullChartOptions(data, { ...chart.config, chartType: data.chartType, grid: data.grid });
  chart.instance.setOption(options, true);
  requestAnimationFrame(() => {
    chart.instance.resize();
  });
}

  /**
   * Process raw sensor data into format needed for charts
   */
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

  // Sort by timestamp
  return {
    values: dataPoints.sort((a, b) => a[0] - b[0]),
    sensorType
  };
}

  /**
   * Set the chart type for all charts
   */
  setChartType(type: 'line' | 'bar' | 'scatter' | 'area' | 'step'): void {
    this.currentChartType = type;
   
    // Update all chart configs
    this.chartConfigs.forEach((config, chartId) => {
      config.chartType = type;
    });
  }

  /**
   * Apply a metric to all charts
   */
  applyMetric(metric: string): void {
    this.currentMetric = metric;
   
    // Update all chart configs
    this.chartConfigs.forEach((config, chartId) => {
      config.metric = metric;
    });
  }

  /**
   * Set the granularity for time-based visualizations
   */
  setGranularity(granularity: 'minute' | 'hour' | 'day' | 'month' | 'year'): void {
    const levels = this.granularityLevels;
    const newIndex = levels.indexOf(granularity);
   
    if (newIndex !== -1) {
      this.currentGranularityIndex = newIndex;
      this.currentGranularity = granularity;
     
      // Update all chart configs
      this.chartConfigs.forEach((config, chartId) => {
        config.granularity = granularity;
      });
    }
  }

  /**
   * Update granularity based on direction
   */
  updateGranularity(direction: 'up' | 'down'): void {
    const levels = this.granularityLevels;
    let newIndex = this.currentGranularityIndex;

    // Update index based on direction
    if (direction === 'up' && newIndex < levels.length - 1) {
      newIndex++;
    } else if (direction === 'down' && newIndex > 0) {
      newIndex--;
    } else {
      return; // No change needed
    }
   
    // Update current granularity
    this.currentGranularityIndex = newIndex;
    this.currentGranularity = levels[newIndex];
   
    // Update all chart configs
    this.chartConfigs.forEach((config, chartId) => {
      config.granularity = this.currentGranularity;
    });
   
    // Maintain time range alignment
    if (this.startDate && this.endDate) {
      const alignedStart = this.alignDateToGranularity(this.startDate.getTime());
      const alignedEnd = this.alignDateToGranularity(this.endDate.getTime());
      this.setTimeRange(new Date(alignedStart), new Date(alignedEnd));
    }
  }

  /**
   * Set time range for visualization
   */
  setTimeRange(start: Date, end: Date): void {
    // Ensure end date is after start date
    if (start > end) {
      [this.startDate, this.endDate] = [end, start];
    } else {
      this.startDate = start;
      this.endDate = end;
    }
  }

  /**
   * Align a timestamp to the current granularity
   */
  public alignDateToGranularity(timestamp: number): number {
    const date = new Date(timestamp);
   
    switch (this.currentGranularity) {
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

  /**
   * Get milliseconds for current granularity
   */
  public getGranularityMS(): number {
    switch (this.currentGranularity) {
      case 'minute': return 60000; // 1 minute
      case 'hour': return 3.6e6; // 1 hour
      case 'day': return 8.64e7; // 1 day
      case 'month': return 2.628e9; // ~30.44 days
      case 'year': return 3.154e10; // ~365.25 days
      default: return 60000;
    }
  }

  // Chart configuration builders
 
  /**
   * Get full chart options with proper configuration
   */
  private getFullChartOptions(data: { values: [number, number][], sensorType: string }, config: {
    granularity: string;
    chartType: 'line' | 'bar' | 'scatter' | 'area' | 'step';
    grid?: { top?: number, bottom?: number, left?: number, right?: number }
  }): echarts.EChartsOption {
    const baseOptions = this.getBaseChartOptions(data);
     let xAxis: XAXisOption, yAxis: YAXisOption;
  xAxis = this.getEnhancedXAxisOptions(data.values);
  yAxis = this.getEnhancedYAxisOptions(data.values);
    return {
      ...baseOptions,
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
    grid: {
      ...baseOptions.grid,
      ...(config.grid || { bottom: 7, left: 7, right: 7, top: 20 }),
    },
    xAxis,
    yAxis,
          dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomLock: false,
        start: 0,
        end: 100,
        minSpan: 1,
        filterMode: 'filter' as 'filter',
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
        filterMode: 'none' as 'none',
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
        filterMode: 'none' as 'none'
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
        filterMode: 'none' as 'none'
      }
    ],
series: [{
  type: (
    config.chartType === 'area' ||
    config.chartType === 'step' ||
    config.chartType === 'line'
      ? 'line'
      : config.chartType
  ) as 'line' | 'bar' | 'scatter',
  data: data.values,
  showSymbol: false,
  symbol: (config.chartType === 'line' || config.chartType === 'area' || config.chartType === 'step') ? 'none' : undefined,
  itemStyle: { color: '#6366f1' },
  ...(config.chartType === 'area' && { areaStyle: { opacity: 0.4 } }),
  ...(config.chartType === 'bar' && { barWidth: this.calculateBarWidth() }),
  ...(config.chartType === 'step' && { step: 'middle' }),
}] as echarts.SeriesOption[],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => this.tooltipFormatter(params, data.sensorType)
      }
    };
  }

  /**
   * Get base chart options for all chart types
   */
  private getBaseChartOptions(data: { values: [number, number][], sensorType: string }): echarts.EChartsOption {
    return {
      grid: {
        top: '5%',
        bottom: '7%',
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
          if (!params || !params[0]) return '';
         
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

      dataZoom: this.getDataZoomConfig(),
      graphic: data.values.length === 0 ? [{
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: 'No data available',
          fontSize: 14,
          fill: '#999'
        }
      }] : []
    };
  }

  /**
   * Get area chart specific options
   */
private getAreaChartOptions(data: { values: [number, number][], sensorType: string }): echarts.EChartsOption {
  return {
    ...this.getBaseChartOptions(data),
    xAxis: this.getEnhancedXAxisOptions(data.values), // type: 'time'
    yAxis: this.getEnhancedYAxisOptions(data.values), // type: 'value'
    dataZoom: this.getDataZoomConfig(),
    series: [{
      type: 'line',
      data: data.values,
      smooth: true,
      areaStyle: {
        opacity: 0.4,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#6366f1' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.1)' }
        ])
      },
      lineStyle: {
        color: '#6366f1',
        width: 2
      },
      symbol: 'none'
    }]
  };
}

private getBarChartOptions(data: { values: [number, number][], sensorType: string }): echarts.EChartsOption {
  return {
    ...this.getBaseChartOptions(data),
    xAxis: this.getEnhancedXAxisOptions(data.values), // type: 'time'
    yAxis: this.getEnhancedYAxisOptions(data.values), // type: 'value'
    dataZoom: this.getDataZoomConfig(),
    series: [{
      type: 'bar',
      data: data.values,
      barWidth: this.calculateBarWidth(),
      itemStyle: {
        color: '#6366f1',
        borderRadius: [3, 3, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#4f46e5'
        }
      }
    }]
  };
}

private getStepChartOptions(data: { values: [number, number][], sensorType: string }): echarts.EChartsOption {
  return {
    ...this.getBaseChartOptions(data),
    xAxis: this.getEnhancedXAxisOptions(data.values), // type: 'time'
    yAxis: this.getEnhancedYAxisOptions(data.values), // type: 'value'
    dataZoom: this.getDataZoomConfig(),
    series: [{
      type: 'line',
      data: data.values,
      step: 'middle',
      smooth: false,
      lineStyle: {
        color: '#6366f1',
        width: 2
      },
      symbol: 'none'
    }]
  };
}

private getScatterOptions(data: { values: [number, number][], sensorType: string }): echarts.EChartsOption {
  return {
    ...this.getBaseChartOptions(data),
    xAxis: { type: 'value', scale: true },
    yAxis: { type: 'value', scale: true },
    dataZoom: this.getDataZoomConfig(),
    series: [{
      type: 'scatter',
      data: data.values,
      symbolSize: 8,
      itemStyle: {
        color: '#6366f1',
        opacity: 0.8,
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  };
}

  /**
   * Get enhanced X-axis options based on data and granularity
   */
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
        hideOverlap: true,
        rotate: 45,
        margin: 8,
        align: 'right',
        verticalAlign: 'bottom'
      },
      min: data.length > 0 ? data[0][0] - this.getGranularityMS() : undefined,
      max: data.length > 0 ? data[data.length - 1][0] + this.getGranularityMS() : undefined,
      minInterval: this.getMinIntervalForGranularity(),
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

  /**
   * Get enhanced Y-axis options based on data
   */
  private getEnhancedYAxisOptions(data: [number, number][]): YAXisOption {
    const baseConfig = this.getYAxisOptions();
   
    if (!data.length) return baseConfig;

    const values = data.map(d => d[1]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
   
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

  /**
   * Get base X-axis options
   */
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
      splitNumber: 10,
      axisPointer: {
        label: {
          rotate: 45,
          margin: 15
        }
      }
    } as XAXisOption;
  }

  /**
   * Get base Y-axis options
   */
  private getYAxisOptions(): YAXisOption {
    return {
      type: 'value',
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { show: true, lineStyle: { color: '#eee' } },
      axisLabel: {
        margin: 1
      }
    };
  }

  /**
   * Get data zoom configuration for interactive charts
   */
  private getDataZoomConfig(): any[] {
    return [
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomLock: false,
        start: 0,
        end: 100,
        minSpan: 5,
        filterMode: 'filter' as 'filter',
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
        filterMode: 'none' as 'none',
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
        preventDefaultMouseMove: false
      }
    ];
  }

  /**
   * Format tooltip content
   */
  private tooltipFormatter(params: any, sensorType: string): string {
    if (!params || !params[0]) return '';
   
    const date = new Date(params[0].value[0]);
    return `
      <strong>${sensorType}</strong><br>
      ${date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      })}
      (${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })})
      ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')} UTC<br>
      ${params[0].marker} ${params[0].value[1].toFixed(2)}
    `;
  }

  /**
   * Format date based on granularity
   */
private formatDate(value: number, granularity: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  switch (granularity) {
    case 'minute':
      return echarts.time.format(date, '{HH}:{mm}', true);
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

  /**
   * Get appropriate time interval for the current granularity
   */
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

  /**
   * Calculate appropriate bar width based on granularity
   */
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
}