import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityClassificationComponent } from './activity-classification.component';

describe('ActivityClassificationComponent', () => {
  let component: ActivityClassificationComponent;
  let fixture: ComponentFixture<ActivityClassificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityClassificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
