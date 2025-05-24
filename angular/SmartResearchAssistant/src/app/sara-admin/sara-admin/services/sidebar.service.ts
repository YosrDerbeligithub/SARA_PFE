// src/app/sara-admin/services/sidebar.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isCollapsed = false;
  isMobileOpen = false;

  constructor() {
    // Check localStorage for saved state
    const savedState = localStorage.getItem('sara-admin:sidebar');
    if (savedState) {
      this.isCollapsed = savedState === 'collapsed';
    }
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sara-admin:sidebar', this.isCollapsed ? 'collapsed' : 'expanded');
  }

  collapse(): void {
    this.isCollapsed = true;
    localStorage.setItem('sara-admin:sidebar', 'collapsed');
  }

  expand(): void {
    this.isCollapsed = false;
    localStorage.setItem('sara-admin:sidebar', 'expanded');
  }

  toggleMobile(): void {
    this.isMobileOpen = !this.isMobileOpen;
    // When opening mobile sidebar, ensure content is visible
    if (this.isMobileOpen) {
      this.isCollapsed = false;
    }
  }

  openMobile(): void {
    this.isMobileOpen = true;
    this.isCollapsed = false;
  }

  closeMobile(): void {
    this.isMobileOpen = false;
  }
}