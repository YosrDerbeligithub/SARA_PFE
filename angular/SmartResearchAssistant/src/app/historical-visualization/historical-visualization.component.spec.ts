import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalVisualizationComponent } from './historical-visualization.component';

describe('HistoricalVisualizationComponent', () => {
  let component: HistoricalVisualizationComponent;
  let fixture: ComponentFixture<HistoricalVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalVisualizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
