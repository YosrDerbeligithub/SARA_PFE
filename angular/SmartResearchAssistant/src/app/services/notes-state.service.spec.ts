import { TestBed } from '@angular/core/testing';

import { NotesStateService } from './notes-state.service';

describe('NotesStateService', () => {
  let service: NotesStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotesStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
