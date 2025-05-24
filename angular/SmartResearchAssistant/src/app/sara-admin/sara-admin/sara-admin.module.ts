// src/app/sara-admin/sara-admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SaraAdminRoutingModule } from './sara-admin-routing.module';

// Layout Components (all standalone)
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { HierarchyTreeComponent } from './components/hierarchy-tree/hierarchy-tree.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';

// Page Components (all standalone)
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SitesComponent } from './pages/sites/sites.component';
import { LocationsComponent } from './pages/locations/locations.component';
import { SensorBoxesComponent } from './pages/sensor-boxes/sensor-boxes.component';
import { SensorTypesComponent } from './pages/sensor-types/sensor-types.component';
import { SensorAssignmentsComponent } from './pages/sensor-assignments/sensor-assignments.component';

// Services
import { SidebarService } from './services/sidebar.service';
import { BreadcrumbService } from './services/breadcrumb.service';
import { NotificationService } from './services/notification.service';

@NgModule({
  // No declarations needed for standalone components
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SaraAdminRoutingModule,

    // Import all standalone components
    AdminLayoutComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    BreadcrumbComponent,
    HierarchyTreeComponent,
    StatCardComponent,

    // Page Components
    DashboardComponent,
    SitesComponent,
    LocationsComponent,
    SensorBoxesComponent,
    SensorTypesComponent,
    SensorAssignmentsComponent,
  ],
  providers: [
    SidebarService,
    BreadcrumbService,
    NotificationService
  ],
  // Remove exports (or keep if exporting routes via routing module)
})
export class SaraAdminModule { }