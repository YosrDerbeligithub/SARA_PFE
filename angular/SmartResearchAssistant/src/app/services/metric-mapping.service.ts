import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetricMappingService {

  private frontendToBackendMap: { [key: string]: string } = {
    'mean': 'average',
    'median': 'median',
    'minimum': 'min',
    'maximum': 'max',
    'skewness': 'skewness',
    'sum': 'sum',
  };

  getBackendMetric(frontendMetric: string): string {
    return this.frontendToBackendMap[frontendMetric] || frontendMetric;
  }
}
