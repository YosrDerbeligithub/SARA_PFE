import { HistoricalVisualizationComponent } from './../historical-visualization/historical-visualization.component';
import { TestBed } from '@angular/core/testing';

import { VisualizationService} from './hvisualization.service';

describe('HvisualizationService', () => {
  let service: VisualizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
