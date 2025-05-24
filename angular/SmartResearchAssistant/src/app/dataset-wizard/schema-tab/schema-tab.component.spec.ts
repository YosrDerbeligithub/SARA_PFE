import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaTabComponent } from './schema-tab.component';

describe('SchemaTabComponent', () => {
  let component: SchemaTabComponent;
  let fixture: ComponentFixture<SchemaTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemaTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
