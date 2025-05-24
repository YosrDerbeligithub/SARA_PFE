import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaraSidebarComponent } from './sara-sidebar.component';

describe('SaraSidebarComponent', () => {
  let component: SaraSidebarComponent;
  let fixture: ComponentFixture<SaraSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaraSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaraSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
