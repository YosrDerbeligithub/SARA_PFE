import { TestBed } from '@angular/core/testing';

import { HvisualizationService } from './hvisualization.service';

describe('HvisualizationService', () => {
  let service: HvisualizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HvisualizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
