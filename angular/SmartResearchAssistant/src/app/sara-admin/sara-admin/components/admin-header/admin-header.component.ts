// src/app/sara-admin/components/admin-header/admin-header.component.ts
import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css'],
  standalone:true,
  imports:[CommonModule]
})
export class AdminHeaderComponent {
  userMenuOpen = false;
  notificationsOpen = false;
  
  constructor(
    public sidebarService: SidebarService,
    public notificationService: NotificationService
  ) {}

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.userMenuOpen = false;
    }
  }

  logout(): void {
    // Implement logout logic
    console.log('Logging out...');
  }
}