import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorVisualComponent } from './sensor-visual.component';

describe('SensorVisualComponent', () => {
  let component: SensorVisualComponent;
  let fixture: ComponentFixture<SensorVisualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorVisualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
