import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DifferentSensorTypesComponent } from './different-sensor-types.component';

describe('DifferentSensorTypesComponent', () => {
  let component: DifferentSensorTypesComponent;
  let fixture: ComponentFixture<DifferentSensorTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DifferentSensorTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DifferentSensorTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
