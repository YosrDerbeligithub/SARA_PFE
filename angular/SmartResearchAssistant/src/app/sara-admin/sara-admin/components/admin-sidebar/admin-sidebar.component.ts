// src/app/sara-admin/components/admin-sidebar/admin-sidebar.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../services/sidebar.service';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { CommonModule } from '@angular/common';


interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  standalone:true,
  imports: [RouterModule, CommonModule] // Add RouterModule to imports
})
export class AdminSidebarComponent implements OnInit {
  currentRoute = '';
  isMobile = false;
  
  navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '/admin/dashboard' }
      ]
    },
    {
      label: 'Site Management',
      items: [
        { label: 'Sites', icon: 'fas fa-building', route: '/admin/sites' },
        { label: 'Locations', icon: 'fas fa-home', route: '/admin/locations' }
      ]
    },
    {
      label: 'Sensor Management',
      items: [
        { label: 'Sensor Boxes', icon: 'fas fa-microchip', route: '/admin/sensor-boxes' },
        { label: 'Sensor Types', icon: 'fas fa-gauge', route: '/admin/sensor-types' },
        { label: 'Sensor Assignments', icon: 'fas fa-cogs', route: '/admin/sensor-assignments' }
      ]
    }

  ];

  constructor(
    private router: Router,
    public sidebarService: SidebarService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && !this.sidebarService.isMobileOpen) {
      this.sidebarService.collapse();
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }
  
}
