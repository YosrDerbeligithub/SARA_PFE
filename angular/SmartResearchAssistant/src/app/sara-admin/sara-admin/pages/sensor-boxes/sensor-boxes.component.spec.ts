import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorBoxesComponent } from './sensor-boxes.component';

describe('SensorBoxesComponent', () => {
  let component: SensorBoxesComponent;
  let fixture: ComponentFixture<SensorBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorBoxesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
