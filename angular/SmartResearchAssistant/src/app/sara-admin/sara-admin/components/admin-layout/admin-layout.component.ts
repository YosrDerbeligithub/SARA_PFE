// src/app/sara-admin/components/admin-layout/admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router'; // Import RouterModule


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: true,
  imports: [AdminSidebarComponent, AdminHeaderComponent, BreadcrumbComponent, RouterModule] // Add RouterModule to imports
})
export class AdminLayoutComponent implements OnInit {
  constructor(public breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
    // Initialize any layout-specific logic here
  }
}