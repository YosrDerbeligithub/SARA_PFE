import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaraHeaderComponent } from './sara-header.component';

describe('SaraHeaderComponent', () => {
  let component: SaraHeaderComponent;
  let fixture: ComponentFixture<SaraHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaraHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaraHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
