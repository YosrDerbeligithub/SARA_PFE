import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetWizardComponent } from './dataset-wizard.component';

describe('DatasetWizardComponent', () => {
  let component: DatasetWizardComponent;
  let fixture: ComponentFixture<DatasetWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetWizardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
