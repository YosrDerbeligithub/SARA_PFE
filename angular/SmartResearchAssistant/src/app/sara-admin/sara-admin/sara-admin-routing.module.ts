// src/app/sara-admin/sara-admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SitesComponent } from './pages/sites/sites.component';
import { LocationsComponent } from './pages/locations/locations.component';
import { SensorBoxesComponent } from './pages/sensor-boxes/sensor-boxes.component';
import { SensorTypesComponent } from './pages/sensor-types/sensor-types.component';
import { SensorAssignmentsComponent } from './pages/sensor-assignments/sensor-assignments.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'sites', component: SitesComponent },
      { path: 'locations', component: LocationsComponent },
      { path: 'sensor-boxes', component: SensorBoxesComponent },
      { path: 'sensor-types', component: SensorTypesComponent },
      { path: 'sensor-assignments', component: SensorAssignmentsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaraAdminRoutingModule { }