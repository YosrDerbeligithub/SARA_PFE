import { Routes } from '@angular/router';
import { SameSensorTypeComponent } from './same-sensor-type/same-sensor-type.component';
import { DifferentSensorTypesComponent } from './different-sensor-types/different-sensor-types.component';
import { HistoricalVisualizationComponent } from './historical-visualization/historical-visualization.component';
import { ActivityClassificationComponent } from './activity-classification/activity-classification.component';
import { AuthComponent } from './auth/auth.component';
//import { AuthGuard } from './guards/auth.guard'; // Import your AuthGuard
import { RealTimeMonitoringComponent } from './real-time-monitoring/real-time-monitoring.component';
import { SaraAdminModule } from './sara-admin/sara-admin/sara-admin.module';
import { DatasetWizardComponent } from './dataset-wizard/dataset-wizard.component';
import { DatasetManagementComponent } from './dataset-management/dataset-management.component';
export const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: AuthComponent },
  { path: 'signup', component: AuthComponent },
  {
    path: 'admin',
    loadChildren: () => import('./sara-admin/sara-admin/sara-admin.module').then(m => m.SaraAdminModule) // Ensure the file exists at this path
  },
  // Protected routes (add AuthGuard later)
  { path: 'dataset-wizard', component: DatasetWizardComponent },
  { path: 'historical-visualization', component: HistoricalVisualizationComponent },
  { path: 'activity-classification', component: ActivityClassificationComponent },
  { path: 'real-time-monitoring', component: RealTimeMonitoringComponent },
  { path: 'datasets', component: DatasetManagementComponent },
  { path: 'datasets/:id', component: DatasetManagementComponent },
  { path: 'datasets/new', component: DatasetWizardComponent },
  { 
    path: 'data-comparison',
    children: [
      { path: 'same-type', component: SameSensorTypeComponent },
      { path: 'different-types', component: DifferentSensorTypesComponent },
      { path: '', redirectTo: 'same-type', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'signin' }
];