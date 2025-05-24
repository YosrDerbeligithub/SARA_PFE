import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetListingComponent } from './dataset-listing.component';

describe('DatasetListingComponent', () => {
  let component: DatasetListingComponent;
  let fixture: ComponentFixture<DatasetListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
