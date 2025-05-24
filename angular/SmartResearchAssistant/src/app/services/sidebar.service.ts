import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private collapsed = signal(false);

  toggleSidebar() {
    this.collapsed.update(state => !state);
  }

  isCollapsed() {
    return this.collapsed();
  }
}