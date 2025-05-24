import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeBasedListComponent } from './type-based-list.component';

describe('TypeBasedListComponent', () => {
  let component: TypeBasedListComponent;
  let fixture: ComponentFixture<TypeBasedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeBasedListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeBasedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
