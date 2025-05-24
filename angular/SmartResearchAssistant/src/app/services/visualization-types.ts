// visualization-types.ts
export enum ChartType {
    Line = 'line',
    Heatmap = 'heatmap',
    Bar = 'bar',
    BoxPlot = 'boxplot',
    Area = 'area',
    Surface3D = 'surface3d',
    ErrorBand = 'errorband',
    Scatter = 'scatter',
    EventFrequency = 'eventfrequency',
    DensityStrip = 'densitystrip',
    Step = 'step',
    BleDevices = 'bledevices',
}


  
  export interface ChartConfig {
    icon: string;
    formatter: (data: any) => echarts.EChartsOption;
  }