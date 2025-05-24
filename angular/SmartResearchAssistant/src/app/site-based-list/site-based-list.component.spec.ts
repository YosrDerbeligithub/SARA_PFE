import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteBasedListComponent } from './site-based-list.component';

describe('SiteBasedListComponent', () => {
  let component: SiteBasedListComponent;
  let fixture: ComponentFixture<SiteBasedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteBasedListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteBasedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
