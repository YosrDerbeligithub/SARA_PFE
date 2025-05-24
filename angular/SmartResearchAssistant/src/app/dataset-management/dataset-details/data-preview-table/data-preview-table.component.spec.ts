import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPreviewTableComponent } from './data-preview-table.component';

describe('DataPreviewTableComponent', () => {
  let component: DataPreviewTableComponent;
  let fixture: ComponentFixture<DataPreviewTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPreviewTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataPreviewTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
