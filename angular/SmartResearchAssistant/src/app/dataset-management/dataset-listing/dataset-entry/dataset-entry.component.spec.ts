import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetEntryComponent } from './dataset-entry.component';

describe('DatasetEntryComponent', () => {
  let component: DatasetEntryComponent;
  let fixture: ComponentFixture<DatasetEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
