declare module 'echarts-gl' {
    import * as echarts from 'echarts';
    
    interface GLSerieOption extends echarts.SeriesOption {
      type?: 'surface' | 'scatter3D' | 'line3D' | 'bar3D';
      shading?: 'color' | 'realistic' | 'lambert';
      itemStyle?: {
        opacity?: number;
      };
    }
  
    export interface SurfaceSeriesOption extends GLSerieOption {
      type: 'surface';
    }
  
    export interface Scatter3DSeriesOption extends GLSerieOption {
      type: 'scatter3D';
    }
  
    export interface Bar3DSeriesOption extends GLSerieOption {
      type: 'bar3D';
    }
  }