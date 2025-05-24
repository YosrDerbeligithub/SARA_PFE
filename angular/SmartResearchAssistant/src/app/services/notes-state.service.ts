// notes-state.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotesStateService {
  private notesState: { [route: string]: { show: boolean; content: string } } = {};

  getNotesState(route: string): { show: boolean; content: string } {
    return this.notesState[route] || { show: false, content: '' };
  }

  setNotesState(route: string, show: boolean, content: string): void {
    this.notesState[route] = { show, content };
  }

  clearState(route: string): void {
    delete this.notesState[route];
  }
  
}