// view-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private currentViewSubject = new BehaviorSubject<'same' | 'different'>('same');
  currentView$ = this.currentViewSubject.asObservable();

  switchView(view: 'same' | 'different') {
    this.currentViewSubject.next(view);
  }
}