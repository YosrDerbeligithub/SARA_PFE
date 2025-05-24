import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SameSensorTypeComponent } from './same-sensor-type.component';

describe('SameSensorTypeComponent', () => {
  let component: SameSensorTypeComponent;
  let fixture: ComponentFixture<SameSensorTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SameSensorTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SameSensorTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
