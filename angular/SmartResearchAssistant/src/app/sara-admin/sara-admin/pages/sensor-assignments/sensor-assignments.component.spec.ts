import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorAssignmentsComponent } from './sensor-assignments.component';

describe('SensorAssignmentsComponent', () => {
  let component: SensorAssignmentsComponent;
  let fixture: ComponentFixture<SensorAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorAssignmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
